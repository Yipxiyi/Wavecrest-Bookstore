# OpenClaw Cron 配置指南

## 任务：豆瓣新书榜爬虫

### 配置步骤

1. **打开 OpenClaw Cron 配置**
   ```bash
   openclaw cron edit
   ```

2. **添加以下定时任务**

   ```bash
   # 豆瓣新书榜爬虫 - 每天 09:00 执行
   0 9 * * * cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts && npm install && node douban-crawler.js >> ../logs/douban-crawler.log 2>&1

   # 豆瓣新书榜爬虫 - 每天 21:00 执行
   0 21 * * * cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts && npm install && node douban-crawler.log 2>&1
   ```

3. **保存并退出**

4. **验证配置**
   ```bash
   openclaw cron list
   ```

### 手动测试

```bash
cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts
node douban-crawler.js
```

### 查看日志

```bash
tail -f ~/.openclaw/workspace/Wavecrest-Bookstore/logs/douban-crawler.log
```

### 任务参数说明

| 参数 | 值 |
|------|-----|
| 执行频率 | 每天 2 次 |
| 执行时间 | 09:00 和 21:00 |
| 数据源 | https://book.douban.com/latest |
| 目标类别 | 文学、小说、历史文化、艺术设计 |
| 存储 | Supabase PostgreSQL |
| 去重方式 | douban_id |

### 注意事项

1. 确保 OpenClaw 已安装并配置好
2. 确保 Supabase 连接信息正确
3. 确保 logs 目录可写入
4. 首次执行建议手动测试

### 故障排查

- **权限问题**: 确保脚本有执行权限
- **依赖问题**: 手动运行 `npm install`
- **网络问题**: 检查是否能访问豆瓣
- **Supabase 问题**: 检查 API Key 和表结构

## 备用：使用系统 Cron

如果 OpenClaw Cron 不可用，可以使用系统 Cron：

```bash
crontab -e

# 添加以下内容
0 9,21 * * * cd ~/.openclaw/workspace/Wavecrest-Bookstore/scripts && npm install && node douban-crawler.js >> ../logs/douban-crawler.log 2>&1
```
