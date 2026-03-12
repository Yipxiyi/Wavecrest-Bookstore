# Wavecrest Bookstore - 多数据源架构重构方案

## 📊 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Wavecrest Bookstore 前端                         │
│                     (React/Vue.js - 静态页面部署)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      API Gateway (Node.js/Fastify)                      │
│                    ┌──────────────────────────────┐                     │
│                    │  - 请求限流 (Rate Limiting)   │                     │
│                    │  - 认证授权 (JWT/OAuth2)      │                     │
│                    │  - 缓存响应 (Redis)           │                     │
│                    └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Internal Book Service Layer                         │
│                    ┌──────────────────────────────┐                     │
│                    │  - 数据聚合与合并             │                     │
│                    │  - 数据归一化                 │                     │
│                    │  - 冲突解决策略               │                     │
│                    └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Local Database │  │   Sync Jobs      │  │   Cache Layer    │
│   (PostgreSQL)   │  │   (Bull Queue)   │  │   (Redis)        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Google Books API │  │ OpenLibrary API  │  │   NeoDB API      │
│  (主要元数据源)   │  │  (元数据补充)     │  │ (社区数据层)      │
│                  │  │                  │  │                  │
│  - Title         │  │  - Editions      │  │  - Ratings       │
│  - Authors       │  │  - Works         │  │  - Reviews       │
│  - ISBN          │  │  - Subjects      │  │  - Tags          │
│  - Publisher     │  │  - Covers        │  │  - Reading List  │
│  - Description   │  │                  │  │                  │
│  - Categories    │  │                  │  │                  │
│  - Cover Image   │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## 🗄️ 数据库 Schema 设计

### 核心表结构

