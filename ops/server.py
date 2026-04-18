#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse
import hashlib
import io
import json
import os
import re
import secrets
import shutil
import sqlite3
import sys
import time
import zipfile

WEB_ROOT = Path(__file__).resolve().parent.parent / "web"
GENERATED_ROOT = Path(__file__).resolve().parent.parent / "generated-live"
TMP_GENERATED_ROOT = GENERATED_ROOT / ".tmp"
AUTH_ROOT = GENERATED_ROOT / ".auth"
DB_PATH = AUTH_ROOT / "multiclaw.db"
HOST = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8813
SESSION_COOKIE = "multiclaw_session"
SESSION_TTL_SECONDS = 60 * 60 * 24 * 14
RATE_LIMITS = {}
AUTH_MODE = (os.getenv("MULTICLAW_AUTH_MODE", "multi-user") or "multi-user").strip().lower()
SINGLE_USER_SESSION = {"email": "local@multiclaw", "mode": "single-user"}


def now_utc():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def allow_rate(key: str, limit: int, window_seconds: int):
    now = time.time()
    entries = RATE_LIMITS.get(key, [])
    entries = [stamp for stamp in entries if now - stamp < window_seconds]
    if len(entries) >= limit:
        RATE_LIMITS[key] = entries
        return False
    entries.append(now)
    RATE_LIMITS[key] = entries
    return True


def parse_utc_timestamp(value: str):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S UTC").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug or "multiclaw-project"


def read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def append_company_event(company_id: str, kind: str, title: str, detail: str, payload=None):
    events_path = GENERATED_ROOT / company_id / "events.json"
    events = read_json(events_path, [])
    events.insert(0, {
        "timestamp": now_utc(),
        "kind": kind,
        "title": title,
        "detail": detail,
        "payload": payload or {},
    })
    write_json(events_path, events[:100])


def load_company_events(company_id: str):
    return read_json(GENERATED_ROOT / company_id / "events.json", [])


def build_execution_state(company, events=None):
    events = events or []
    next_steps = company.get("nextSteps") or []
    missions = company.get("missions") or []
    last_event = events[0] if events else None
    has_operator_input = any(event.get("kind") == "operator-ask" for event in events)

    if has_operator_input:
        status = "active"
        summary = "The company has operator input and visible execution activity."
    elif events:
        status = "initialized"
        summary = "The company has been generated and is waiting for stronger operator steering."
    else:
        status = "warming-up"
        summary = "The company exists, but visible execution has not started yet."

    mission_board = []
    for index, mission in enumerate(missions):
        mission_board.append({
            "title": mission,
            "status": "active" if index == 0 and events else "queued",
        })

    next_step_board = []
    for index, step in enumerate(next_steps):
        next_step_board.append({
            "title": step,
            "status": "recommended" if index == 0 else "pending",
        })

    return {
        "status": status,
        "summary": summary,
        "focus": (next_steps[:1] or missions[:1] or ["Await first operator instruction."])[0],
        "eventsCount": len(events),
        "missionsCount": len(missions),
        "nextStepsCount": len(next_steps),
        "lastActivityAt": last_event.get("timestamp") if last_event else company.get("generatedAt"),
        "missionBoard": mission_board,
        "nextStepBoard": next_step_board,
    }


def update_company_execution_state(company_id: str, company=None):
    company = company or load_company(company_id)
    if company is None:
        return None
    events = load_company_events(company_id)
    state = build_execution_state(company, events)
    write_json(GENERATED_ROOT / company_id / "EXECUTION-STATE.json", state)
    return state


