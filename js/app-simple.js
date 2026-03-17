// Wavecrest Bookstore - Home Page
// Version: Simple and reliable

class BookstoreApp {
    constructor() {
        this.books = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing...');
        try {
            await this.loadData();
            this.renderAllSections();
            console.log('✅ Done');
        } catch (e) {
            console.error('❌ Error:', e);
            this.showError(e.message);
        }
    }

    async loadData() {
        console.log('📚 Loading data...');
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books || [];
        console.log(`✅ Loaded ${this.books.length} books`);
    }

    showError(msg) {
        document.querySelectorAll('.books-scroll-container').forEach(el => {
            el.innerHTML = `<p style="color:red;padding:20px;">Error: ${msg}</p>`;
        });
    }

    renderAllSections() {
        console.log('🎨 Rendering...');
        
        // 简化的渲染 - 所有区块显示所有书籍
        const containers = [
            'recentContainer',
            'featuredContainer', 
            'popularContainer',
            'classicContainer'
        ];
        
        containers.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`Container #${id} not found`);
                return;
            }
            
            if (this.books.length === 0) {
                el.innerHTML = '<p>暂无书籍</p>';
                return;
            }
            
            // 每个区块显示不同的书籍子集
            const start = idx * 10;
            const end = start + 10;
            const sectionBooks = this.books.slice(start, end);
            
            if (sectionBooks.length === 0) {
                el.innerHTML = '<p>暂无书籍</p>';
                return;
            }
            
            el.innerHTML = sectionBooks.map(book => this.renderBookCard(book)).join('');
            
            // Add click handlers
            el.querySelectorAll('.book-card').forEach((card, i) => {
                card.addEventListener('click', () => {
                    const bookId = sectionBooks[i].neodb_uuid || sectionBooks[i].id;
                    window.location.href = `book.html?id=${bookId}`;
                });
            });
        });
    }

    renderBookCard(book) {
        const hasImage = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
        const coverStyle = hasImage 
            ? `background-image:url('${book.cover}');background-size:cover;background-position:center;`
            : 'background-color:#9B8B7A;';
        
        return `
            <article class="book-card">
                <div class="book-cover" style="${coverStyle}">
                    ${!hasImage ? `<div class="book-cover-placeholder">
                        <div class="book-cover-title">${book.title?.substring(0,6) || ''}...</div>
                        <div class="book-cover-author">${book.author?.substring(0,8) || ''}</div>
                    </div>` : ''}
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title || 'Unknown'}</h3>
                    <p class="book-author">${book.author || 'Unknown'}</p>
                    <div class="book-meta">
                        <span class="book-rating">⭐ ${book.rating || '4.0'}</span>
                    </div>
                </div>
            </article>
        `;
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => new BookstoreApp());
