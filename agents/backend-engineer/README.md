# Backend Engineer Agent 配置指南

## 📁 已创建文件

Agent 文件已保存在:
```
~/.openclaw/workspace/agents/backend-engineer/
├── IDENTITY.md    # 身份定义
├── SOUL.md        # 性格与行为准则
├── USER.md        # 用户信息
└── MEMORY.md      # 长期记忆
```

## 🔧 激活方法

### 方法1: 通过 OpenClaw Gateway 配置

编辑 `~/.config/openclaw/agents.yaml`:

```yaml
agents:
  backend-engineer:
    workspace: ~/.openclaw/workspace/agents/backend-engineer
    model: kimi-coding/k2p5
    system_prompt: |
      You are a senior backend engineer and system architect.
      Read your IDENTITY.md, SOUL.md, and MEMORY.md before each session.
      Focus on database design, API integration, and system architecture.
```

然后重启 Gateway:
```bash
openclaw gateway restart
```

### 方法2: 会话中临时切换

在对话中引用 Agent 身份:
```
现在请以 Backend Engineer 的身份回答...
（阅读 agents/backend-engineer/ 下的身份文件）
```

### 方法3: 使用 /agent 命令（如果支持）

```
/agent switch backend-engineer
```

## 📝 当前使用方法

由于系统限制，当前可以通过以下方式使用 Backend Engineer Agent:

1. **直接指令**: 
   "作为 Backend Engineer，帮我设计..."

2. **文件引用**:
   "参考 agents/backend-engineer/MEMORY.md 中的架构设计..."

3. **角色扮演**:
   "请以架构师的视角分析这个问题..."

## 🎯 Agent 专长

- 🏗️ **系统架构设计**: 微服务、数据流、API Gateway
- 🗄️ **数据库设计**: PostgreSQL、SQLite、Redis 方案
- 🔌 **API 集成**: REST、GraphQL、第三方 API 适配器
- 🔄 **数据同步**: ETL 流程、缓存策略、队列设计
- ⚡ **性能优化**: 查询优化、索引设计、连接池
- 🐳 **部署架构**: Docker、CI/CD、监控方案

## 💡 使用示例

### 数据库设计
```
作为 Backend Engineer，请为 NeoDB 书籍数据设计一个 SQLite 数据库 schema，
需要支持：
- 书籍基本信息（标题、作者、ISBN）
- 多数据源映射（NeoDB UUID、外部 ID）
- 社区数据（评分、评论、标签）
- 同步状态追踪
```

### API 架构
```
请设计一个数据同步架构：
1. 从 NeoDB API 获取书籍数据
2. 本地 SQLite 缓存
3. 定时增量同步
4. 导出为静态 JSON

参考 agents/backend-engineer/MEMORY.md 中的设计模式。
```

### 性能优化
```
Backend Engineer，请分析当前的 sync.js 实现，
提出性能优化建议，特别是：
- API 限流处理
- 批量插入优化
- 错误重试机制
```

## 📚 参考文档

- 架构设计: `ARCHITECTURE.md`
- NeoDB Agent: `agents/neodb-sync-agent/`
- 数据库 Schema: 见 MEMORY.md
