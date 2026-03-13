# OpenClaw Agent Setup Skill

Quickly create and configure OpenClaw agents with Telegram binding.

## Quick Start

### Method 1: Use the Setup Script

```bash
cd ~/.openclaw/workspace/skills/openclaw-agent-setup
./setup-agent.sh <agent-id> <agent-name> <emoji>
```

Example:
```bash
./setup-agent.sh backend-engineer "Backend Engineer" 🏗️
```

### Method 2: Manual Setup

Follow the steps in `SKILL.md` for full control.

## Files

- `SKILL.md` - Complete documentation
- `setup-agent.sh` - Automated setup script
- `templates/` - Template files for new agents

## Example: Creating Backend Engineer Agent

```bash
# 1. Run setup script
./setup-agent.sh backend-engineer "Backend Engineer" 🏗️

# 2. Edit secrets
nano ~/.openclaw/agents/backend-engineer/agent/secrets.json

# 3. Add task specification
cp your-task.md ~/.openclaw/agents/backend-engineer/agent.md

# 4. Test in Telegram
@backend-engineer Hello!
```

## What Gets Created

```
~/.openclaw/agents/<agent-id>/
├── IDENTITY.md          # Agent identity
├── SOUL.md             # Personality
├── USER.md             # User context
├── MEMORY.md           # Long-term memory
├── agent.md            # Task specification (optional)
├── agent/
│   ├── config.json     # Agent config
│   └── secrets.json    # API keys/tokens
└── sessions/           # Session storage
```

## Telegram Pairing

If you see "access not configured":

1. Send message to Telegram Bot
2. Get pairing code
3. Admin approves:
   ```bash
   openclaw pairing approve telegram <CODE>
   ```

## See Also

- Full documentation: `SKILL.md`
- OpenClaw Docs: https://docs.openclaw.ai
