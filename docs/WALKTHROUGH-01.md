# MultiClaw Walkthrough 01

## Base install

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash
```

## Guided steps after install

### 1. See the walkthrough

```bash
multiclaw walkthrough
```

### 2. Optional guided config

```bash
multiclaw configure
```

### 3. Start with a provider

```bash
multiclaw up --provider openai --model gpt-5.4 --api-key YOUR_KEY
```

### 4. Check status

```bash
multiclaw status
```

### 5. Stop the runtime

```bash
multiclaw stop
```

### 6. Uninstall if needed

```bash
curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash
```

## Standard

The user should always have a clear next command.