```sql
-- 1. 书籍主表 (books)
CREATE TABLE books (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_id         VARCHAR(50) UNIQUE NOT NULL,  -- 内部ID: WB-2024-XXXX
    
    -- 基础元数据
    title               VARCHAR(500) NOT NULL,
    subtitle            VARCHAR(500),
    authors             TEXT[],  -- PostgreSQL array
    publisher           VARCHAR(200),
    publication_date    DATE,
    page_count          INTEGER,
    language            VARCHAR(10) DEFAULT 'zh',
    description         TEXT,
    
    -- ISBN (多格式支持)
    isbn_10             VARCHAR(10),
    isbn_13             VARCHAR(13),
    isbn_other          JSONB,  -- 其他ISBN格式
    
    -- 分类系统
    categories          TEXT[],
    subjects            TEXT[],
    
    -- 封面图片
    cover_image_url     VARCHAR(1000),
    cover_image_local   VARCHAR(500),  -- 本地缓存路径
    preview_link        VARCHAR(1000),
    
    -- 外部ID映射
    external_ids        JSONB DEFAULT '{}',
    -- {
    --   "google_books_id": "abc123",
    --   "openlibrary_id": "OL123W",
    --   "neodb_id": "neo456"
    -- }
    
    -- 数据状态
    metadata_status     VARCHAR(20) DEFAULT 'pending',  -- pending/active/error/deprecated
    last_sync_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    -- 搜索索引支持
    search_vector       TSVECTOR,
    
    -- 约束
    CONSTRAINT valid_isbn_10 CHECK (isbn_10 IS NULL OR LENGTH(isbn_10) = 10),
    CONSTRAINT valid_isbn_13 CHECK (isbn_13 IS NULL OR LENGTH(isbn_13) = 13)
);

-- 2. 社区数据表 (book_community_data)
CREATE TABLE book_community_data (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id             UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    source              VARCHAR(50) NOT NULL,  -- 'neodb', 'douban', 'goodreads'
    
    -- 评分数据
    rating_average      DECIMAL(3,2),  -- 0.00 - 5.00
    rating_count        INTEGER DEFAULT 0,
    rating_distribution JSONB,  -- { "5": 100, "4": 50, ... }
    
    -- 评论统计
    review_count        INTEGER DEFAULT 0,
    
    -- 标签
    tags                TEXT[],
    
    -- 阅读状态统计
    reading_status      JSONB,  -- { "want_to_read": 100, "reading": 50, "read": 200 }
    
    -- 原始数据缓存
    raw_data            JSONB,
    
    fetched_at          TIMESTAMP DEFAULT NOW(),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(book_id, source)
);

-- 3. 数据源同步日志 (sync_logs)
CREATE TABLE sync_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name            VARCHAR(100) NOT NULL,  -- 'google_books_sync', 'neodb_sync'
    job_type            VARCHAR(50),  -- 'full', 'incremental', 'manual'
    status              VARCHAR(20) NOT NULL,  -- 'running', 'completed', 'failed'
    
    -- 统计信息
    total_processed     INTEGER DEFAULT 0,
    success_count       INTEGER DEFAULT 0,
    error_count         INTEGER DEFAULT 0,
    
    -- 错误详情
    errors              JSONB[],
    
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- 4. API 请求日志 (api_request_logs) - 用于限流和监控
CREATE TABLE api_request_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider            VARCHAR(50) NOT NULL,  -- 'google_books', 'openlibrary', 'neodb'
    endpoint            VARCHAR(500),
    request_params      JSONB,
    response_status     INTEGER,
    response_time_ms    INTEGER,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- 5. 封面图片缓存表 (cover_image_cache)
CREATE TABLE cover_image_cache (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id             UUID REFERENCES books(id) ON DELETE CASCADE,
    source_url          VARCHAR(1000) NOT NULL,
    local_path          VARCHAR(500),
    file_size           INTEGER,
    checksum            VARCHAR(64),
    width               INTEGER,
    height              INTEGER,
    format              VARCHAR(10),  -- 'jpg', 'png', 'webp'
    
    status              VARCHAR(20) DEFAULT 'pending',  -- pending/downloaded/error
    error_message       TEXT,
    
    downloaded_at       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- 6. 搜索索引表 (用于未来的 Elasticsearch/MeiliSearch)
CREATE TABLE search_index (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id             UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    
    -- 可搜索字段
    title_search        VARCHAR(500),
    author_search       TEXT[],
    description_search  TEXT,
    
    -- 过滤器字段
    categories_filter   TEXT[],
    rating_filter       DECIMAL(3,2),
    year_filter         INTEGER,
    
    -- 排序字段
    popularity_score    INTEGER DEFAULT 0,
    
    indexed_at          TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(book_id)
);

-- 索引优化
CREATE INDEX idx_books_isbn_13 ON books(isbn_13);
CREATE INDEX idx_books_isbn_10 ON books(isbn_10);
CREATE INDEX idx_books_status ON books(metadata_status);
CREATE INDEX idx_books_search ON books USING GIN(search_vector);
CREATE INDEX idx_books_updated ON books(updated_at);

CREATE INDEX idx_community_book_source ON book_community_data(book_id, source);
CREATE INDEX idx_community_rating ON book_community_data(rating_average);

CREATE INDEX idx_sync_logs_job ON sync_logs(job_name, created_at DESC);
CREATE INDEX idx_api_logs_provider ON api_request_logs(provider, created_at DESC);

CREATE INDEX idx_search_title ON search_index USING GIN(title_search gin_trgm_ops);
```

## 📦 数据模型 (TypeScript)

