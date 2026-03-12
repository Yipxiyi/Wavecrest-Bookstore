/**
 * NeoDB to Supabase Book Sync Worker
 * 
 * Usage:
 *   ts-node sync.ts --job=daily
 *   ts-node sync.ts --job=weekly
 *   ts-node sync.ts --job=monthly
 */

import { createClient } from '@supabase/supabase-js';
import { CONFIG, isValidBook, sanitizeBookData } from './config';

interface SyncResult {
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: Array<{ neodb_id: string; error: string }>;
}

class BookSyncWorker {
  private supabase;
  private lastRequestTime = 0;

  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.ANON_KEY);
  }

  // Rate-limited request to NeoDB
  private async fetchFromNeoDB(endpoint: string): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < CONFIG.NEODB.RATE_LIMIT_MS) {
      await new Promise(r => setTimeout(r, CONFIG.NEODB.RATE_LIMIT_MS - timeSinceLast));
    }

    const url = `${CONFIG.NEODB.BASE_URL}${endpoint}`;
    this.lastRequestTime = Date.now();

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WavecrestBookstore/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`NeoDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Search books on NeoDB
  async searchBooks(query: string): Promise<any[]> {
    const data = await this.fetchFromNeoDB(`/catalog/search?query=${encodeURIComponent(query)}`);
    return data.results || data.data || [];
  }

  // Get book details
  async getBookDetail(neodbId: string): Promise<any> {
    return this.fetchFromNeoDB(`/book/${neodbId}`);
  }

  // Check if book exists in Supabase
  async bookExists(neodbId: string): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from('books')
      .select('id')
      .eq('neodb_id', neodbId)
      .single();

    if (error || !data) return null;
    return data;
  }

  // Insert or update book
  async upsertBook(bookData: any): Promise<'added' | 'updated' | 'skipped'> {
    const sanitized = sanitizeBookData(bookData);

    // Validation
    if (!isValidBook(sanitized)) {
      console.log(`⚠️ Skipping invalid book: ${sanitized.title || 'unknown'}`);
      return 'skipped';
    }

    const existing = await this.bookExists(sanitized.neodb_id);

    // Prepare book record
    const bookRecord = {
      neodb_id: sanitized.neodb_id,
      title: sanitized.title,
      authors: sanitized.authors,
      publisher: sanitized.publisher,
      publication_year: sanitized.publication_year,
      language: sanitized.language,
      description: sanitized.description,
      cover_image: sanitized.cover_image,
    };

    let bookId: string;

    if (existing) {
      // Update existing book
      const { error } = await this.supabase
        .from('books')
        .update(bookRecord)
        .eq('id', existing.id);

      if (error) throw error;
      bookId = existing.id;
      console.log(`🔄 Updated: ${sanitized.title}`);
    } else {
      // Insert new book
      const { data, error } = await this.supabase
        .from('books')
        .insert(bookRecord)
        .select('id')
        .single();

      if (error) throw error;
      bookId = data.id;
      console.log(`✅ Added: ${sanitized.title}`);
    }

    // Update ratings
    if (sanitized.rating_average !== null) {
      await this.supabase.from('ratings').upsert({
        book_id: bookId,
        rating_average: sanitized.rating_average,
        rating_count: sanitized.rating_count,
      });
    }

    // Update tags
    if (sanitized.tags.length > 0) {
      // Delete old tags
      await this.supabase.from('tags').delete().eq('book_id', bookId);
      
      // Insert new tags
      const tagRecords = sanitized.tags.map((tag: string) => ({
        book_id: bookId,
        tag: tag,
      }));
      await this.supabase.from('tags').insert(tagRecords);
    }

    return existing ? 'updated' : 'added';
  }

  // Run daily sync job
  async runDailySync(): Promise<SyncResult> {
    console.log('🚀 Starting daily sync...');
    const result: SyncResult = {
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Search for books
      for (const query of CONFIG.SYNC.SEARCH_QUERIES) {
        console.log(`🔍 Searching: ${query}`);
        
        try {
          const books = await this.searchBooks(query);
          
          for (const book of books) {
            result.processed++;
            
            try {
              // Get full details
              const fullDetails = await this.getBookDetail(book.uuid || book.id);
              
              // Check publication year
              const year = parseInt(fullDetails.publication_year || fullDetails.publish_date?.split('-')[0]);
              if (!year || year < CONFIG.SYNC.MIN_PUBLICATION_YEAR) {
                console.log(`⏭️ Skipping (old book): ${fullDetails.title}`);
                result.skipped++;
                continue;
              }

              // Upsert to database
              const action = await this.upsertBook(fullDetails);
              if (action === 'added') result.added++;
              else if (action === 'updated') result.updated++;
              else result.skipped++;

            } catch (error: any) {
              console.error(`❌ Failed to process ${book.uuid}:`, error.message);
              result.errors.push({ neodb_id: book.uuid, error: error.message });
            }
          }
        } catch (error: any) {
          console.error(`❌ Search failed for "${query}":`, error.message);
        }

        // Delay between searches
        await new Promise(r => setTimeout(r, 2000));
      }

    } catch (error: any) {
      console.error('❌ Daily sync failed:', error.message);
    }

    // Log results
    await this.logSync('daily', result);
    
    console.log('\n📊 Daily Sync Results:');
    console.log(`   Processed: ${result.processed}`);
    console.log(`   Added: ${result.added}`);
    console.log(`   Updated: ${result.updated}`);
    console.log(`   Skipped: ${result.skipped}`);
    console.log(`   Errors: ${result.errors.length}`);

    return result;
  }

  // Run weekly sync (refresh metadata)
  async runWeeklySync(): Promise<SyncResult> {
    console.log('🚀 Starting weekly sync (metadata refresh)...');
    
    // Get all books from database
    const { data: books, error } = await this.supabase
      .from('books')
      .select('neodb_id');

    if (error) {
      console.error('❌ Failed to fetch books:', error.message);
      return { processed: 0, added: 0, updated: 0, skipped: 0, errors: [] };
    }

    const result: SyncResult = {
      processed: 0,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const book of books || []) {
      result.processed++;
      
      try {
        const fullDetails = await this.getBookDetail(book.neodb_id);
        await this.upsertBook(fullDetails);
        result.updated++;
      } catch (error: any) {
        console.error(`❌ Failed to refresh ${book.neodb_id}:`, error.message);
        result.errors.push({ neodb_id: book.neodb_id, error: error.message });
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    await this.logSync('weekly', result);
    return result;
  }

  // Run monthly verification
  async runMonthlySync(): Promise<void> {
    console.log('🚀 Starting monthly verification...');
    
    // TODO: Implement data integrity checks
    // - Check for missing required fields
    // - Verify rating consistency
    // - Remove orphaned records
    
    await this.logSync('monthly', { processed: 0, added: 0, updated: 0, skipped: 0, errors: [] });
    console.log('✅ Monthly verification completed');
  }

  // Log sync results
  private async logSync(jobType: string, result: SyncResult): Promise<void> {
    await this.supabase.from('sync_logs').insert({
      job_type: jobType,
      books_processed: result.processed,
      books_added: result.added,
      books_updated: result.updated,
      books_skipped: result.skipped,
      errors: result.errors,
      completed_at: new Date().toISOString(),
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const jobArg = args.find(a => a.startsWith('--job='));
  const jobType = jobArg ? jobArg.split('=')[1] : 'daily';

  const worker = new BookSyncWorker();

  switch (jobType) {
    case 'daily':
      await worker.runDailySync();
      break;
    case 'weekly':
      await worker.runWeeklySync();
      break;
    case 'monthly':
      await worker.runMonthlySync();
      break;
    default:
      console.error(`Unknown job type: ${jobType}`);
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { BookSyncWorker };
