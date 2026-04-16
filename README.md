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
MultiClaw sits on top of it and turns raw capability into an instantly deployable operating company.

## Platform direction

The product should reuse OpenClaw-like execution infrastructure while remaining model-agnostic.
That means the experience layer can stay stable while routing work across many AI providers.

## Positioning

- Open source core
- Easy setup
- Product-first, not toy-first
- Built for real operation, not just demos
- Works for apps, e-commerce, SaaS, agencies, marketplaces, content businesses, and internal ops

## MVP thesis

The first real version should not try to replace OpenClaw.
It should become the best generator and orchestration layer on top of OpenClaw.

## Quick start

```bash
cd projects/multiclaw
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

And the provider-routing skeleton demo:

```bash
npm run demo:router
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
- premium in feel
- operational, not theatrical