```typescript
// src/types/book.ts

// 基础书籍接口
export interface Book {
  id: string;
  internalId: string;
  
  // 基础元数据
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publicationDate?: string;
  pageCount?: number;
  language: string;
  description?: string;
  
  // ISBN
  isbn10?: string;
  isbn13?: string;
  isbnOther?: Record<string, string>;
  
  // 分类
  categories: string[];
  subjects: string[];
  
  // 媒体
  coverImageUrl?: string;
  coverImageLocal?: string;
  previewLink?: string;
  
  // 外部ID
  externalIds: ExternalIds;
  
  // 状态
  metadataStatus: 'pending' | 'active' | 'error' | 'deprecated';
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalIds {
  googleBooksId?: string;
  openlibraryId?: string;
  neodbId?: string;
  doubanId?: string;
}

// 社区数据接口
export interface BookCommunityData {
  id: string;
  bookId: string;
  source: 'neodb' | 'douban' | 'goodreads';
  
  ratingAverage?: number;
  ratingCount: number;
  ratingDistribution?: Record<string, number>;
  
  reviewCount: number;
  tags: string[];
  readingStatus?: Record<string, number>;
  
  rawData?: any;
  fetchedAt: string;
}

// 统一的API响应格式
export interface BookDetail extends Book {
  communityData: BookCommunityData[];
  relatedBooks?: Book[];
}
```

## 🔌 API 集成模块设计

### 目录结构

```
src/
├── config/
│   ├── database.ts           # 数据库配置
│   ├── redis.ts              # Redis配置
│   └── api-keys.ts           # API密钥管理
├── models/
│   ├── book.ts               # Book模型
│   ├── community-data.ts     # 社区数据模型
│   └── sync-log.ts           # 同步日志模型
├── services/
│   ├── book-service.ts       # 核心业务逻辑
│   ├── cache-service.ts      # 缓存服务
│   └── search-service.ts     # 搜索服务 (预留)
├── adapters/
│   ├── google-books.adapter.ts    # Google Books API适配器
│   ├── openlibrary.adapter.ts     # OpenLibrary API适配器
│   └── neodb.adapter.ts           # NeoDB API适配器
├── jobs/
│   ├── sync-metadata.job.ts       # 元数据同步任务
│   ├── sync-community.job.ts      # 社区数据同步任务
│   └── download-covers.job.ts     # 封面下载任务
├── queue/
│   └── sync.queue.ts         # 任务队列配置
└── utils/
    ├── isbn-validator.ts     # ISBN验证工具
    ├── data-normalizer.ts    # 数据归一化工具
    └── rate-limiter.ts       # API限流工具
```

### 1. Google Books Adapter

```typescript
// src/adapters/google-books.adapter.ts

import { BookMetadata, ExternalIds } from '../types/book';

const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1';

export class GoogleBooksAdapter {
  private apiKey: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter({
      maxRequests: 100,  // Google Books免费配额: 100请求/天
      windowMs: 24 * 60 * 60 * 1000
    });
  }

  // 按ISBN搜索
  async searchByISBN(isbn: string): Promise<BookMetadata | null> {
    await this.rateLimiter.acquire();
    
    try {
      const response = await fetch(
        `${GOOGLE_BOOKS_API_BASE}/volumes?q=isbn:${isbn}&key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }
      
      return this.normalizeBookData(data.items[0]);
    } catch (error) {
      console.error('Google Books search failed:', error);
      throw error;
    }
  }

  // 按标题搜索
  async searchByTitle(title: string, maxResults: number = 10): Promise<BookMetadata[]> {
    await this.rateLimiter.acquire();
    
    const response = await fetch(
      `${GOOGLE_BOOKS_API_BASE}/volumes?q=${encodeURIComponent(title)}+intitle:${encodeURIComponent(title)}&maxResults=${maxResults}&key=${this.apiKey}`
    );
    
    const data = await response.json();
    
    if (!data.items) return [];
    
    return data.items.map((item: any) => this.normalizeBookData(item));
  }

  // 获取单本书详情
  async getVolume(volumeId: string): Promise<BookMetadata | null> {
    await this.rateLimiter.acquire();
    
    const response = await fetch(
      `${GOOGLE_BOOKS_API_BASE}/volumes/${volumeId}?key=${this.apiKey}`
    );
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data = await response.json();
    return this.normalizeBookData(data);
  }

  // 数据归一化
  private normalizeBookData(item: any): BookMetadata {
    const volumeInfo = item.volumeInfo;
    
    return {
      externalIds: {
        googleBooksId: item.id
      },
      title: volumeInfo.title || '',
      subtitle: volumeInfo.subtitle,
      authors: volumeInfo.authors || [],
      publisher: volumeInfo.publisher,
      publicationDate: volumeInfo.publishedDate,
      pageCount: volumeInfo.pageCount,
      language: volumeInfo.language || 'en',
      description: volumeInfo.description,
      isbn10: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_10'),
      isbn13: this.extractISBN(volumeInfo.industryIdentifiers, 'ISBN_13'),
      categories: volumeInfo.categories || [],
      coverImageUrl: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
      previewLink: volumeInfo.previewLink
    };
  }

  private extractISBN(identifiers: any[], type: string): string | undefined {
    if (!identifiers) return undefined;
    const identifier = identifiers.find(id => id.type === type);
    return identifier?.identifier;
  }
}