def run_company_cycle(company_id: str, company=None):
    company = company or load_company(company_id)
    if company is None:
        return None

    events = load_company_events(company_id)
    cycle_number = sum(1 for event in events if event.get("kind") == "execution-cycle") + 1
    state = read_json(GENERATED_ROOT / company_id / "EXECUTION-STATE.json", None) or build_execution_state(company, events)
    focus = state.get("focus") or (company.get("nextSteps") or company.get("missions") or ["Await first operator instruction."])[0]
    mission = (company.get("missions") or ["No mission declared yet."])[0]
    next_step = (company.get("nextSteps") or ["No next step declared yet."])[0]
    artifact_name = f"CYCLE-{cycle_number:03}.md"
    cycle_time = now_utc()

    (GENERATED_ROOT / company_id / artifact_name).write_text(
        f"# Execution Cycle {cycle_number}\n\n"
        f"- Company: {company.get('projectName', company_id)}\n"
        f"- Cycle: {cycle_number}\n"
        f"- Generated at: {cycle_time}\n"
        f"- Focus: {focus}\n"
        f"- Primary mission: {mission}\n"
        f"- Recommended next action: {next_step}\n",
        encoding="utf-8",
    )

    append_company_event(
        company_id,
        "execution-cycle",
        f"Execution cycle {cycle_number}",
        f"Advanced the company around: {focus}",
        {"cycleNumber": cycle_number, "artifact": artifact_name, "focus": focus},
    )
    state = update_company_execution_state(company_id, company)
    return {
        "cycleNumber": cycle_number,
        "artifact": artifact_name,
        "focus": focus,
        "status": state.get("status") if state else "active",
        "summary": state.get("summary") if state else "Execution cycle completed.",
    }


def hash_password(password: str, salt_hex: str) -> str:
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return digest.hex()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


def get_users():
    with get_db() as conn:
        rows = conn.execute("SELECT email, salt, password_hash, created_at FROM users ORDER BY created_at DESC").fetchall()
    return [
        {"email": row["email"], "salt": row["salt"], "passwordHash": row["password_hash"], "createdAt": row["created_at"]}
        for row in rows
    ]


def cleanup_expired_sessions(conn=None):
    owns_conn = conn is None
    if conn is None:
        conn = get_db()
    try:
        rows = conn.execute("SELECT token, created_at FROM sessions").fetchall()
        expired_tokens = []
        now = datetime.now(timezone.utc)
        for row in rows:
            created_at = parse_utc_timestamp(row["created_at"])
            if created_at is None or (now - created_at).total_seconds() > SESSION_TTL_SECONDS:
                expired_tokens.append(row["token"])
        if expired_tokens:
            conn.executemany("DELETE FROM sessions WHERE token = ?", [(token,) for token in expired_tokens])
    finally:
        if owns_conn:
            conn.close()


def get_sessions():
    with get_db() as conn:
        cleanup_expired_sessions(conn)
        rows = conn.execute("SELECT token, email, created_at FROM sessions").fetchall()
    return {row["token"]: {"email": row["email"], "createdAt": row["created_at"]} for row in rows}


def create_user(email: str, password: str):
    users = get_users()
    if any(user["email"] == email for user in users):
        raise ValueError("Account already exists for this email.")

    salt_hex = secrets.token_hex(16)
    with get_db() as conn:
        conn.execute(
            "INSERT INTO users (email, salt, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (email, salt_hex, hash_password(password, salt_hex), now_utc()),
        )


def verify_user(email: str, password: str):
    users = get_users()
    user = next((entry for entry in users if entry["email"] == email), None)
    if not user:
        return False
    return user["passwordHash"] == hash_password(password, user["salt"])


def create_session(email: str):
    token = secrets.token_urlsafe(32)
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions (token, email, created_at) VALUES (?, ?, ?)",
            (token, email, now_utc()),
        )
    return token


def delete_session(token: str):
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def infer_archetype(business_model: str, description: str) -> str:
    text = f"{business_model} {description}".lower()
    if "marketplace" in text:
        return "Marketplace company"
    if "ecommerce" in text or "e-commerce" in text or "shop" in text:
        return "E-commerce company"
    if "content" in text or "media" in text:
        return "Content company"
    if "lead" in text or "service" in text:
        return "Revenue ops company"
    return "Product operating company"


def parse_custom_roles(raw_value: str):
    roles = []
    for line in (raw_value or "").splitlines():
        line = line.strip()
        if not line:
            continue
        if "|" in line:
            title, scope = [part.strip() for part in line.split("|", 1)]
        else:
            title, scope = line, "Owns a user-defined company function."
        roles.append({"title": title, "scope": scope})
    return roles


