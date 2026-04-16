# MultiClaw Runtime Portability 01

## Core requirement

MultiClaw must become a portable product, not a VPS-bound demo.

If someone takes the product to another machine, connects their own model/provider, and runs it, the system should still work.

## Product expectation

The intended end state is:
- run MultiClaw like a real product
- connect your own model or provider
- generate and operate a company around your product
- use it across environments without rewriting everything

## Target environments

MultiClaw should ultimately support:
- Linux CLI
- Linux web UI
- macOS CLI
- macOS GUI or desktop-friendly experience
- Windows CLI
- Windows GUI or desktop-friendly experience
- web UI for broad access

## Architecture implication

The current VPS preview is only a proving ground.
The product itself must move toward:
- host-independent runtime
- model/provider connectors
- clean install flow
- environment-safe configuration
- stable local execution
- portable generated outputs

## AGI system requirement

The system itself should behave like a real AGI-capable operating layer.
When a model/provider is connected correctly, the product should be able to route work, generate company structure, and operate the experience coherently.

## Standard

A user should be able to say:
- I installed MultiClaw
- I connected my model
- I ran it
- it worked

That is the bar.
