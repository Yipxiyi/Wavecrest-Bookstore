#!/bin/bash
# Quick setup script for OpenClaw Agent
# Usage: ./setup-agent.sh <agent-id> <agent-name> <emoji>

set -e

AGENT_ID=$1
AGENT_NAME=$2
AGENT_EMOJI=$3

if [ -z "$AGENT_ID" ] || [ -z "$AGENT_NAME" ] || [ -z "$AGENT_EMOJI" ]; then
    echo "Usage: $0 <agent-id> <agent-name> <emoji>"
    echo "Example: $0 backend-engineer 'Backend Engineer' 🏗️"
    exit 1
fi

echo "🚀 Setting up OpenClaw Agent: $AGENT_ID"

# Step 1: Create directories
echo "📁 Creating directories..."
mkdir -p ~/.openclaw/agents/$AGENT_ID/agent
mkdir -p ~/.openclaw/agents/$AGENT_ID/sessions

# Step 2: Create IDENTITY.md
echo "📝 Creating IDENTITY.md..."
cat > ~/.openclaw/agents/$AGENT_ID/IDENTITY.md << EOF
# IDENTITY.md - Who Am I

- **Name:** $AGENT_NAME
- **Role:** Specialist Agent
- **Emoji:** $AGENT_EMOJI
- **Language:** 中文/English

## Purpose

Add your agent's purpose here.

## Capabilities

- Task 1
- Task 2
- Task 3
EOF

# Step 3: Create other identity files
echo "📄 Creating SOUL.md, USER.md, MEMORY.md..."

cat > ~/.openclaw/agents/$AGENT_ID/SOUL.md << 'EOF'
# SOUL.md - Core Values

## Core Truths

- Be helpful and professional
- Document your decisions
- Learn from interactions

## Boundaries

- Respect privacy
- Ask before external actions
EOF

cat > ~/.openclaw/agents/$AGENT_ID/USER.md << 'EOF'
# USER.md - User Context

- **Name:** Janzo Yip
- **Timezone:** GMT+8 (Asia/Shanghai)
- **Language:** 中文
EOF

cat > ~/.openclaw/agents/$AGENT_ID/MEMORY.md << 'EOF'
# MEMORY.md - Project Memory

## Active Projects

## Technical Preferences

## Notes
EOF

# Step 4: Create secrets template
echo "🔐 Creating secrets template..."
cat > ~/.openclaw/agents/$AGENT_ID/agent/secrets.json << 'EOF'
{
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN_HERE"
  },
  "api_keys": {}
}
EOF

chmod 600 ~/.openclaw/agents/$AGENT_ID/agent/secrets.json

# Step 5: Register with OpenClaw
echo "🎯 Registering agent with OpenClaw..."
openclaw agents add $AGENT_ID \
    --workspace "~/.openclaw/workspace" \
    --agent-dir "~/.openclaw/agents/$AGENT_ID" \
    --model "kimi-coding/k2p5" \
    --non-interactive

# Step 6: Set identity
echo "🎭 Setting agent identity..."
openclaw agents set-identity \
    --agent $AGENT_ID \
    --identity-file ~/.openclaw/agents/$AGENT_ID/IDENTITY.md

# Step 7: Bind Telegram
echo "📱 Binding Telegram..."
openclaw agents bind \
    --agent $AGENT_ID \
    --bind telegram:default

echo ""
echo "✅ Agent setup complete!"
echo ""
echo "📍 Location: ~/.openclaw/agents/$AGENT_ID/"
echo "📋 Identity: $AGENT_NAME $AGENT_EMOJI"
echo ""
echo "Next steps:"
echo "1. Edit secrets.json with your actual tokens"
echo "2. Add task specification to agent.md"
echo "3. Test with: @${AGENT_ID} Hello!"
echo ""
