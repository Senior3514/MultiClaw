# AGI Core Infusion 01

## Purpose

Adapt the external "deep architectural AGI infusion" prompt into MultiClaw in a way that fits what MultiClaw already is:

- company-first product
- OpenClaw-style substrate underneath
- provider-agnostic model layer
- visible company execution surface
- portable private deployment
- honest readiness bar

This is not a request to bolt a sci-fi backend onto the product.
It is a request to evolve MultiClaw's backend nervous system in a way that is compatible with the product's existing architecture and current verification discipline.

---

## What should be absorbed

The external prompt contains three real pillars worth absorbing:

1. **Persistent semantic memory**
2. **Evolution / self-improvement loop**
3. **Zero-trust autonomous runtime posture**

All three fit MultiClaw.
But none should be pasted in wholesale.
They must be translated into the MultiClaw stack that already exists.

---

## What already exists in MultiClaw

The infusion should start from current foundations, not replace them.

### Already present now
- company generation
- generated company artifacts
- company activity feed (`events.json`)
- company execution state (`EXECUTION-STATE.json`)
- execution cycle artifacts (`CYCLE-###.md`)
- provider registry + router hardening
- session/auth hardening
- same-origin write protections
- smoke verification path
- CLI install / start / verify / stop flow

### Architectural standing rules already established
- reuse OpenClaw/NanoClaw style substrate instead of rebuilding the whole runtime first
- keep MultiClaw's own product/operator/company identity
- do not bloat the public flow
- do not overclaim readiness
- keep private-VPS simplicity intact
- keep company execution visible and truthful

---

## MultiClaw translation of the external prompt

## Pillar 1: DNA Memory Graph

### Raw prompt idea
A persistent vector subconscious that stores interactions, events, logs, and cross-functional context.

### MultiClaw translation
MultiClaw should gain a **company-scoped memory graph** that sits behind the operator/company layer.

It should not start as a giant undifferentiated lake.
It should start with strong scoped primitives:

- operator interactions
- company events
- execution cycles
- generated artifacts
- routing decisions
- provider failures / anomalies
- future task state and internal work logs

### Implementation rule
Start with **semantic recall for company execution**, not global omniscience.

### Recommended storage model
Use PostgreSQL + pgvector with company-scoped relational rows plus embedding columns.

### Tables to add

#### `memory_items`
- `id` uuid pk
- `company_id` text not null
- `scope` text not null (`operator`, `execution`, `artifact`, `routing`, `security`, `provider`)
- `kind` text not null (`event`, `cycle`, `artifact`, `message`, `decision`, `incident`)
- `source_ref` text null
- `title` text null
- `content` text not null
- `metadata` jsonb not null default '{}'
- `embedding` vector(1536)
- `created_at` timestamptz not null default now()

#### `memory_links`
- `id` uuid pk
- `company_id` text not null
- `from_memory_id` uuid not null
- `to_memory_id` uuid not null
- `relation` text not null (`supports`, `caused`, `relates_to`, `contradicts`, `continues`)
- `weight` numeric not null default 1.0
- `created_at` timestamptz not null default now()

#### `memory_queries`
- `id` uuid pk
- `company_id` text not null
- `query_text` text not null
- `top_k` int not null default 8
- `results` jsonb not null default '[]'
- `created_at` timestamptz not null default now()

### Initial ingestion flow
1. company event appended
2. event normalized into memory item
3. embedding job runs asynchronously
4. memory item becomes queryable in company recall
5. operator/company flows can retrieve semantically related history

### First implementation zones
- `ops/server.py`
- `web/company.js`
- `web/dashboard.js`
- future memory adapter under `src/` or `ops/`

---

## Pillar 2: Evolution Engine

### Raw prompt idea
Self-refactoring logic that detects bottlenecks and drafts its own upgrades via GitHub.

### MultiClaw translation
MultiClaw should have an **evidence-driven evolution loop**.

Not uncontrolled autonomous self-editing.
Not direct self-mutation in production.

### Required safety rule
The evolution loop may:
- observe
- diagnose
- propose
- draft
- test
- open a PR

It should **not** auto-merge to protected branches without explicit approval.

### Evolution cycle
1. collect evidence
   - runtime health
   - provider failures
   - slow paths
   - repeated operator pain
   - smoke failures
   - install friction
2. synthesize bottleneck report
3. map bottleneck to candidate improvement
4. generate patch branch
5. run verification gates
6. open PR with evidence, risk summary, and rollback notes
7. require human approval for merge

