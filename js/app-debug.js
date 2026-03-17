// DEBUG VERSION - Wavecrest Bookstore
// This version shows detailed errors on the page

class BookstoreApp {
    constructor() {
        this.books = [];
        this.errors = [];
        this.SUPABASE_URL = 'https://tjqaqieefrolvtqzpaeo.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo';
        this.init();
    }

    log(msg, type = 'info') {
        console.log(`[${type.toUpperCase()}]`, msg);
        this.errors.push({msg, type, time: new Date().toISOString()});
    }

    showDebug() {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#000;color:#0f0;padding:10px;font-family:monospace;font-size:12px;max-height:200px;overflow:auto;z-index:9999;';
        debugDiv.innerHTML = '<h3 style="margin:0 0 10px 0;color:#fff;">DEBUG LOG</h3>' + 
            this.errors.map(e => `<div style="color:${e.type==='error'?'red':e.type==='warn'?'yellow':'#0f0'}">[${e.type}] ${e.msg}</div>`).join('');
        document.body.appendChild(debugDiv);
    }

    async init() {
        this.log('🚀 Initializing...');
        try {
            await this.loadData();
            this.renderAllSections();
            this.log('✅ Render complete');
        } catch (e) {
            this.log(`❌ Fatal error: ${e.message}`, 'error');
        }
        this.showDebug();
    }

    async loadData() {
        this.log('📚 Loading data...');
        
        // Try local first
        try {
            this.log('🔄 Fetching local data/books.json...');
            const response = await fetch('data/books.json');
            this.log(`📡 Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.log(`📦 Got data object: ${JSON.stringify(Object.keys(data))}`);
            
            if (!data.books) {
                throw new Error('No "books" property in data');
            }
            
            if (!Array.isArray(data.books)) {
                throw new Error(`books is not array: ${typeof data.books}`);
            }
            
            this.books = data.books;
            this.log(`✅ Loaded ${this.books.length} books from local JSON`);
            
            if (this.books.length > 0) {
                this.log(`📖 First book: ${JSON.stringify(this.books[0]).substring(0, 100)}`);
            }
        } catch (e) {
            this.log(`❌ Local data failed: ${e.message}`, 'error');
            this.books = [];
        }

        // Try Supabase
        if (this.books.length === 0) {
            try {
                this.log('🔄 Trying Supabase...');
                const url = `${this.SUPABASE_URL}/rest/v1/books?select=*&limit=5`;
                this.log(`📡 Fetching: ${url}`);
                
                const response = await fetch(url, {
                    headers: {
                        'apikey': this.SUPABASE_KEY,
                        'Authorization': `Bearer ${this.SUPABASE_KEY}`
                    }
                });
                
                this.log(`📡 Supabase status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    this.log(`📦 Supabase returned ${data.length} books`);
                    this.books = data;
                } else {
                    const text = await response.text();
                    this.log(`❌ Supabase error: ${text}`, 'error');
                }
            } catch (e) {
                this.log(`❌ Supabase failed: ${e.message}`, 'error');
            }
        }
    }

    renderAllSections() {
        this.log('🎨 Rendering sections...');
        const sections = [
            {key: 'recent', container: 'recentContainer'},
            {key: 'featured', container: 'featuredContainer'},
            {key: 'popular', container: 'popularContainer'},
            {key: 'classic', container: 'classicContainer'}
        ];

        sections.forEach(({key, container}) => {
            const el = document.getElementById(container);
            if (!el) {
                this.log(`❌ Container #${container} not found`, 'error');
                return;
            }
            
            this.log(`📝 Rendering ${key} into #${container}`);
            
            // Check if books have sections property
            const sectionBooks = this.books.filter(b => {
                if (!b.sections) {
                    this.log(`⚠️ Book "${b.title?.substring(0,20)}" has no sections`, 'warn');
                    return key === 'recent'; // Default to recent
                }
                return b.sections.includes(key);
            });
            
            this.log(`${key}: ${sectionBooks.length} books`);
            
            if (sectionBooks.length === 0) {
                el.innerHTML = '<p class="empty-state">暂无书籍 (debug: 0 books match)</p>';
                return;
            }
            
            el.innerHTML = sectionBooks.map(book => `
                <article class="book-card">
                    <div style="width:120px;height:160px;background:#9B8B7A;display:flex;align-items:center;justify-content:center;padding:10px;text-align:center;">
                        <span style="color:white;font-size:12px;">${book.title || 'No Title'}</span>
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title || 'Unknown'}</h3>
                        <p class="book-author">${book.author || 'Unknown'}</p>
                    </div>
                </article>
            `).join('');
        });
    }
}

// Start with delay to ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BookstoreApp());
} else {
    new BookstoreApp();
}