def build_roles(archetype: str, role_template: str = "Balanced", custom_roles_raw: str = ""):
    common = [
        {"title": "Operator", "scope": "Runs priorities, execution rhythm, and the company pulse."},
        {"title": "CTO / Systems Lead", "scope": "Owns architecture, infrastructure, model routing, and technical integrity."},
        {"title": "Product Lead", "scope": "Owns roadmap, workflows, user value, and scope decisions."},
        {"title": "Growth Lead", "scope": "Owns messaging, acquisition, activation, and conversion loops."},
        {"title": "QA / Reliability Lead", "scope": "Owns trust, quality, monitoring, and resilience."},
    ]

    if archetype == "Revenue ops company":
        common.extend([
            {"title": "Sales Ops Lead", "scope": "Owns lead intake, qualification, and routing."},
            {"title": "Follow-up Lead", "scope": "Owns reminders, reactivation, and close support."},
        ])
    elif archetype == "Marketplace company":
        common.extend([
            {"title": "Supply Lead", "scope": "Owns supply-side quality, onboarding, and health."},
            {"title": "Demand Lead", "scope": "Owns buyer funnel, matching, and demand health."},
        ])
    else:
        common.extend([
            {"title": "Support Lead", "scope": "Owns user issues, feedback loops, and support quality."},
            {"title": "Research Lead", "scope": "Owns strategic discovery and deeper market learning."},
        ])

    template_roles = {
        "Executive": [
            {"title": "CFO / Finance Lead", "scope": "Owns financial posture, budget awareness, and business health."},
            {"title": "COO / Operations Director", "scope": "Owns operating cadence, delivery quality, and execution discipline."},
        ],
        "Engineering-heavy": [
            {"title": "Engineering Lead", "scope": "Owns engineering throughput, code quality, and implementation velocity."},
            {"title": "Production Lead", "scope": "Owns runtime stability, release readiness, and deployment discipline."},
        ],
        "Go-to-market": [
            {"title": "Marketing Lead", "scope": "Owns campaigns, brand pull, and market visibility."},
            {"title": "Revenue Lead", "scope": "Owns commercial motion, pricing pressure, and funnel performance."},
        ],
    }.get(role_template, [])

    merged = common + template_roles + parse_custom_roles(custom_roles_raw)
    deduped = []
    seen = set()
    for role in merged:
        key = role["title"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(role)
    return deduped


def build_routing(description: str):
    text = description.lower()
    if "premium" in text or "high-ticket" in text:
        return {
            "chat": "Anthropic / OpenAI",
            "reasoning": "OpenAI / Anthropic",
            "speed": "Groq",
            "privacy": "Ollama / Local fallback",
        }

    return {
        "chat": "OpenAI / OpenRouter",
        "reasoning": "Anthropic / OpenAI",
        "speed": "Groq",
        "privacy": "Ollama / Local fallback",
    }


def build_missions(project_name: str, top_goals: str):
    return [
        f"Turn {project_name} into a fully operational AI company, not just a product shell.",
        f"Win the first week around: {top_goals}.",
        "Stand up one reliable daily execution loop with visible outcomes.",
        "Keep communication compact, ownership clear, and blockers explicit.",
    ]


def build_contact_surfaces():
    return [
        {
            "name": "Web workspace",
            "status": "Live now",
            "purpose": "Operate the company, inspect outputs, and steer the first cycle through the main product UI.",
            "substrate": "MultiClaw web surface",
        },
        {
            "name": "CLI",
            "status": "Live now",
            "purpose": "Install, configure, start, stop, verify, and operate the runtime without depending on the web UI.",
            "substrate": "MultiClaw command layer",
        },
        {
            "name": "Telegram and future channels",
            "status": "Planned",
            "purpose": "Add messaging channels after the core runtime is live and steady.",
            "substrate": "MultiClaw channel layer",
        },
    ]


def parse_existing_assets(raw_value: str):
    assets = []
    for line in (raw_value or "").splitlines():
        line = line.strip()
        if line:
            assets.append(line)
    return assets


def build_company_reply(company, prompt: str):
    prompt = (prompt or "").strip()
    prompt_lower = prompt.lower()
    roles = company.get("roles", [])
    missions = company.get("missions", [])
    next_steps = company.get("nextSteps", [])
    contact_surfaces = company.get("contactSurfaces", [])
    operator = roles[0]["title"] if roles else "Primary Operator"

    if any(token in prompt_lower for token in ["next", "priority", "priorities", "fix", "what should"]):
        reply = "Here is the most useful near-term focus for this company right now."
        suggested = next_steps[:3] or missions[:3]
    elif any(token in prompt_lower for token in ["talk", "contact", "reach", "channel", "telegram"]):
        reply = "These are the strongest current contact and operating surfaces for this company."
        suggested = [
            f"{surface['name']}: {surface['status']}"
            for surface in contact_surfaces[:3]
        ]
    elif any(token in prompt_lower for token in ["mission", "goal", "plan"]):
        reply = "These are the current mission-level directions this company is optimized around."
        suggested = missions[:3]
    else:
        reply = (
            f"{company.get('projectName', 'This company')} is active. The company is structured to operate through clear leadership, mission focus, and visible next steps."
        )
        suggested = [
            *(next_steps[:2] or []),
            *(missions[:1] or []),
        ]

    return {
        "speaker": operator,
        "reply": reply,
        "suggestedActions": suggested,
        "companyId": company.get("companyId"),
    }


def build_next_steps(project_name: str):
    return [
        f"Review the generated structure for {project_name}.",
        "Confirm the highest-priority operating loop.",
        "Activate the first real workflow worth running daily.",
        "Promote the strongest outputs into reusable company templates.",
    ]


def list_companies():
    companies = []
    for company_dir in sorted(GENERATED_ROOT.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not company_dir.is_dir() or company_dir.name == ".auth":
            continue
        company_file = company_dir / "company.json"
        if not company_file.exists():
            continue
        try:
            company = json.loads(company_file.read_text(encoding="utf-8"))
            company.setdefault("companyId", company_dir.name)
            if not company.get("generatedAt"):
                mtime = datetime.fromtimestamp(company_file.stat().st_mtime, timezone.utc)
                company["generatedAt"] = mtime.strftime("%Y-%m-%d %H:%M:%S UTC")
            company.setdefault("productOrigin", "Existing product")
            company.setdefault("autonomyMode", "Operator-assisted")
            company.setdefault("nextSteps", build_next_steps(company.get("projectName", company_dir.name)))
            execution_state = read_json(company_dir / "EXECUTION-STATE.json", None)
            if execution_state is None:
                execution_state = update_company_execution_state(company_dir.name, company)
            company["executionState"] = execution_state
            companies.append(company)
        except Exception:
            continue
    return companies


def build_stats():
    companies = list_companies()
    users = get_users()
    artifacts = 0
    for company in companies:
        company_dir = GENERATED_ROOT / company["companyId"]
        artifacts += len([path for path in company_dir.iterdir() if path.is_file()]) if company_dir.exists() else 0
    return {
        "companies": len(companies),
        "users": 1 if AUTH_MODE == "single-user" else len(users),
        "artifacts": artifacts,
        "mode": AUTH_MODE,
    }


def build_pulse():
    companies = list_companies()
    total_artifacts = 0
    total_events = 0
    latest_activity = None
    latest_company = None

    for company in companies:
        company_id = company.get("companyId")
        if not company_id:
            continue
        company_dir = GENERATED_ROOT / company_id
        if company_dir.exists():
            total_artifacts += len([p for p in company_dir.iterdir() if p.is_file()])
        events = load_company_events(company_id)
        total_events += len(events)
        candidate = None
        if events:
            candidate = parse_utc_timestamp(events[0].get("timestamp"))
        if not candidate:
            candidate = parse_utc_timestamp(company.get("generatedAt"))
        if candidate and (latest_activity is None or candidate > latest_activity):
            latest_activity = candidate
            latest_company = {
                "companyId": company_id,
                "projectName": company.get("projectName", company_id),
            }

    mode = AUTH_MODE
    return {
        "mode": mode,
        "companies": len(companies),
        "artifacts": total_artifacts,
        "events": total_events,
        "cognitiveLoad": "idle (0 in-flight)",
        "latestActivityAt": latest_activity.strftime("%Y-%m-%d %H:%M:%S UTC") if latest_activity else None,
        "latestCompany": latest_company,
        "pulseAt": now_utc(),
    }


def load_company(company_id: str):
    company_file = GENERATED_ROOT / company_id / "company.json"
    if not company_file.exists():
        return None
    company = json.loads(company_file.read_text(encoding="utf-8"))
    company.setdefault("companyId", company_id)
    if not company.get("generatedAt"):
        mtime = datetime.fromtimestamp(company_file.stat().st_mtime, timezone.utc)
        company["generatedAt"] = mtime.strftime("%Y-%m-%d %H:%M:%S UTC")
    company.setdefault("productOrigin", "Existing product")
    company.setdefault("autonomyMode", "Operator-assisted")
    company.setdefault("nextSteps", build_next_steps(company.get("projectName", company_id)))
    company.setdefault(
        "companySoul",
        build_company_soul(
            company.get("projectName", company_id),
            company.get("description", "A serious AI product."),
            company.get("tone", "Sharp, premium, operational"),
            company.get("autonomyMode", "Operator-assisted"),
            company.get("archetype", "saas-product"),
        ),
    )
    company.setdefault("contactSurfaces", build_contact_surfaces())
    execution_state = read_json(GENERATED_ROOT / company_id / "EXECUTION-STATE.json", None)
    if execution_state is None:
        execution_state = update_company_execution_state(company_id, company)
    company["executionState"] = execution_state
    return company


def build_company_soul(project_name: str, description: str, tone: str, autonomy_mode: str, archetype: str):
    return {
        "identity": f"{project_name} should feel like a living company, not a disposable assistant shell.",
        "promise": f"Operate {project_name} with deep context, coherent leadership, and visible operational intent.",
        "style": tone,
        "autonomy": autonomy_mode,
        "archetype": archetype,
    }


def write_company_artifacts(output_dir: Path, result, roles, missions, next_steps, existing_assets, contact_surfaces, routing):
    output_dir.mkdir(parents=True, exist_ok=True)
    project_name = result["projectName"]
    slug = result["companyId"]
    product_origin = result["productOrigin"]
    autonomy_mode = result["autonomyMode"]
    archetype = result["archetype"]
    audience = result["audience"]
    business_model = result["businessModel"]
    stage = result["stage"]
    tone = result["tone"]
    generated_at = result["generatedAt"]
    company_soul = result["companySoul"]

    (output_dir / "company.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    (output_dir / "README.md").write_text(
        f"# {project_name}\n\n"
        f"Generated by MultiClaw.\n\n"
        f"- Company ID: {slug}\n"
        f"- Product origin: {product_origin}\n"
        f"- Autonomy mode: {autonomy_mode}\n"
        f"- Archetype: {archetype}\n"
        f"- Audience: {audience}\n"
        f"- Business model: {business_model}\n"
        f"- Stage: {stage}\n"
        f"- Generated at: {generated_at}\n",
        encoding="utf-8",
    )
    (output_dir / "ORG-CHART.md").write_text(
        "# Org Chart\n\n" + "\n".join([f"- {role['title']}: {role['scope']}" for role in roles]),
        encoding="utf-8",
    )
    (output_dir / "MISSION-001.md").write_text(
        "# Mission 001\n\n" + "\n".join([f"- {mission}" for mission in missions]),
        encoding="utf-8",
    )
    (output_dir / "COMPANY.md").write_text(
        f"# {project_name} Company\n\n"
        f"- Product origin: {product_origin}\n"
        f"- Autonomy mode: {autonomy_mode}\n"
        f"- Archetype: {archetype}\n"
        f"- Audience: {audience}\n"
        f"- Tone: {tone}\n"
        f"- Generated at: {generated_at}\n",
        encoding="utf-8",
    )
    (output_dir / "SOUL.md").write_text(
        f"# {project_name} Soul\n\n"
        f"- Identity: {company_soul['identity']}\n"
        f"- Promise: {company_soul['promise']}\n"
        f"- Style: {company_soul['style']}\n"
        f"- Autonomy: {company_soul['autonomy']}\n"
        f"- Archetype: {company_soul['archetype']}\n",
        encoding="utf-8",
    )
    (output_dir / "NEXT-STEPS.md").write_text(
        "# Next Steps\n\n" + "\n".join([f"- {step}" for step in next_steps]),
        encoding="utf-8",
    )
    (output_dir / "EXISTING-ASSETS.md").write_text(
        "# Existing Assets\n\n" + ("\n".join([f"- {asset}" for asset in existing_assets]) if existing_assets else "- None provided yet."),
        encoding="utf-8",
    )
    (output_dir / "CONTACT-SURFACES.md").write_text(
        "# Contact Surfaces\n\n" + "\n".join([
            f"- {surface['name']} ({surface['status']}): {surface['purpose']} | Substrate: {surface['substrate']}"
            for surface in contact_surfaces
        ]),
        encoding="utf-8",
    )
    (output_dir / "ROUTING.json").write_text(json.dumps(routing, indent=2), encoding="utf-8")
    write_json(output_dir / "events.json", [])
    write_json(output_dir / "EXECUTION-STATE.json", build_execution_state(result, []))


def generate_company(payload):
    product_origin = payload.get("productOrigin", "Existing product").strip() or "Existing product"
    autonomy_mode = payload.get("autonomyMode", "Operator-assisted").strip() or "Operator-assisted"
    project_name = payload.get("projectName", "Untitled Project").strip() or "Untitled Project"
    description = payload.get("description", "A serious AI product.").strip()
    audience = payload.get("audience", "Builders").strip()
    business_model = payload.get("businessModel", "SaaS").strip()
    stage = payload.get("stage", "MVP").strip()
    top_goals = payload.get("topGoals", "Ship, validate, grow").strip()
    tone = payload.get("tone", "Sharp, premium, operational").strip()
    role_template = payload.get("roleTemplate", "Balanced").strip() or "Balanced"
    custom_roles = payload.get("customRoles", "")
    existing_assets = parse_existing_assets(payload.get("existingAssets", ""))

    archetype = infer_archetype(business_model, description)
    roles = build_roles(archetype, role_template, custom_roles)
    routing = build_routing(description)
    missions = build_missions(project_name, top_goals)
    next_steps = build_next_steps(project_name)
    contact_surfaces = build_contact_surfaces()
    slug = slugify(project_name)
    generated_at = now_utc()
    company_soul = build_company_soul(project_name, description, tone, autonomy_mode, archetype)

    result = {
        "projectName": project_name,
        "companyId": slug,
        "productOrigin": product_origin,
        "autonomyMode": autonomy_mode,
        "description": description,
        "audience": audience,
        "businessModel": business_model,
        "stage": stage,
        "tone": tone,
        "roleTemplate": role_template,
        "customRoles": custom_roles,
        "existingAssets": existing_assets,
        "topGoals": top_goals,
        "archetype": archetype,
        "roles": roles,
        "routing": routing,
        "missions": missions,
        "companySoul": company_soul,
        "contactSurfaces": contact_surfaces,
        "nextSteps": next_steps,
        "departmentsCount": max(5, min(12, len(roles))),
        "rolesCount": len(roles),
        "generatedAt": generated_at,
    }

    final_dir = GENERATED_ROOT / slug
    temp_dir = TMP_GENERATED_ROOT / f"{slug}-{int(time.time() * 1000)}-{secrets.token_hex(4)}"
    temp_dir.parent.mkdir(parents=True, exist_ok=True)

    try:
        write_company_artifacts(temp_dir, result, roles, missions, next_steps, existing_assets, contact_surfaces, routing)
        if final_dir.exists():
            shutil.rmtree(final_dir)
        temp_dir.rename(final_dir)
        append_company_event(
            slug,
            "company-generated",
            "Company generated",
            f"Generated {project_name} with {len(roles)} core roles and {len(missions)} mission directions.",
            {"companyId": slug, "rolesCount": len(roles), "missionsCount": len(missions)},
        )
        update_company_execution_state(slug, result)
    except Exception:
        if temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise

    return result


class MultiClawHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        super().end_headers()

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8") or "{}")

    def get_session(self):
        if AUTH_MODE == "single-user":
            return "single-user", SINGLE_USER_SESSION
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None, None
        cookie = SimpleCookie()
        cookie.load(cookie_header)
        if SESSION_COOKIE not in cookie:
            return None, None
        token = cookie[SESSION_COOKIE].value
        session = get_sessions().get(token)
        return token, session

    def send_json(self, status_code, payload, set_cookie=None):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        if set_cookie:
            self.send_header("Set-Cookie", set_cookie)
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def require_session(self):
        token, session = self.get_session()
        if not session:
            self.send_json(401, {"error": "authentication required"})
            return None
        return token, session

    def require_same_origin(self):
        if AUTH_MODE == "single-user":
            return True
        origin_header = self.headers.get("Origin") or self.headers.get("Referer")
        if not origin_header:
            return True
        parsed = urlparse(origin_header)
        expected_host = self.headers.get("Host", "")
        if parsed.netloc and parsed.netloc != expected_host:
            self.send_json(403, {"error": "cross-origin request blocked"})
            return False
        return True

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json(200, {"status": "ok"})
            return

        if self.path == "/api/auth/me":
            _, session = self.get_session()
            if not session:
                self.send_json(401, {"error": "not authenticated"})
            else:
                self.send_json(200, session)
            return

        if self.path == "/api/stats":
            if not self.require_session():
                return
            self.send_json(200, build_stats())
            return

        if self.path == "/api/pulse":
            if not self.require_session():
                return
            self.send_json(200, build_pulse())
            return

        if self.path == "/api/companies":
            if not self.require_session():
                return
            self.send_json(200, list_companies())
            return

        if self.path.startswith("/api/company/") and self.path.endswith("/download"):
            if not self.require_session():
                return
            company_id = self.path.split("/api/company/", 1)[1].split("/download", 1)[0].strip()
            company_dir = GENERATED_ROOT / company_id
            if not company_dir.exists() or not company_dir.is_dir():
                self.send_json(404, {"error": "company not found"})
                return

            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
                for file_path in sorted(company_dir.iterdir()):
                    if file_path.is_file():
                        archive.write(file_path, arcname=file_path.name)

            payload = zip_buffer.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="{company_id}-pack.zip"')
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        if self.path.startswith("/api/company/") and "/artifact/" in self.path:
            if not self.require_session():
                return
            company_id = self.path.split("/api/company/", 1)[1].split("/artifact/", 1)[0].strip()
            artifact_name = self.path.rsplit("/artifact/", 1)[1].strip()
            safe_name = Path(artifact_name).name
            artifact_file = GENERATED_ROOT / company_id / safe_name
            if artifact_file.exists() and artifact_file.is_file():
                self.send_response(200)
                if artifact_file.suffix.lower() == ".json":
                    self.send_header("Content-Type", "application/json")
                else:
                    self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.send_header("Content-Disposition", f'attachment; filename="{safe_name}"')
                self.end_headers()
                self.wfile.write(artifact_file.read_bytes())
            else:
                self.send_json(404, {"error": "artifact not found"})
            return

        if self.path.startswith("/api/company/") and self.path.endswith("/artifacts"):
            if not self.require_session():
                return
            company_id = self.path.split("/api/company/", 1)[1].split("/artifacts", 1)[0].strip()
            company_dir = GENERATED_ROOT / company_id
            if company_dir.exists():
                artifacts = []
                for file_path in sorted(company_dir.iterdir()):
                    if file_path.is_file():
                        artifacts.append({"name": file_path.name, "size": file_path.stat().st_size})
                self.send_json(200, artifacts)
            else:
                self.send_json(404, {"error": "company not found"})
            return

        if self.path.startswith("/api/company/") and self.path.endswith("/events"):
            if not self.require_session():
                return
            company_id = self.path.split("/api/company/", 1)[1].split("/events", 1)[0].strip()
            company = load_company(company_id)
            if company is None:
                self.send_json(404, {"error": "company not found"})
                return
            self.send_json(200, load_company_events(company_id))
            return

        if self.path.startswith("/api/company/"):
            if not self.require_session():
                return
            company_id = self.path.split("/api/company/", 1)[1].strip()
            company = load_company(company_id)
            if company is not None:
                self.send_json(200, company)
            else:
                self.send_json(404, {"error": "company not found"})
            return

        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/auth/signup":
            if not self.require_same_origin():
                return
            if AUTH_MODE == "single-user":
                self.send_json(200, SINGLE_USER_SESSION)
                return
            if not allow_rate(f"signup:{self.client_address[0]}", 10, 300):
                self.send_json(429, {"error": "too many signup attempts"})
                return
            try:
                payload = self.read_json_body()
                email = payload.get("email", "").strip().lower()
                password = payload.get("password", "")
                if not email or not password:
                    self.send_json(400, {"error": "email and password are required"})
                    return
                if len(password) < 8:
                    self.send_json(400, {"error": "password must be at least 8 characters"})
                    return
                create_user(email, password)
                token = create_session(email)
                self.send_json(200, {"email": email}, f"{SESSION_COOKIE}={token}; HttpOnly; Path=/; SameSite=Lax")
            except ValueError as exc:
                self.send_json(400, {"error": str(exc)})
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        if self.path == "/api/auth/login":
            if not self.require_same_origin():
                return
            if AUTH_MODE == "single-user":
                self.send_json(200, SINGLE_USER_SESSION)
                return
            if not allow_rate(f"login:{self.client_address[0]}", 15, 300):
                self.send_json(429, {"error": "too many login attempts"})
                return
            try:
                payload = self.read_json_body()
                email = payload.get("email", "").strip().lower()
                password = payload.get("password", "")
                if not verify_user(email, password):
                    self.send_json(401, {"error": "invalid email or password"})
                    return
                token = create_session(email)
                self.send_json(200, {"email": email}, f"{SESSION_COOKIE}={token}; HttpOnly; Path=/; SameSite=Lax")
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        if self.path == "/api/auth/logout":
            if not self.require_same_origin():
                return
            if AUTH_MODE == "single-user":
                self.send_json(200, {"ok": True})
                return
            token, _ = self.get_session()
            if token:
                delete_session(token)
            self.send_json(200, {"ok": True}, f"{SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax")
            return

        if self.path.startswith("/api/company/") and self.path.endswith("/cycle"):
            if not self.require_same_origin():
                return
            if not self.require_session():
                return
            try:
                company_id = self.path.split("/api/company/", 1)[1].split("/cycle", 1)[0].strip()
                company = load_company(company_id)
                if company is None:
                    self.send_json(404, {"error": "company not found"})
                    return
                result = run_company_cycle(company_id, company)
                self.send_json(200, result)
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        if self.path.startswith("/api/company/") and self.path.endswith("/ask"):
            if not self.require_same_origin():
                return
            if not self.require_session():
                return
            try:
                company_id = self.path.split("/api/company/", 1)[1].split("/ask", 1)[0].strip()
                company = load_company(company_id)
                if company is None:
                    self.send_json(404, {"error": "company not found"})
                    return
                payload = self.read_json_body()
                prompt = payload.get("prompt", "")
                if not prompt.strip():
                    self.send_json(400, {"error": "prompt is required"})
                    return
                result = build_company_reply(company, prompt)
                append_company_event(
                    company_id,
                    "operator-ask",
                    "Operator request",
                    prompt.strip(),
                    {"speaker": result.get("speaker"), "reply": result.get("reply")},
                )
                update_company_execution_state(company_id, company)
                self.send_json(200, result)
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        if self.path == "/api/generate":
            if not self.require_same_origin():
                return
            if not self.require_session():
                return
            if not allow_rate(f"generate:{self.client_address[0]}", 30, 60):
                self.send_json(429, {"error": "too many generation requests"})
                return
            try:
                payload = self.read_json_body()
                result = generate_company(payload)
                self.send_json(200, result)
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        self.send_json(404, {"error": "not found"})


if __name__ == "__main__":
    GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
    TMP_GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
    AUTH_ROOT.mkdir(parents=True, exist_ok=True)
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), MultiClawHandler)
    print(f"Serving MultiClaw on http://{HOST}:{PORT}")
    server.serve_forever()
