# MultiClaw

MultiClaw is the fastest way to launch a real AI company around your product.

It is a standalone product that people should be able to take from GitHub and run on their own machine or VPS.

A user describes what they built, what they need, and what outcomes they want. MultiClaw then creates a coordinated AI company around it:

- agent roster
- roles and ownership
- souls and working styles
- mission briefs
- workspaces
- operating rules
- team coordination surfaces
- dashboards
- runbooks
- maintenance cadence
- project-specific guards and policies

## Core idea

MultiClaw turns one product, repo, app, or machine into a coordinated AI company.

The goal is simple: make it easy to start, clear to steer, and strong enough to do real work.

The user stays in control.
The generated company exists to operate, maintain, and advance the target according to the creator's requirements, boundaries, and standards.

## Platform direction

MultiClaw is built to stay model-agnostic, portable, and easy to operate.
That means the experience layer can stay stable while routing work across many AI providers.

Over time it should also become channel-flexible and access-flexible, with support for communication surfaces, private networking, and stronger identity layers where needed.

## Positioning

- Open source core
- Easy setup
- Product-first, not toy-first
- Built for real operation, not just demos
- Privacy-safe public surface, with private implementation details kept out of the product
- Works for apps, e-commerce, SaaS, agencies, marketplaces, content businesses, operations-heavy teams, and infrastructure targets like VPS environments

## MVP thesis

The first real version should stay simple to install, clear to operate, and strong enough to generate visible company structure from day one.

## Quick start

### Install and run

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash
```

Then continue from inside the product.

Quick start after install:

```bash
multiclaw start
multiclaw verify
multiclaw stop
```

The default private flow is single-user and should not force account friction on your own VPS.

Uninstall:

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash
```

The base install keeps MultiClaw itself simple. Provider, model, channel, and networking choices can be layered on after install.
For local mode, MultiClaw defaults toward a simpler single-user flow instead of forcing account friction.

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

Technical direction:
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

Inside the installed product, MultiClaw should guide the rest of the runtime, verification, and steering flow naturally.

Generate a local example company:

```bash
npm run example
```

Run the interactive initializer:

```bash
npm run init
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
