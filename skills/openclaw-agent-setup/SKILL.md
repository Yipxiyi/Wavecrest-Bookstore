# OpenClaw Agent Setup Skill

Create and configure isolated OpenClaw agents with Telegram binding.

## When to Use

Use this skill when you need to:
- Create a new specialized OpenClaw agent
- Configure agent identity (name, emoji, avatar)
- Bind Telegram Bot to an agent
- Set up agent routing rules
- Manage agent secrets and environment variables

## Prerequisites

- OpenClaw installed and running
- Telegram Bot Token (if binding to Telegram)
- Agent identity files (IDENTITY.md, SOUL.md, etc.)

## Quick Start

### 1. Create Agent

```bash
openclaw agents add <agent-id> \
  --workspace "~/.openclaw/workspace" \
  --agent-dir "~/.openclaw/agents/<agent-id>" \
  --model "kimi-coding/k2p5" \
  --non-interactive
```

### 2. Set Identity

```bash
openclaw agents set-identity \
  --agent <agent-id> \
  --identity-file ~/.openclaw/agents/<agent-id>/IDENTITY.md
```

Or manually:
```bash
openclaw agents set-identity \
  --agent <agent-id> \
  --name "Agent Name" \
  --emoji "🎨"
```

### 3. Bind Telegram

```bash
openclaw agents bind \
  --agent <agent-id> \
  --bind telegram:default
```

### 4. Store Secrets (Optional)

Create `~/.openclaw/agents/<agent-id>/agent/secrets.json`:

```json
{
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN"
  },
  "api_keys": {
    "service_name": "api_key_here"
  }
}
```

Set secure permissions:
```bash
chmod 600 ~/.openclaw/agents/<agent-id>/agent/secrets.json
```

### 5. Verify Setup

```bash
# List all agents
openclaw agents list

# Check bindings
openclaw agents bindings

# Restart gateway if needed
openclaw gateway restart
```

## Full Example

### Step 1: Prepare Agent Files

Create agent directory structure:
```bash
mkdir -p ~/.openclaw/agents/my-agent
mkdir -p ~/.openclaw/agents/my-agent/sessions
```

Create identity files:
- `IDENTITY.md` - Agent identity
- `SOUL.md` - Personality and behavior
- `USER.md` - User context
- `MEMORY.md` - Long-term memory
- `agent.md` - Task specification (optional)

### Step 2: Create Agent

```bash
openclaw agents add my-agent \
  --workspace "~/.openclaw/workspace" \
  --agent-dir "~/.openclaw/agents/my-agent" \
  --model "kimi-coding/k2p5" \
  --non-interactive
```

### Step 3: Configure Identity

```bash
openclaw agents set-identity \
  --agent my-agent \
  --identity-file ~/.openclaw/agents/my-agent/IDENTITY.md
```

### Step 4: Bind Telegram

```bash
openclaw agents bind \
  --agent my-agent \
  --bind telegram:default
```

### Step 5: Test

In Telegram:
```
@my-agent Hello! What's your purpose?
```

## Managing Agents

### List Agents
```bash
openclaw agents list
```

### View Bindings
```bash
openclaw agents bindings
```

### Remove Binding
```bash
openclaw agents unbind \
  --agent <agent-id> \
  --bind telegram:default
```

### Delete Agent
```bash
openclaw agents delete <agent-id>
```

## Telegram Pairing

If you see "access not configured", you need to approve the pairing:

1. User sends message to bot, gets pairing code
2. Admin runs:
   ```bash
   openclaw pairing approve telegram <PAIRING_CODE>
   ```

## Troubleshooting

### Agent not responding
- Check if agent is bound: `openclaw agents bindings`
- Verify gateway is running: `openclaw gateway status`
- Check logs: `openclaw logs`

### Identity not loaded
- Ensure IDENTITY.md exists in agent directory
- Re-run set-identity command
- Check file permissions

### Telegram binding not working
- Verify pairing is approved
- Check routing bindings: `openclaw agents bindings`
- Ensure bot token is valid

## Configuration Files

### Agent Config
`~/.openclaw/agents/<agent-id>/agent/config.json`

### Secrets
`~/.openclaw/agents/<agent-id>/agent/secrets.json`

### OpenClaw Main Config
`~/.openclaw/openclaw.json`

## Best Practices

1. **Use descriptive agent IDs** - e.g., `backend-engineer`, `data-analyst`
2. **Set secure permissions** on secrets.json (chmod 600)
3. **Keep identity files in agent directory** for version control
4. **Use specific models** per agent task type
5. **Document agent purpose** in agent.md or IDENTITY.md

## References

- OpenClaw Docs: https://docs.openclaw.ai/cli/agents
- Telegram Bot Setup: https://core.telegram.org/bots
