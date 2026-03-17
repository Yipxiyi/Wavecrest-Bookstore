# 豆瓣新书榜爬虫系统

## 概述

自动爬取豆瓣新书榜数据，按类别筛选后存储到 Supabase PostgreSQL 数据库。

## 功能特性

- 🕷️ 爬取豆瓣新书榜 (https://book.douban.com/latest)
- 📚 自动分类：文学、小说、历史文化、艺术设计
- 💾 增量同步（基于 douban_id 去重）
- ⏰ OpenClaw Cron 定时任务（每天 09:00 和 21:00）
- 📝 完整日志记录

## 目录结构

```
scripts/
├── douban-crawler.js      # 爬虫主脚本
└── package.json           # 依赖配置

cron/
└── douban-crawler.cron    # OpenClaw Cron 配置

logs/
└── douban-crawler.log     # 执行日志（自动生成）
```

## 安装

```bash
cd scripts
npm install
```

## 手动执行

```bash
# 执行爬虫
npm run crawl

# 或直接进入 scripts 目录
node douban-crawler.js
```

## 定时任务配置

### 使用 OpenClaw Cron

将 `cron/douban-crawler.cron` 中的配置添加到 OpenClaw 系统：

```bash
# 编辑 crontab
openclaw cron edit

# 添加以下内容
0 9 * * * cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts && npm install && node douban-crawler.js >> ../logs/douban-crawler.log 2>&1
0 21 * * * cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts && npm install && node douban-crawler.js >> ../logs/douban-crawler.log 2>&1
```

### 使用系统 Cron

```bash
# 添加到系统 crontab
crontab -e

# 粘贴 cron/douban-crawler.cron 中的内容
```

## 数据字段

爬取的书籍数据包含以下字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| douban_id | 豆瓣书籍 ID | 38197669 |
| title | 书名 | 我们的一切往昔 |
| author | 作者 | [意] 娜塔莉亚·金兹伯格 |
| publisher | 出版社 | 上海译文出版社 |
| publish_date | 出版日期 | 2026-3 |
| price | 价格 | 68.00 |
| rating | 评分 | 8.5 |
| rating_count | 评价人数 | 55 |
| cover_url | 封面图片 URL | https://img... |
| category | 分类 | literature/fiction/history/art |
| source | 数据源 | douban |

## 日志查看

```bash
# 实时查看日志
tail -f logs/douban-crawler.log

# 查看最新日志
cat logs/douban-crawler.log | tail -50
```

## 类别映射

| 豆瓣类别 | 系统分类 |
|----------|----------|
| 文学、散文、诗歌 | literature |
| 小说、故事、悬疑 | fiction |
| 历史、文化、考古 | history |
| 艺术、设计、绘画 | art |

## 注意事项

1. **请求频率**：脚本内置 2 秒延迟，避免触发反爬
2. **User-Agent**：使用真实浏览器 UA 伪装请求
3. **增量同步**：基于 douban_id 去重，避免重复入库
4. **错误处理**：失败书籍记录到日志，不影响其他书籍

## 故障排查

### 问题：无法获取页面
- 检查网络连接
- 查看日志中的 HTTP 状态码
- 可能被豆瓣封 IP，等待一段时间重试

### 问题：解析不到书籍
- 豆瓣页面结构可能已改变
- 需要更新正则表达式
- 查看页面 HTML 结构

### 问题：Supabase 写入失败
- 检查 SUPABASE_URL 和 SUPABASE_KEY
- 检查 books 表结构是否正确
- 查看错误日志

## 维护

- 定期检查日志，确认爬虫正常运行
- 每月检查豆瓣页面结构是否改变
- 根据需求调整类别筛选规则

## License

MIT
