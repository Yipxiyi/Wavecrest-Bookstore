#!/bin/bash
# NeoDB Sync Agent 自动运行脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 运行同步
echo "🚀 Starting NeoDB Sync at $(date)"
node sync.js

# 检查 Git 更新
if [ -d "../../.git" ]; then
    echo "📤 Checking for data updates..."
    cd ../..
    
    if git diff --quiet data/; then
        echo "✅ No data changes"
    else
        echo "💾 Committing data changes..."
        git add data/
        git commit -m "🔄 Auto-sync NeoDB books at $(date '+%Y-%m-%d %H:%M')"
        git push origin main
        echo "✅ Changes pushed to GitHub"
    fi
fi

echo "✅ Sync completed at $(date)"