### CI/CD integration
- GitHub Actions workflow for:
  - lint/check
  - route/provider tests
  - smoke against isolated runtime
  - install/bootstrap sanity
- future PR bot should only act if:
  - branch is isolated
  - required tests pass
  - security policy passes
  - change scope is labeled

### MultiClaw-specific output
The evolution engine should improve:
- install clarity
- runtime lifecycle
- provider routing safety
- execution visibility
- company task continuity
- operator UX friction

It should not optimize for vanity output.
It should optimize for verified operational improvement.

---

## Pillar 3: Zero-Trust Nervous System

### Raw prompt idea
Strict micro-segmentation, mTLS, SOC-grade telemetry, and anomaly isolation.

### MultiClaw translation
Correct direction, but phase it realistically.

MultiClaw is not yet a large service mesh.
So the zero-trust posture should begin with **runtime trust zones and service identity discipline**, then grow into deeper segmentation.

### Phase 1 posture
- company-scoped isolation of data and execution state
- explicit runtime mode separation (`local`, `private-network`)
- same-origin protection on writes
- session expiry and cleanup
- provider readiness truthfulness
- signed/validated internal actions where applicable
- audit logging for operator-triggered mutations

### Phase 2 posture
- internal service tokens / service identity
- per-worker trust scopes
- anomaly scoring on provider/output/runtime patterns
- quarantine flag for bad worker or provider path
- deny-by-default internal calls between service zones

### Phase 3 posture
- mTLS between split internal services
- policy-enforced east-west communication
- formal security event pipeline
- isolated execution sandboxes for higher-risk company actions

### Security manifest for MultiClaw
Must include:
- trust zones
- service identity model
- event telemetry model
- anomaly triggers
- isolation actions
- incident state visibility to operator

---

## Infusion architecture

## Desired backend flow

### Current
operator -> web/CLI -> server -> generation/execution/event files -> company page/dashboard

### Infused target
operator -> web/CLI -> control plane -> execution engine -> event stream -> memory graph -> evolution analyzer -> secure proposal path -> operator-visible execution/security surfaces

### Concrete flow
1. operator acts or system cycle runs
2. event written to relational store + company event log
3. memory item created + embedded
4. execution state recalculated
5. anomaly/security evaluator scores event stream
6. evolution evaluator checks repeated friction or failures
7. if thresholds hit, create:
   - suggestion
   - repair plan
   - task
   - or PR draft candidate
8. operator sees:
   - what happened
   - what the company remembers
   - what the company suggests
   - what risk posture is active

---

## First implementation roadmap

## Phase 0: fit/gap audit
Map current MultiClaw surfaces to the three pillars.

Deliver:
- existing execution state map
- current event sources
- provider/runtime risk surface list
- where memory ingestion should attach first

## Phase 1: memory foundation
- add relational + vector schema
- memory ingestion for company events and cycles
- semantic recall endpoint per company
- company page memory panel

## Phase 2: evolution advisory loop
- bottleneck/event scoring
- improvement candidates
- operator-visible suggestions
- PR-draft manifest format

## Phase 3: security posture layer
- trust zone registry
- anomaly telemetry
- quarantine mechanics for execution paths
- operator-visible security state

## Phase 4: controlled self-improvement pipeline
- GitHub branch draft flow
- test gates
- human-reviewed PR generation

---

## Exact actionable output expected from the adapted prompt

1. **Infusion architecture**
   - how memory, evolution, and security intersect with current company execution and provider routing
2. **Database schemas**
   - pgvector + relational tables above
3. **Evolution pipeline**
   - observation -> proposal -> branch -> verify -> PR -> approval
4. **Security manifest**
   - trust zones, telemetry, anomaly thresholds, quarantine actions

---

## First step executed now

The first correct step is **not** to implement all three pillars blindly.
The first correct step is:

### `Phase 0: AGI core fit/gap audit for current MultiClaw`

This should produce:
- which current files own execution truth
- which data already exists and should become memory inputs
- which runtime mutations need security instrumentation first
- which parts of the evolution loop can be advisory immediately vs. autonomous later

That keeps the infusion grounded in MultiClaw as it already exists.

---

## Final rule

Absorb the architectural strength.
Do not paste in enterprise theater.
Do not break the calm product flow.
Do not lose MultiClaw's identity.

Everything must resolve into **MultiClaw**, not a generic AGI backend clone.
