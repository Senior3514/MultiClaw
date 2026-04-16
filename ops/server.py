#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from datetime import datetime, timezone
import json
import re
import sys

WEB_ROOT = Path(__file__).resolve().parent.parent / "web"
GENERATED_ROOT = Path(__file__).resolve().parent.parent / "generated-live"
HOST = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8813


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug or "multiclaw-project"


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


def build_roles(archetype: str):
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

    return common


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
        if not company_dir.is_dir():
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
            companies.append(company)
        except Exception:
            continue
    return companies


def load_company(company_id: str):
    company_file = GENERATED_ROOT / company_id / "company.json"
    if not company_file.exists():
        return None
    company = json.loads(company_file.read_text(encoding="utf-8"))
    company.setdefault("companyId", company_id)
    if not company.get("generatedAt"):
        mtime = datetime.fromtimestamp(company_file.stat().st_mtime, timezone.utc)
        company["generatedAt"] = mtime.strftime("%Y-%m-%d %H:%M:%S UTC")
    company.setdefault("nextSteps", build_next_steps(company.get("projectName", company_id)))
    return company


def generate_company(payload):
    project_name = payload.get("projectName", "Untitled Project").strip() or "Untitled Project"
    description = payload.get("description", "A serious AI product.").strip()
    audience = payload.get("audience", "Builders").strip()
    business_model = payload.get("businessModel", "SaaS").strip()
    stage = payload.get("stage", "MVP").strip()
    top_goals = payload.get("topGoals", "Ship, validate, grow").strip()
    tone = payload.get("tone", "Sharp, premium, operational").strip()

    archetype = infer_archetype(business_model, description)
    roles = build_roles(archetype)
    routing = build_routing(description)
    missions = build_missions(project_name, top_goals)
    next_steps = build_next_steps(project_name)
    slug = slugify(project_name)

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    result = {
        "projectName": project_name,
        "companyId": slug,
        "description": description,
        "audience": audience,
        "businessModel": business_model,
        "stage": stage,
        "tone": tone,
        "topGoals": top_goals,
        "archetype": archetype,
        "roles": roles,
        "routing": routing,
        "missions": missions,
        "nextSteps": next_steps,
        "departmentsCount": 5,
        "rolesCount": len(roles),
        "generatedAt": generated_at,
    }

    output_dir = GENERATED_ROOT / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "company.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    (output_dir / "README.md").write_text(
        f"# {project_name}\n\n"
        f"Generated by MultiClaw.\n\n"
        f"- Company ID: {slug}\n"
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
        f"- Archetype: {archetype}\n"
        f"- Audience: {audience}\n"
        f"- Tone: {tone}\n"
        f"- Generated at: {generated_at}\n",
        encoding="utf-8",
    )
    (output_dir / "NEXT-STEPS.md").write_text(
        "# Next Steps\n\n" + "\n".join([f"- {step}" for step in next_steps]),
        encoding="utf-8",
    )
    (output_dir / "ROUTING.json").write_text(json.dumps(routing, indent=2), encoding="utf-8")

    return result


class MultiClawHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            return
        if self.path == "/api/companies":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(list_companies()).encode("utf-8"))
            return
        if self.path.startswith("/api/company/") and "/artifact/" in self.path:
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
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "artifact not found"}).encode("utf-8"))
            return
        if self.path.startswith("/api/company/") and self.path.endswith("/artifacts"):
            company_id = self.path.split("/api/company/", 1)[1].split("/artifacts", 1)[0].strip()
            company_dir = GENERATED_ROOT / company_id
            if company_dir.exists():
                artifacts = []
                for file_path in sorted(company_dir.iterdir()):
                    if file_path.is_file():
                        artifacts.append({"name": file_path.name, "size": file_path.stat().st_size})
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(artifacts).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "company not found"}).encode("utf-8"))
            return
        if self.path.startswith("/api/company/"):
            company_id = self.path.split("/api/company/", 1)[1].strip()
            company = load_company(company_id)
            if company is not None:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(company).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "company not found"}).encode("utf-8"))
            return
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/generate":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)

        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
            result = generate_company(payload)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as exc:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))


if __name__ == "__main__":
    GENERATED_ROOT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), MultiClawHandler)
    print(f"Serving MultiClaw on http://{HOST}:{PORT}")
    server.serve_forever()
