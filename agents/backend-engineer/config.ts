// Configuration for NeoDB to Supabase Sync

export const CONFIG = {
  // NeoDB API Configuration
  NEODB: {
    BASE_URL: 'https://neodb.social/api',
    RATE_LIMIT_MS: 1000, // 1 second between requests
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 2000,
  },

  // Supabase Configuration
  SUPABASE: {
    URL: 'https://tjqaqieefrolvtqzpaeo.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo',
    // Note: For writes, use Service Role Key instead of Anon Key
  },

  // Sync Configuration
  SYNC: {
    MIN_PUBLICATION_YEAR: 2026,
    BATCH_SIZE: 50,
    SEARCH_QUERIES: [
      'book',
      '2026',
      '新书',
      'novel',
      'fiction',
    ],
  },

  // Schedule Configuration (cron expressions)
  SCHEDULE: {
    DAILY: '0 2 * * *',    // 2 AM daily
    WEEKLY: '0 3 * * 0',   // 3 AM Sunday
    MONTHLY: '0 4 1 * *',  // 4 AM first day of month
  },

  // Logging Configuration
  LOG: {
    LEVEL: 'info', // 'debug' | 'info' | 'warn' | 'error'
    FORMAT: 'json',
  },
};

// Validation helpers
export function isValidBook(book: any): boolean {
  return (
    book &&
    typeof book.title === 'string' &&
    book.title.length > 0 &&
    Array.isArray(book.authors) &&
    book.authors.length > 0 &&
    typeof book.publication_year === 'number' &&
    book.publication_year >= CONFIG.SYNC.MIN_PUBLICATION_YEAR
  );
}

export function sanitizeBookData(raw: any): any {
  return {
    neodb_id: raw.uuid || raw.id,
    title: raw.title?.trim(),
    authors: Array.isArray(raw.authors) 
      ? raw.authors.map((a: string) => a.trim()) 
      : [raw.author].filter(Boolean),
    publisher: raw.publisher?.trim() || null,
    publication_year: parseInt(raw.publication_year || raw.publish_date?.split('-')[0]),
    language: raw.language || 'zh',
    description: raw.description?.trim() || raw.brief?.trim() || null,
    cover_image: raw.cover_image_url || null,
    rating_average: raw.rating ? parseFloat(raw.rating) : null,
    rating_count: raw.rating_count ? parseInt(raw.rating_count) : 0,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}
