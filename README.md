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
npm run setup
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
