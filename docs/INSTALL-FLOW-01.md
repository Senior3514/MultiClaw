# MultiClaw Install Flow 01

## Principle

MultiClaw installation should feel calm, obvious, and reversible.
The user should not be forced to make every advanced decision up front.

## Ordered flow

### 1. Install the core product
Goal: get MultiClaw itself onto the machine with the smallest possible cognitive load.

What happens:
- clone or update the repo
- install dependencies
- expose the `multiclaw` command

### 2. Configure the AI runtime
Goal: choose the provider, model, and API key after the base install is complete.

What happens:
- choose provider
- choose model
- save runtime key
- set local or tailscale bind mode

### 3. Start the runtime
Goal: bring up the product and verify the URL.

What happens:
- start the runtime
- show status
- show the URL

### 4. Add access and channels later
Goal: keep optional surfaces out of the base install path.

Examples:
- Tailscale
- channels
- extra integrations
- future identity layers

### 5. Generate and operate
Goal: once the base runtime works, the user can generate companies and operate the product.

## UX standard

The install flow should be:
- one calm base install
- one clear configuration step
- one obvious start step
- optional advanced layers afterward

## Product standard

Do not overload first contact.
The first experience should feel simple, intentional, and professional.
