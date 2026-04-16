# MultiClaw

MultiClaw is the fastest way to generate a full behind-the-scenes AGI company for any product, startup, or business.

A user describes what they built, what they need, and what outcomes they want. MultiClaw then creates a coordinated AI company around it:

- agent roster
- roles and ownership
- souls and working styles
- mission briefs
- workspaces
- operating rules
- internal chat surfaces
- dashboards
- runbooks
- maintenance cadence
- project-specific guards and policies

## Core idea

OpenClaw gives powerful agent infrastructure.
MultiClaw takes that kind of capability and turns it into an original, user-owned, instantly deployable AI company.

The user stays high-privilege.
The generated company exists behind the scenes to operate, maintain, and advance the product according to the creator's requirements, boundaries, and standards.

## Platform direction

The product should reuse OpenClaw-like execution infrastructure while remaining model-agnostic.
That means the experience layer can stay stable while routing work across many AI providers.

It should also become portable across environments, so a user can run MultiClaw on their own machine, connect their own model, and use the product without depending on this specific VPS.

Over time it should also become channel-agnostic and access-flexible, with support for communication surfaces, private networking, VPN-style access, and stronger identity layers where needed.

## Positioning

- Open source core
- Easy setup
- Product-first, not toy-first
- Built for real operation, not just demos
- Privacy-safe public surface, with backstage details kept out of the product
- Works for apps, e-commerce, SaaS, agencies, marketplaces, content businesses, internal ops, and infrastructure targets like VPS environments

## MVP thesis

The first real version should not try to replace OpenClaw.
It should become the best generator and orchestration layer on top of OpenClaw.

## Quick start

### Generate a company package

```bash
npm run example
```

This generates a working starter company under:

```bash
generated/<project-slug>/
```

You can also run the interactive flow:

```bash
npm run init
```

### Configure and run the workspace

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash
```

Or the lower-level install-only path:

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/install.sh | bash
```

Then:

```bash
multiclaw doctor
multiclaw walkthrough
multiclaw guide
multiclaw configure
multiclaw up --provider openai --model gpt-5.4 --api-key YOUR_KEY
```

Or, if you want to install and start in one go:

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/install.sh | bash -s -- --start --provider openai --model gpt-5.4 --api-key YOUR_KEY
```

Or after cloning locally:

```bash
npm run up -- --tailscale --provider openai --model gpt-5.4 --api-key YOUR_KEY
```

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash
```

The base install keeps MultiClaw itself simple. Provider, model, channel, and networking choices can be layered on after install.
For local mode, MultiClaw now defaults toward a simpler single-user flow instead of forcing preview-style account friction.

Ordered flow:
1. Install the core product
2. Configure the AI runtime
3. Start the runtime
4. Add networking, channels, and extra integrations later

Configuration categories:
- Core runtime
- Access and networking
- Channels and integrations

Primary channel direction:
- web
- Telegram
- later Discord and Slack

Claw family direction:
- NanoClaw
- MicroClaw
- OpenClaw
- MultiClaw as the umbrella orchestration layer

Core product direction:
- attach to what already exists
- generate the company shape around it
- communicate with agents from birth
- operate proactively and reactively inside the company
- study the environment and expand the company structure when needed
- report upward through clean company hierarchy instead of raw orchestration noise

Provider access direction:
- direct API keys
- account-connected or subscription-backed provider access where applicable
- router providers
- local or self-hosted models

Technical USP direction:
- attach-and-run on top of what already exists
- generate a living company, not a single assistant
- communicate with agents from birth
- expose a clear primary operator layer to the user
- run across web, CLI, and channel surfaces
- keep meaningful CLI parity for end-to-end operation
- stay provider-flexible and access-flexible
- expand company structure autonomously inside the runtime
- keep protection and secure defaults inside the product DNA
- operate proactively and optimize for quality, efficiency, and token awareness

If you want to separate config from start:

```bash
npm run setup -- --tailscale --provider openai --model gpt-5.4 --api-key YOUR_KEY
npm run start
```

You can also configure provider details directly:

```bash
node ./bin/multiclaw.js setup --tailscale --port 8813 --provider openai --model gpt-5.4 --api-key-env OPENAI_API_KEY
```

Useful runtime commands:

```bash
npm run dev
npm run stop
npm run status
npm run e2e:smoke
```

And the provider-routing skeleton demo:

```bash
npm run demo:router
```

For the isolated tailscale-only product preview:

```bash
bash ./ops/start_tailscale_only.sh
```

## MVP outcome

Given a short product brief, MultiClaw should generate:

1. company name and brand profile
2. team structure
3. role-specific agents
4. workspace files
5. playbooks and operating docs
6. internal coordination surface
7. first action plan

## North star

"Turn one product into a full AI company in minutes."

## Standard

MultiClaw should aim to be:
- secure by default
- fast in practice
- reliable under real use
- instantly compelling
- operational, not theatrical
