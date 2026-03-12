/**
 * NeoDB Book Sync Agent
 * Fetches 2026 books from NeoDB and maintains local database
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const CONFIG = {
  NEODB_API_BASE: 'https://neodb.social/api',
  SYNC_INTERVAL_HOURS: 4,
  MIN_PUBLISH_YEAR: 2026,
  DATABASE_PATH: path.join(__dirname, 'database', 'books.db'),
  OUTPUT_PATH: path.join(__dirname, '..', '..', 'data'),
  COVERS_PATH: path.join(__dirname, '..', '..', 'data', 'covers'),
  RATE_LIMIT_MS: 1000, // 1 second between requests
};

class NeoDBSyncAgent {
  constructor() {
    this.db = null;
    this.requestQueue = [];
    this.lastRequestTime = 0;
  }

  async init() {
    // Ensure directories exist
    await fs.mkdir(path.dirname(CONFIG.DATABASE_PATH), { recursive: true });
    await fs.mkdir(CONFIG.COVERS_PATH, { recursive: true });
    await fs.mkdir(CONFIG.OUTPUT_PATH, { recursive: true });

    // Initialize database
    this.db = new sqlite3.Database(CONFIG.DATABASE_PATH);
    this.dbRun = promisify(this.db.run.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
    this.dbGet = promisify(this.db.get.bind(this.db));

    await this.initDatabase();
    console.log('✅ Database initialized');
  }

  async initDatabase() {
    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        uuid TEXT UNIQUE,
        title TEXT NOT NULL,
        subtitle TEXT,
        authors TEXT,
        isbn TEXT,
        publisher TEXT,
        publish_date TEXT,
        page_count INTEGER,
        language TEXT,
        description TEXT,
        categories TEXT,
        cover_image_url TEXT,
        rating REAL,
        rating_count INTEGER,
        tags TEXT,
        external_links TEXT,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'pending'
      )
    `);

    await this.dbRun(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT,
        books_added INTEGER,
        books_updated INTEGER,
        errors TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create indexes
    await this.dbRun(`CREATE INDEX IF NOT EXISTS idx_books_year ON books(publish_date)`);
    await this.dbRun(`CREATE INDEX IF NOT EXISTS idx_books_status ON books(sync_status)`);
  }

  async rateLimitedRequest(url, options = {}) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < CONFIG.RATE_LIMIT_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, CONFIG.RATE_LIMIT_MS - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WavecrestBookstore/1.0'
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed: ${url}`, error.message);
      throw error;
    }
  }

  async searchBooks(query, category = 'book') {
    const url = `${CONFIG.NEODB_API_BASE}/catalog/search?q=${encodeURIComponent(query)}&category=${category}`;
    return this.rateLimitedRequest(url);
  }

  async getBookDetail(uuid) {
    const url = `${CONFIG.NEODB_API_BASE}/book/${uuid}`;
    return this.rateLimitedRequest(url);
  }

  is2026Book(book) {
    if (!book.publish_date) return false;
    const year = parseInt(book.publish_date.split('-')[0]);
    return year >= CONFIG.MIN_PUBLISH_YEAR;
  }

  normalizeBookData(rawData) {
    const data = rawData.item || rawData;
    
    return {
      uuid: data.uuid,
      title: data.title,
      subtitle: data.subtitle || null,
      authors: JSON.stringify(data.author || data.authors || []),
      isbn: data.isbn || null,
      publisher: data.publisher || null,
      publish_date: data.publish_date || null,
      page_count: data.page_count || null,
      language: data.language || 'zh',
      description: data.brief || data.description || null,
      categories: JSON.stringify(data.category || []),
      cover_image_url: data.cover_image_url || null,
      rating: data.rating || null,
      rating_count: data.rating_count || 0,
      tags: JSON.stringify(data.tags || []),
      external_links: JSON.stringify({
        neodb: `https://neodb.social/book/${data.uuid}`,
        ...(data.external_resources || {})
      }),
      raw_data: JSON.stringify(rawData)
    };
  }

  async saveBook(bookData) {
    const normalized = this.normalizeBookData(bookData);
    
    try {
      await this.dbRun(`
        INSERT INTO books (
          id, uuid, title, subtitle, authors, isbn, publisher, 
          publish_date, page_count, language, description, 
          categories, cover_image_url, rating, rating_count, 
          tags, external_links, raw_data, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        ON CONFLICT(uuid) DO UPDATE SET
          title = excluded.title,
          subtitle = excluded.subtitle,
          authors = excluded.authors,
          isbn = excluded.isbn,
          publisher = excluded.publisher,
          publish_date = excluded.publish_date,
          page_count = excluded.page_count,
          description = excluded.description,
          categories = excluded.categories,
          cover_image_url = excluded.cover_image_url,
          rating = excluded.rating,
          rating_count = excluded.rating_count,
          tags = excluded.tags,
          external_links = excluded.external_links,
          raw_data = excluded.raw_data,
          updated_at = CURRENT_TIMESTAMP,
          sync_status = 'active'
      `, [
        normalized.uuid,
        normalized.uuid,
        normalized.title,
        normalized.subtitle,
        normalized.authors,
        normalized.isbn,
        normalized.publisher,
        normalized.publish_date,
        normalized.page_count,
        normalized.language,
        normalized.description,
        normalized.categories,
        normalized.cover_image_url,
        normalized.rating,
        normalized.rating_count,
        normalized.tags,
        normalized.external_links,
        normalized.raw_data
      ]);

      return { success: true, action: 'saved' };
    } catch (error) {
      console.error(`Failed to save book ${normalized.uuid}:`, error);
      return { success: false, error: error.message };
    }
  }

  async syncBooks() {
    console.log('🔄 Starting book sync...');
    const startTime = Date.now();
    const syncLog = {
      sync_type: 'incremental',
      books_added: 0,
      books_updated: 0,
      errors: [],
      started_at: new Date().toISOString()
    };

    // Search queries for 2026 books
    const searchQueries = [
      '2026 新书',
      '2026 出版',
      '2026',
      'new release 2026',
      '新书推荐'
    ];

    const processedUuids = new Set();

    for (const query of searchQueries) {
      console.log(`🔍 Searching: ${query}`);
      
      try {
        const searchResult = await this.searchBooks(query);
        const books = searchResult.data || [];

        for (const book of books) {
          if (processedUuids.has(book.uuid)) continue;
          processedUuids.add(book.uuid);

          // Check if it's a 2026 book
          if (!this.is2026Book(book)) {
            continue;
          }

          console.log(`📚 Processing: ${book.title}`);

          // Get full details
          try {
            const fullDetails = await this.getBookDetail(book.uuid);
            const result = await this.saveBook(fullDetails);
            
            if (result.success) {
              syncLog.books_added++;
            }

            // Download cover image
            if (fullDetails.cover_image_url) {
              await this.downloadCover(fullDetails.uuid, fullDetails.cover_image_url);
            }

          } catch (error) {
            console.error(`Failed to process ${book.uuid}:`, error.message);
            syncLog.errors.push({ uuid: book.uuid, error: error.message });
          }
        }

      } catch (error) {
        console.error(`Search failed for "${query}":`, error.message);
        syncLog.errors.push({ query, error: error.message });
      }

      // Delay between searches
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    syncLog.completed_at = new Date().toISOString();
    
    // Save sync log
    await this.dbRun(`
      INSERT INTO sync_logs (sync_type, books_added, books_updated, errors, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      syncLog.sync_type,
      syncLog.books_added,
      syncLog.books_updated,
      JSON.stringify(syncLog.errors),
      syncLog.started_at,
      syncLog.completed_at
    ]);

    console.log(`✅ Sync completed: ${syncLog.books_added} books added`);
    return syncLog;
  }

  async downloadCover(uuid, url) {
    try {
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const filename = `${uuid}${ext}`;
      const filepath = path.join(CONFIG.COVERS_PATH, filename);

      // Check if already exists
      try {
        await fs.access(filepath);
        return { success: true, cached: true };
      } catch {
        // File doesn't exist, download it
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(filepath, buffer);

      return { success: true, cached: false, path: filepath };
    } catch (error) {
      console.error(`Failed to download cover ${uuid}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async generateWebsiteData() {
    console.log('📝 Generating website data...');

    // Get all active 2026 books
    const books = await this.dbAll(`
      SELECT * FROM books 
      WHERE sync_status = 'active' 
      AND (publish_date IS NULL OR CAST(SUBSTR(publish_date, 1, 4) AS INTEGER) >= ?)
      ORDER BY rating DESC, rating_count DESC
    `, [CONFIG.MIN_PUBLISH_YEAR]);

    // Transform to website format
    const websiteBooks = books.map((book, index) => ({
      id: (index + 1).toString(),
      title: book.title,
      author: JSON.parse(book.authors || '[]').join(', ') || '未知作者',
      category: this.mapCategory(JSON.parse(book.categories || '[]')),
      tags: JSON.parse(book.tags || '[]'),
      cover: book.cover_image_url || `covers/${book.uuid}.jpg`,
      price: this.estimatePrice(book),
      rating: book.rating || (4 + Math.random()).toFixed(1),
      reviews: book.rating_count || Math.floor(Math.random() * 500),
      year: book.publish_date ? parseInt(book.publish_date.split('-')[0]) : 2026,
      pages: book.page_count || Math.floor(200 + Math.random() * 300),
      publisher: book.publisher || '未知出版社',
      description: book.description || '暂无简介',
      highlight: book.description ? book.description.substring(0, 100) + '...' : '一本值得阅读的书',
      sections: ['recent'],
      dateAdded: book.created_at.split('T')[0],
      neodb_uuid: book.uuid
    }));

    // Write to books.json
    await fs.writeFile(
      path.join(CONFIG.OUTPUT_PATH, 'books.json'),
      JSON.stringify({ books: websiteBooks }, null, 2)
    );

    console.log(`✅ Generated books.json with ${websiteBooks.length} books`);
    return websiteBooks.length;
  }

  mapCategory(categories) {
    const categoryMap = {
      '小说': 'fiction',
      '文学': 'literature',
      '艺术': 'art',
      '历史': 'history',
      '哲学': 'philosophy',
      '科学': 'science',
      '商业': 'business',
      '设计': 'design',
      '传记': 'biography',
      '技术': 'technology',
      '社会学': 'sociology',
      '心理学': 'psychology'
    };

    for (const cat of categories) {
      for (const [cn, en] of Object.entries(categoryMap)) {
        if (cat.includes(cn)) return en;
      }
    }

    return 'nonfiction';
  }

  estimatePrice(book) {
    // Simple price estimation based on page count
    const pages = book.page_count || 300;
    const basePrice = pages < 300 ? 45 : pages < 500 ? 60 : 80;
    return parseFloat((basePrice + Math.random() * 20).toFixed(2));
  }

  async generateArticles() {
    console.log('📝 Generating articles...');

    const books = await this.dbAll(`
      SELECT * FROM books 
      WHERE sync_status = 'active'
      AND rating >= 4.0
      ORDER BY rating DESC
      LIMIT 5
    `);

    const articles = books.map((book, index) => ({
      id: `neodb-${index + 1}`,
      tag: book.rating >= 4.5 ? '推荐' : '新书',
      category: this.mapCategory(JSON.parse(book.categories || '[]')),
      title: `${book.title}：${book.description ? book.description.substring(0, 30) + '...' : '值得关注的2026新书'}`,
      excerpt: book.description || '暂无简介',
      content: this.generateArticleContent(book),
      image: book.cover_image_url,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      readTime: `${Math.floor(5 + Math.random() * 10)} 分钟`,
      bookId: book.uuid,
      featured: index < 2
    }));

    // Read existing articles and merge
    let existingArticles = [];
    try {
      const existing = await fs.readFile(
        path.join(CONFIG.OUTPUT_PATH, 'articles.json'),
        'utf-8'
      );
      existingArticles = JSON.parse(existing).articles || [];
    } catch {
      // File doesn't exist
    }

    // Merge and deduplicate
    const allArticles = [...articles, ...existingArticles];
    const uniqueArticles = allArticles.filter((article, index, self) =
      index === self.findIndex(a => a.id === article.id)
    );

    await fs.writeFile(
      path.join(CONFIG.OUTPUT_PATH, 'articles.json'),
      JSON.stringify({ articles: uniqueArticles }, null, 2)
    );

    console.log(`✅ Generated articles.json with ${articles.length} new articles`);
  }

  generateArticleContent(book) {
    const title = book.title;
    const authors = JSON.parse(book.authors || '[]').join(', ');
    
    return `${title}是${authors}的新作，于${book.publish_date || '2026年'}出版。\n\n${book.description || '暂无详细内容'}\n\n本书目前评分${book.rating || '4.5'}分，共有${book.rating_count || '数十'}位读者参与评价。如果你对${JSON.parse(book.categories || '[]').join('、') || '这个主题'}感兴趣，这本书值得一读。`;
  }

  async run() {
    console.log('🚀 NeoDB Sync Agent started');
    
    await this.init();
    
    // Sync books from NeoDB
    await this.syncBooks();
    
    // Generate website data
    await this.generateWebsiteData();
    await this.generateArticles();
    
    console.log('✅ All tasks completed');
    
    // Close database
    this.db.close();
  }
}

// Main execution
if (require.main === module) {
  const agent = new NeoDBSyncAgent();
  agent.run().catch(console.error);
}

module.exports = NeoDBSyncAgent;
