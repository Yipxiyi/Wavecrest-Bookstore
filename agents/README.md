# NeoDB Sync Agent

专门用于从 NeoDB 同步 2026 年新书数据的 Agent。

## 功能

- 🔍 从 NeoDB 搜索 2026 年出版的书籍
- 💾 本地 SQLite 数据库持久化存储
- 🔄 自动增量同步（每4小时）
- 📄 生成 website 可用的 books.json
- 🖼️ 自动下载封面图片
- 📝 自动生成书籍推荐文章

## 安装

```bash
cd agents/neodb-sync-agent
npm install
```

## 使用

### 手动运行同步

```bash
npm run sync
```

### 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加每4小时运行一次
0 */4 * * * cd ~/.openclaw/workspace/agents/neodb-sync-agent && npm run sync >> sync.log 2>&1
```

### 输出文件

同步完成后会更新以下文件：

- `../../data/books.json` - 网站书籍数据
- `../../data/articles.json` - 自动生成的文章
- `../../data/covers/` - 下载的封面图片
- `database/books.db` - SQLite 数据库

## 数据库结构

```sql
books
├── uuid (NeoDB UUID)
├── title, subtitle
├── authors (JSON array)
├── isbn, publisher
├── publish_date
├── description
├── cover_image_url
├── rating, rating_count
├── tags (JSON array)
└── sync_status
```

## API 说明

使用 NeoDB 公开 API：
- Search: `GET /api/catalog/search?q={query}&category=book`
- Detail: `GET /api/book/{uuid}`

限速：约 60 请求/分钟

## 配置

在 `sync.js` 中修改 `CONFIG`：

```javascript
const CONFIG = {
  SYNC_INTERVAL_HOURS: 4,    // 同步间隔
  MIN_PUBLISH_YEAR: 2026,    // 最小出版年份
  RATE_LIMIT_MS: 1000        // API 请求间隔(ms)
};
```
