#!/usr/bin/env node
/**
 * 豆瓣新书榜爬虫
 * 爬取 https://book.douban.com/latest 的新书数据
 * 支持按类别筛选：文学、小说、历史文化、艺术设计
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 配置
const CONFIG = {
  DOUBAN_URL: 'https://book.douban.com/latest',
  CATEGORIES: {
    '文学': 'literature',
    '小说': 'fiction',
    '历史文化': 'history',
    '艺术设计': 'art'
  },
  // Supabase 配置
  SUPABASE_URL: 'https://tjqaqieefrolvtqzpaeo.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo',
  // 请求延迟（毫秒）
  DELAY_MS: 2000,
  // 日志文件
  LOG_FILE: path.join(__dirname, '..', 'logs', 'douban-crawler.log')
};

class DoubanCrawler {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    this.books = [];
    this.stats = {
      fetched: 0,
      saved: 0,
      skipped: 0,
      errors: []
    };
  }

  async init() {
    console.log('🚀 豆瓣新书榜爬虫启动');
    console.log(`📅 执行时间: ${new Date().toISOString()}`);
    await this.ensureLogDir();
  }

  async ensureLogDir() {
    const logDir = path.dirname(CONFIG.LOG_FILE);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (e) {
      // 目录已存在
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logEntry);
    // 异步写入日志文件
    fs.appendFile(CONFIG.LOG_FILE, logEntry + '\n').catch(() => {});
  }

  /**
   * 延迟函数
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取豆瓣新书榜页面 HTML
   */
  async fetchLatestBooks() {
    this.log('📡 正在获取豆瓣新书榜...');
    
    try {
      const response = await fetch(CONFIG.DOUBAN_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Referer': 'https://book.douban.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      this.log(`✅ 成功获取页面，大小: ${html.length} 字符`);
      return html;
    } catch (error) {
      this.log(`❌ 获取页面失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 解析 HTML 提取书籍信息
   */
  parseBooks(html) {
    this.log('🔍 正在解析书籍数据...');
    const books = [];
    
    // 使用正则匹配书籍条目
    // 豆瓣新书榜 HTML 结构：每个书籍在 <li> 标签中
    const bookPattern = /<li[^>]*>\s*<a[^>]*href="(https:\/\/book\.douban\.com\/subject\/(\d+)\/)"[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*>\s*<\/a>\s*<div[^>]*>\s*<h2[^>]*>\s*<a[^>]*>([^<]+)<\/a>\s*<\/h2>\s*<p[^>]*>([\s\S]*?)<\/p>\s*(?:<p[^>]*>([\s\S]*?)<\/p>)?\s*<\/div>\s*<\/li>/gi;
    
    // 简化版本：匹配书籍链接和标题
    const linkPattern = /href="(https:\/\/book\.douban\.com\/subject\/(\d+)\/)"[^>]*>\s*<img[^>]*src="([^"]+)"[\s\S]*?<h2[^>]*>[\s\S]*?>([^<]+)<\/a>\s*<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
    
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      try {
        const [, url, doubanId, cover, title, metaStr] = match;
        
        // 解析元数据
        const meta = this.parseMetadata(metaStr);
        
        // 确定类别
        const category = this.categorizeBook(title, meta);
        
        books.push({
          douban_id: doubanId,
          title: this.cleanText(title),
          author: meta.author,
          publisher: meta.publisher,
          publish_date: meta.publishDate,
          price: meta.price,
          rating: meta.rating,
          rating_count: meta.ratingCount,
          cover_url: cover,
          douban_url: url,
          category: category,
          description: '', // 需要单独获取详情页
          tags: [category],
          source: 'douban',
          crawled_at: new Date().toISOString()
        });
      } catch (e) {
        this.log(`⚠️ 解析书籍失败: ${e.message}`, 'warn');
      }
    }

    this.log(`📚 解析完成，找到 ${books.length} 本书`);
    return books;
  }

  /**
   * 解析元数据字符串
   */
  parseMetadata(metaStr) {
    const result = {
      author: '',
      publisher: '',
      publishDate: '',
      price: 0,
      rating: 0,
      ratingCount: 0
    };

    if (!metaStr) return result;

    // 清理 HTML 标签
    const text = metaStr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // 匹配作者 / 出版社 / 出版日期 / 价格
    // 格式: [作者] / [出版社] / [日期] / [价格]
    const parts = text.split('/').map(s => s.trim());
    
    if (parts.length >= 1) result.author = parts[0];
    if (parts.length >= 2) result.publisher = parts[1];
    if (parts.length >= 3) {
      // 尝试提取日期和价格
      const dateMatch = parts[2].match(/(\d{4}-?\d{0,2})/);
      if (dateMatch) result.publishDate = dateMatch[1];
    }
    if (parts.length >= 4) {
      const priceMatch = parts[3].match(/(\d+(?:\.\d+)?)/);
      if (priceMatch) result.price = parseFloat(priceMatch[1]);
    }

    // 匹配评分
    const ratingMatch = metaStr.match(/(\d+\.\d+)\s*\(\s*(\d+)\s*人评价\s*\)/);
    if (ratingMatch) {
      result.rating = parseFloat(ratingMatch[1]);
      result.ratingCount = parseInt(ratingMatch[2]);
    }

    return result;
  }

  /**
   * 根据标题和元数据分类书籍
   */
  categorizeBook(title, meta) {
    const titleLower = title.toLowerCase();
    const authorLower = (meta.author || '').toLowerCase();
    
    // 关键词匹配
    const keywords = {
      'literature': ['文学', '散文', '诗歌', '随笔', '回忆录', '传记'],
      'fiction': ['小说', '故事', '长篇', '短篇', '悬疑', '推理', '科幻', '奇幻'],
      'history': ['历史', '文化', '考古', '文明', '古代', '朝代', '史记'],
      'art': ['艺术', '设计', '绘画', '建筑', '摄影', '美学', '博物馆']
    };

    for (const [cat, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (titleLower.includes(word) || authorLower.includes(word)) {
          return cat;
        }
      }
    }

    return 'nonfiction'; // 默认类别
  }

  /**
   * 清理文本
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[\n\r\t]/g, '');
  }

  /**
   * 检查书籍是否已存在（基于 douban_id）
   */
  async isBookExists(doubanId) {
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('id')
        .eq('douban_id', doubanId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return !!data;
    } catch (error) {
      this.log(`⚠️ 检查书籍存在失败: ${error.message}`, 'warn');
      return false;
    }
  }

  /**
   * 保存书籍到 Supabase
   */
  async saveBook(book) {
    try {
      // 检查是否已存在
      const exists = await this.isBookExists(book.douban_id);
      if (exists) {
        this.stats.skipped++;
        return { status: 'skipped', douban_id: book.douban_id };
      }

      // 准备数据
      const bookData = {
        id: book.douban_id, // 使用豆瓣ID作为主键
        uuid: book.douban_id,
        title: book.title,
        subtitle: '',
        authors: JSON.stringify([book.author]),
        isbn: null,
        publisher: book.publisher,
        publish_date: book.publish_date,
        page_count: null,
        language: 'zh',
        description: book.description,
        categories: JSON.stringify([book.category]),
        cover_image_url: book.cover_url,
        rating: book.rating,
        rating_count: book.ratingCount,
        tags: JSON.stringify(book.tags),
        external_links: JSON.stringify({
          douban: book.douban_url
        }),
        sync_status: 'active',
        source: 'douban',
        crawled_at: book.crawled_at
      };

      const { error } = await this.supabase
        .from('books')
        .insert([bookData]);

      if (error) {
        // 如果是因为主键冲突，说明已存在
        if (error.code === '23505') {
          this.stats.skipped++;
          return { status: 'skipped', douban_id: book.douban_id };
        }
        throw error;
      }

      this.stats.saved++;
      return { status: 'saved', douban_id: book.douban_id };
    } catch (error) {
      this.stats.errors.push({ douban_id: book.douban_id, error: error.message });
      return { status: 'error', douban_id: book.douban_id, error: error.message };
    }
  }

  /**
   * 过滤指定类别的书籍
   */
  filterByCategory(books) {
    const targetCategories = Object.values(CONFIG.CATEGORIES);
    const filtered = books.filter(book => 
      targetCategories.includes(book.category)
    );
    this.log(`🎯 类别筛选: ${filtered.length}/${books.length} 本符合要求`);
    return filtered;
  }

  /**
   * 主执行流程
   */
  async run() {
    try {
      await this.init();

      // 1. 获取页面
      const html = await this.fetchLatestBooks();
      
      // 2. 解析书籍
      const allBooks = this.parseBooks(html);
      this.stats.fetched = allBooks.length;

      if (allBooks.length === 0) {
        this.log('⚠️ 未找到任何书籍，可能页面结构已改变', 'warn');
        return;
      }

      // 3. 按类别筛选
      const filteredBooks = this.filterByCategory(allBooks);

      // 4. 保存到 Supabase
      this.log(`💾 开始保存 ${filteredBooks.length} 本书到 Supabase...`);
      for (const book of filteredBooks) {
        await this.delay(CONFIG.DELAY_MS); // 请求间隔
        const result = await this.saveBook(book);
        if (result.status === 'saved') {
          this.log(`✅ 已保存: ${book.title.substring(0, 30)}...`);
        } else if (result.status === 'skipped') {
          this.log(`⏭️ 已存在: ${book.title.substring(0, 30)}...`);
        }
      }

      // 5. 输出统计
      this.printStats();

    } catch (error) {
      this.log(`❌ 爬虫执行失败: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  printStats() {
    this.log('\n📊 执行统计:');
    this.log(`  - 获取书籍: ${this.stats.fetched}`);
    this.log(`  - 成功保存: ${this.stats.saved}`);
    this.log(`  - 跳过(已存在): ${this.stats.skipped}`);
    this.log(`  - 错误: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      this.log('\n❌ 错误详情:');
      this.stats.errors.forEach(e => {
        this.log(`  - ${e.douban_id}: ${e.error}`);
      });
    }
  }
}

// 主执行
if (require.main === module) {
  const crawler = new DoubanCrawler();
  crawler.run();
}

module.exports = DoubanCrawler;