// 使用示例
const googleBooks = new GoogleBooksAdapter(process.env.GOOGLE_BOOKS_API_KEY!);

// 搜索ISBN
const book = await googleBooks.searchByISBN('9787580801951');
```

### 2. OpenLibrary Adapter

```typescript
// src/adapters/openlibrary.adapter.ts

const OPENLIBRARY_API_BASE = 'https://openlibrary.org';

export class OpenLibraryAdapter {
  private rateLimiter: RateLimiter;

  constructor() {
    // OpenLibrary没有严格的API限制，但还是需要限流
    this.rateLimiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 60 * 1000  // 100请求/分钟
    });
  }

  // 按ISBN搜索
  async searchByISBN(isbn: string): Promise<Partial<BookMetadata> | null> {
    await this.rateLimiter.acquire();
    
    const cleanISBN = isbn.replace(/-/g, '');
    
    const response = await fetch(
      `${OPENLIBRARY_API_BASE}/isbn/${cleanISBN}.json`
    );
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`OpenLibrary API error: ${response.status}`);
    
    const data = await response.json();
    return this.normalizeBookData(data);
  }

  // 获取作品详情
  async getWork(workId: string): Promise<any> {
    await this.rateLimiter.acquire();
    
    const response = await fetch(
      `${OPENLIBRARY_API_BASE}/works/${workId}.json`
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  // 获取版本列表
  async getEditions(workId: string): Promise<any[]> {
    await this.rateLimiter.acquire();
    
    const response = await fetch(
      `${OPENLIBRARY_API_BASE}/works/${workId}/editions.json`
    );
    
    const data = await response.json();
    return data.entries || [];
  }

  // 搜索
  async search(query: string, limit: number = 10): Promise<Partial<BookMetadata>[]> {
    await this.rateLimiter.acquire();
    
    const response = await fetch(
      `${OPENLIBRARY_API_BASE}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    const data = await response.json();
    
    if (!data.docs) return [];
    
    return data.docs.map((doc: any) => ({
      externalIds: {
        openlibraryId: doc.key?.replace('/works/', '')
      },
      title: doc.title,
      authors: doc.author_name || [],
      publishYear: doc.first_publish_year,
      isbn: doc.isbn?.[0],
      subjects: doc.subject || []
    }));
  }

  private normalizeBookData(data: any): Partial<BookMetadata> {
    return {
      externalIds: {
        openlibraryId: data.works?.[0]?.key?.replace('/works/', '')
      },
      title: data.title,
      authors: data.authors?.map((a: any) => a.name) || [],
      publishers: data.publishers,
      publishDate: data.publish_date,
      pageCount: data.number_of_pages,
      isbn10: data.isbn_10?.[0],
      isbn13: data.isbn_13?.[0],
      coverImageUrl: data.covers?.[0] 
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : undefined
    };
  }
}
```

### 3. NeoDB Adapter

```typescript
// src/adapters/neodb.adapter.ts

const NEODB_API_BASE = 'https://neodb.social/api';

export class NeoDBAdapter {
  private accessToken?: string;
  private rateLimiter: RateLimiter;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
    this.rateLimiter = new RateLimiter({
      maxRequests: 60,
      windowMs: 60 * 1000  // 60请求/分钟
    });
  }

  // 搜索书籍
  async searchBook(query: string): Promise<any[]> {
    await this.rateLimiter.acquire();
    
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    const response = await fetch(
      `${NEODB_API_BASE}/catalog/search?q=${encodeURIComponent(query)}&category=book`,
      { headers }
    );
    
    if (!response.ok) throw new Error(`NeoDB API error: ${response.status}`);
    
    const data = await response.json();
    return data.data || [];
  }

  // 按外部ID查找 (支持ISBN, Douban ID等)
  async fetchByExternalId(
    source: 'isbn' | 'douban' | 'goodreads',
    externalId: string
  ): Promise<any | null> {
    await this.rateLimiter.acquire();
    
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    const response = await fetch(
      `${NEODB_API_BASE}/catalog/fetch?${source}=${externalId}`,
      { headers }
    );
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    return response.json();
  }

  // 获取书籍详情
  async getBookDetail(uuid: string): Promise<any | null> {
    await this.rateLimiter.acquire();
    
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    const response = await fetch(
      `${NEODB_API_BASE}/book/${uuid}`,
      { headers }
    );
    
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    return response.json();
  }

  // 获取评分和评论
  async getReviews(uuid: string, page: number = 1): Promise<any> {
    await this.rateLimiter.acquire();
    
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    
    const response = await fetch(
      `${NEODB_API_BASE}/book/${uuid}/reviews?page=${page}`,
      { headers }
    );
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  }

  // 归一化社区数据
  normalizeCommunityData(data: any): Partial<BookCommunityData> {
    return {
      source: 'neodb',
      externalIds: {
        neodbId: data.uuid
      },
      ratingAverage: data.rating,
      ratingCount: data.rating_count,
      tags: data.tags || [],
      coverImageUrl: data.cover_image_url
    };
  }
}
```

## ⚡ 数据同步任务设计

### 任务队列配置 (Bull Queue + Redis)

```typescript
// src/queue/sync.queue.ts

import Queue from 'bull';
import Redis from 'ioredis';

// Redis连接
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD
});

// 同步任务队列
export const syncQueue = new Queue('book-sync', {
  redis: redisClient.options
});

// 任务处理器
syncQueue.process('metadata-sync', 5, async (job) => {
  const { isbn, priority } = job.data;
  // 调用同步服务
  return await metadataSyncService.sync(isbn, priority);
});

syncQueue.process('community-sync', 3, async (job) => {
  const { bookId, sources } = job.data;
  return await communitySyncService.sync(bookId, sources);
});

syncQueue.process('cover-download', 2, async (job) => {
  const { bookId, imageUrl } = job.data;
  return await coverDownloadService.download(bookId, imageUrl);
});

// 任务调度器
export class SyncScheduler {
  // 每日全量同步 (凌晨2点)
  async scheduleDailyFullSync() {
    await syncQueue.add(
      'daily-full-sync',
      { type: 'full' },
      {
        repeat: {
          cron: '0 2 * * *'  // 每天凌晨2点
        },
        priority: 1
      }
    );
  }

  // 每4小时增量同步社区数据
  async scheduleIncrementalCommunitySync() {
    await syncQueue.add(
      'incremental-community-sync',
      { type: 'incremental' },
      {
        repeat: {
          every: 4 * 60 * 60 * 1000  // 4小时
        },
        priority: 2
      }
    );
  }

  // 手动触发单本书同步
  async syncSingleBook(isbn: string, priority: boolean = false) {
    await syncQueue.add(
      'metadata-sync',
      { isbn, priority },
      {
        priority: priority ? 0 : 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );
  }
}
```

### 元数据同步服务

```typescript
// src/jobs/sync-metadata.job.ts

import { GoogleBooksAdapter } from '../adapters/google-books.adapter';
import { OpenLibraryAdapter } from '../adapters/openlibrary.adapter';
import { BookRepository } from '../repositories/book.repository';
import { DataMerger } from '../utils/data-merger';

export class MetadataSyncService {
  private googleBooks: GoogleBooksAdapter;
  private openLibrary: OpenLibraryAdapter;
  private bookRepo: BookRepository;
  private dataMerger: DataMerger;

  constructor() {
    this.googleBooks = new GoogleBooksAdapter(process.env.GOOGLE_BOOKS_API_KEY!);
    this.openLibrary = new OpenLibraryAdapter();
    this.bookRepo = new BookRepository();
    this.dataMerger = new DataMerger();
  }

  // 同步单本书的元数据
  async sync(isbn: string, priority: boolean = false): Promise<boolean> {
    try {
      // 1. 检查本地缓存
      const existingBook = await this.bookRepo.findByISBN(isbn);
      
      // 如果存在且最近同步过，跳过
      if (existingBook && !this.shouldResync(existingBook.lastSyncAt)) {
        console.log(`Skipping ${isbn}, recently synced`);
        return true;
      }

      // 2. 并行获取多个数据源
      const [googleData, openLibraryData] = await Promise.allSettled([
        this.googleBooks.searchByISBN(isbn),
        this.openLibrary.searchByISBN(isbn)
      ]);

      // 3. 合并数据
      const mergedData = this.dataMerger.merge({
        primary: googleData.status === 'fulfilled' ? googleData.value : null,
        secondary: openLibraryData.status === 'fulfilled' ? openLibraryData.value : null
      });

      if (!mergedData) {
        console.log(`No data found for ISBN: ${isbn}`);
        return false;
      }

      // 4. 保存到数据库
      if (existingBook) {
        await this.bookRepo.update(existingBook.id, {
          ...mergedData,
          lastSyncAt: new Date(),
          metadataStatus: 'active'
        });
      } else {
        await this.bookRepo.create({
          ...mergedData,
          internalId: this.generateInternalId(),
          lastSyncAt: new Date(),
          metadataStatus: 'active'
        });
      }

      // 5. 触发封面下载任务
      if (mergedData.coverImageUrl) {
        await syncQueue.add('cover-download', {
          bookId: existingBook?.id,
          imageUrl: mergedData.coverImageUrl
        });
      }

      return true;
    } catch (error) {
      console.error(`Failed to sync ${isbn}:`, error);
      await this.logSyncError(isbn, error);
      return false;
    }
  }

  // 批量同步
  async batchSync(isbns: string[], concurrency: number = 5): Promise<void> {
    const batches = this.chunk(isbns, concurrency);
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(isbn => this.sync(isbn))
      );
      
      // 延迟避免限流
      await this.sleep(1000);
    }
  }

  private shouldResync(lastSyncAt: Date | null): boolean {
    if (!lastSyncAt) return true;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return lastSyncAt < oneWeekAgo;
  }

  private generateInternalId(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WB-${year}-${random}`;
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logSyncError(isbn: string, error: any): Promise<void> {
    // 记录到 sync_logs 表
  }
}
```

### 数据合并策略

```typescript
// src/utils/data-merger.ts

export class DataMerger {
  // 字段优先级配置
  private fieldPriority: Record<string, string[]> = {
    title: ['google_books', 'openlibrary'],
    authors: ['google_books', 'openlibrary'],
    description: ['google_books', 'openlibrary'],  // Google Books描述更详细
    coverImage: ['google_books', 'openlibrary'],
    pageCount: ['google_books', 'openlibrary'],
    publisher: ['openlibrary', 'google_books'],  // OpenLibrary出版信息更准确
    subjects: ['openlibrary', 'google_books']   // OpenLibrary主题更丰富
  };

  merge(data: {
    primary: BookMetadata | null;
    secondary: Partial<BookMetadata> | null;
  }): BookMetadata | null {
    const { primary, secondary } = data;
    
    // 如果主数据源不存在，返回次数据源（如果有）
    if (!primary && !secondary) return null;
    if (!primary) return secondary as BookMetadata;
    if (!secondary) return primary;

    return {
      ...primary,
      // 合并字段
      authors: this.mergeArrays(primary.authors, secondary.authors),
      categories: this.mergeArrays(primary.categories, secondary.categories),
      subjects: this.mergeArrays(primary.subjects, secondary.subjects),
      // 优先使用更详细的描述
      description: this.selectLonger(primary.description, secondary.description),
      // 补充缺失的字段
      pageCount: primary.pageCount || secondary.pageCount,
      publisher: primary.publisher || secondary.publisher
    };
  }

  private mergeArrays<T>(arr1?: T[], arr2?: T[]): T[] {
    const set = new Set([...(arr1 || []), ...(arr2 || [])]);
    return Array.from(set);
  }

  private selectLonger(str1?: string, str2?: string): string | undefined {
    if (!str1) return str2;
    if (!str2) return str1;
    return str1.length >= str2.length ? str1 : str2;
  }
}
```

## 📋 API 使用示例

### 1. Google Books API

```bash
# 按ISBN搜索
curl "https://www.googleapis.com/books/v1/volumes?q=isbn:9787580801951&key=YOUR_API_KEY"

# 响应示例
{
  "kind": "books#volumes",
  "totalItems": 1,
  "items": [{
    "id": "abc123",
    "volumeInfo": {
      "title": "经过检视的人生",
      "authors": ["詹姆斯·米勒"],
      "publisher": "江苏凤凰文艺出版社",
      "publishedDate": "2026-03",
      "description": "...",
      "industryIdentifiers": [
        {"type": "ISBN_13", "identifier": "9787580801951"}
      ],
      "pageCount": 520,
      "categories": ["Philosophy", "Biography"],
      "imageLinks": {
        "thumbnail": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1"
      }
    }
  }]
}

# 搜索标题 (带缓存)
curl "https://www.googleapis.com/books/v1/volumes?q=intitle:哲学+inauthor:米勒&maxResults=10&key=YOUR_API_KEY"
```

### 2. OpenLibrary API

```bash
# 按ISBN获取
curl "https://openlibrary.org/isbn/9787580801951.json"

# 响应示例
{
  "title": "经过检视的人生",
  "authors": [{"name": "詹姆斯·米勒"}],
  "publishers": ["江苏凤凰文艺出版社"],
  "publish_date": "2026",
  "number_of_pages": 520,
  "isbn_13": ["9787580801951"],
  "covers": [12345678],
  "works": [{"key": "/works/OL123W"}]
}

# 获取封面图片
# https://covers.openlibrary.org/b/id/12345678-L.jpg

# 搜索
curl "https://openlibrary.org/search.json?q=philosophy+miller&limit=10"
```

### 3. NeoDB API

```bash
# 搜索书籍
curl "https://neodb.social/api/catalog/search?q=哲学&category=book" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 按ISBN获取
curl "https://neodb.social/api/catalog/fetch?isbn=9787580801951" \
  -H "Accept: application/json"

# 响应示例
{
  "uuid": "book-uuid-here",
  "title": "经过检视的人生",
  "rating": 4.5,
  "rating_count": 128,
  "tags": ["哲学", "传记", "2026新书"],
  "cover_image_url": "https://..."
}
```

## 🚀 迁移计划

### 阶段1: 基础设施搭建 (1-2周)

1. **数据库迁移**
   - [ ] 创建新的PostgreSQL数据库
   - [ ] 执行schema migration脚本
   - [ ] 设置索引优化

2. **缓存层部署**
   - [ ] 部署Redis实例
   - [ ] 配置连接池

3. **API适配器开发**
   - [ ] 实现GoogleBooksAdapter
   - [ ] 实现OpenLibraryAdapter  
   - [ ] 实现NeoDBAdapter
   - [ ] 编写单元测试

### 阶段2: 数据同步系统 (1周)

1. **任务队列**
   - [ ] 配置Bull Queue
   - [ ] 实现任务处理器

2. **同步服务**
   - [ ] MetadataSyncService
   - [ ] CommunitySyncService
   - [ ] CoverDownloadService

3. **调度器**
   - [ ] 配置定时任务
   - [ ] 实现重试机制

### 阶段3: 数据迁移 (3-5天)

```typescript
// 迁移脚本
async function migrateFromOldData() {
  // 1. 读取旧数据
  const oldBooks = await fs.readJson('data/books.json');
  
  // 2. 转换格式
  for (const oldBook of oldBooks.books) {
    const newBook = {
      internalId: oldBook.id,
      title: oldBook.title,
      authors: [oldBook.author],
      publisher: oldBook.publisher,
      publicationDate: `${oldBook.year}-01-01`,
      pageCount: oldBook.pages,
      description: oldBook.description,
      coverImageUrl: oldBook.cover,
      categories: [oldBook.category],
      tags: oldBook.tags,
      metadataStatus: 'active',
      createdAt: oldBook.dateAdded || new Date(),
      updatedAt: new Date()
    };
    
    // 3. 插入新数据库
    await bookRepository.create(newBook);
    
    // 4. 触发重新同步 (使用API获取更准确的数据)
    await syncQueue.add('metadata-sync', {
      isbn: oldBook.isbn || null,
      priority: false
    });
  }
}
```

### 阶段4: 前端适配 (2-3天)

1. **API Gateway**
   - [ ] 创建RESTful API
   - [ ] 实现缓存中间件
   - [ ] 添加错误处理

2. **前端更新**
   - [ ] 更新数据获取逻辑
   - [ ] 添加加载状态
   - [ ] 错误边界处理

### 阶段5: 上线与监控 (1周)

1. **灰度发布**
   - [ ] 并行运行新旧系统
   - [ ] 对比数据准确性
   - [ ] 性能测试

2. **监控告警**
   - [ ] API限流监控
   - [ ] 同步任务状态
   - [ ] 数据库性能

3. **完全切换**
   - [ ] 停止旧系统写入
   - [ ] 重定向到新API
   - [ ] 保留旧数据备份

## 💰 成本估算

| 服务 | 免费额度 | 预估月费用 |
|------|---------|-----------|
| Google Books API | 100请求/天 | $0 (限制严格) |
| OpenLibrary API | 无限制 | $0 |
| NeoDB API | 60请求/分钟 | $0 |
| PostgreSQL (AWS RDS) | - | ~$15-30 |
| Redis (ElastiCache) | - | ~$10-20 |
| 图片存储 (S3/Cloudflare R2) | - | ~$5-10 |

**总计**: ~$30-60/月

## 📊 性能预期

- **API响应时间**: 
  - 缓存命中: < 50ms
  - 缓存未命中: < 500ms
  
- **数据库查询**:
  - 单本书: < 10ms
  - 搜索: < 100ms

- **同步任务**:
  - 单本书: 2-5秒 (含API调用)
  - 批量100本: ~3-5分钟

- **并发支持**:
  - 读: 1000+ QPS
  - 写: 100+ QPS

## 🔮 未来扩展

1. **全文搜索**: 集成 Elasticsearch 或 MeiliSearch
2. **推荐系统**: 基于用户行为的协同过滤
3. **实时更新**: WebSocket推送新书/评分更新
4. **多语言**: 集成翻译API自动翻译描述
5. **价格监控**: 爬取电商价格数据

---

## 📁 文件清单

- `src/config/` - 配置文件
- `src/adapters/` - API适配器
- `src/services/` - 业务服务
- `src/jobs/` - 同步任务
- `src/queue/` - 任务队列
- `migrations/` - 数据库迁移脚本
- `docs/` - 文档

所有代码都已准备好实现。需要我详细展开某个部分吗？
