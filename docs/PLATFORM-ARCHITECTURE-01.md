# Platform Architecture 01

## Core decision

Do not throw away OpenClaw.
Use OpenClaw-like infrastructure as the execution substrate.
Build the new product above it.

## Why

Because OpenClaw already solves many hard problems:
- sessions
- tools
- channels
- memory
- orchestration
- runtime wiring
- detached work
- agent execution surfaces

Rebuilding all of that first would slow the real product down.

## Product stack

### Layer 1: Execution substrate
OpenClaw-compatible runtime and orchestration layer

### Layer 2: Model abstraction layer
A provider-agnostic AI layer that can route work across many model providers

### Layer 3: Company generation layer
Org/company generator, templates, packs, activation logic

### Layer 4: Experience layer
Founder intake, company birth flow, org map, HQ, team chat, dashboards

### Layer 5: Control plane
Project management, billing, teams, packs, enterprise policy, hosted features

## Architectural rule

The product should feel bigger than OpenClaw, while remaining compatible with the kinds of runtime and workflow primitives OpenClaw already proved useful.

## What we inherit

- agent session patterns
- tool execution model
- memory retrieval patterns
- background task handling
- channel delivery patterns
- team-style orchestration concepts

## What we add

- company birth as a first-class concept
- org model and department model
- templates and company packs
- live command center
- activation flows
- premium orchestration experience

## Critical principle

Do not bind the product identity to a single engine implementation forever.
Use a stable internal platform contract so the product can evolve even if the underlying runtime changes later.
