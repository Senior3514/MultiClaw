# Reference Stack Absorption 01

## Goal

Absorb the strongest ideas from OpenClaw, NemoClaw, NanoClaw, and MicroClaw into MultiClaw without turning MultiClaw into a clone.

MultiClaw should keep its own identity:
- company-first product
- primary operator layer
- editable company generation
- visible company execution
- portable private deployment
- web + CLI operator control

The substrate can learn from other claw systems. The product layer stays ours.

---

## What we take from OpenClaw

### Core DNA to absorb
- channel-rich substrate mindset
- first-class tools and operational control plane
- onboarding-driven setup instead of scattered manual steps
- strong pairing / trust-boundary posture for inbound messaging
- multi-agent routing and session isolation patterns
- docs by goal, not only by component

### MultiClaw translation
- keep MultiClaw above an OpenClaw-style runtime substrate
- treat channels as attachable surfaces, not product identity
- maintain clear onboarding, doctor, verify, status, stop flows
- keep DM/channel trust explicit and safe by default
- keep operator tooling first-class, not hidden behind UI only

---

## What we take from NemoClaw

### Core DNA to absorb
- hardened blueprint thinking
- sandbox lifecycle as a first-class concept
- network policy posture and risk profiles
- guided onboarding with explicit environment checks
- stronger runbooks and troubleshooting structure
- honest alpha / production-readiness labeling

### MultiClaw translation
- add security posture presets for company runtime modes
- make runtime/network policy a visible operator decision
- tighten process lifecycle, crash recovery, and stale state handling
- strengthen install + doctor + verify around real deployment constraints
- keep readiness language exact and evidence-based

---

## What we take from NanoClaw

### Core DNA to absorb
- small understandable core
- isolation by real runtime boundary, not only app permissions
- per-group / per-context separation
- low-bloat philosophy
- queue/concurrency discipline
- customization via direct product shaping instead of config sprawl

### MultiClaw translation
- protect the core runtime from becoming swollen or vague
- isolate company execution contexts cleanly
- keep per-company state, execution, and artifacts separated
- prefer a few strong primitives over many weak features
- make company shape editing powerful, but keep runtime behavior comprehensible
- preserve a simple mental model: brief -> company -> execute -> observe -> refine

---

## What we take from MicroClaw

### Core DNA to absorb
- one runtime, many channels
- shared agent loop
- persistent sessions and durable memory
- scheduled tasks and background work
- mid-run progress messaging
- preflight diagnostics and machine-readable status
- strong docs for tools, provider matrix, and runbooks
- observable runtime state

### MultiClaw translation
- unify the company execution loop under one runtime contract
- persist company activity, task state, and operator-visible history
- support scheduled/company background activity as a first-class layer
- expose machine-readable runtime and provider readiness
- strengthen the company activity feed into a true execution surface
- separate verified provider/channel support from aspirational support

---

## MultiClaw synthesis

MultiClaw should become:
- **OpenClaw** level substrate leverage
- **NemoClaw** level hardening discipline
- **NanoClaw** level simplicity and isolation clarity
- **MicroClaw** level runtime continuity and observability
- plus the **MultiClaw-only company/operator layer**

That means the final product should feel like:
- you install one product
- it starts one calm runtime
- it generates or imports a company
- that company becomes visibly alive
- the operator can inspect, steer, refine, and expand it
- the same company can later attach to more channels, models, and environments

---

## Non-negotiables for absorption

1. Do not bloat the public flow.
2. Do not overclaim provider or channel readiness.
3. Do not leak server/backstage details into public surfaces.
4. Do not turn the product into a generic agent wrapper.
5. Do not lose the primary operator / company identity layer.
6. Do not trade away private-VPS simplicity for enterprise ceremony.

---

## Build order this implies

### Priority 1: company execution proof
- live activity feed
- task timeline
- visible routing/execution states
- richer ask-to-action loop
- operator-visible "what the company is doing now"

### Priority 2: provider hardening
- schema validation
- retries and fallback behavior
- malformed output handling
- timeout / latency handling
- provider capability truth table

### Priority 3: runtime hardening
- stronger daemon lifecycle
- stale state detection and recovery
- safer multi-mode runtime state
- more explicit status and health surfaces

### Priority 4: security posture
- clearer trust modes
- tighter auth/session edges
- channel-risk posture before broader channel rollout
- eventual sandbox/risk profiles for companies and claws

### Priority 5: portable distribution
- cleaner packaging story
- repeatable fresh-machine verification
- stronger docs/runbooks/install diagnostics

---

## Mapping to current MultiClaw code

### Immediate implementation zones
- `ops/server.py`
- `bin/multiclaw.js`
- `scripts/e2e-smoke.sh`
- `src/model-layer/*`
- `web/dashboard.js`
- `web/company.js`
- `web/generator.html`
- `web/platform.html`
- `web/settings.html`

### Immediate product outcomes wanted
- company pages that feel alive
- runtime status that feels trustworthy
- providers that fail safely and visibly
- CLI and web saying the same thing
- installation that stays calm and simple

---

## Standing rule

When borrowing from other claw systems:
- take architecture patterns
- take hardening ideas
- take observability ideas
- take onboarding discipline
- take runtime truthfulness
- do **not** take their product identity wholesale

Everything must resolve into **MultiClaw**.
