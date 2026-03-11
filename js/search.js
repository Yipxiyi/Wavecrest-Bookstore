// Wavecrest Bookstore - Search Page (Vertical Layout)

class SearchPage {
    constructor() {
        this.books = [];
        this.categories = {};
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            
            // Check for search query in URL
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            
            if (query) {
                const searchInput = document.getElementById('mainSearchInput');
                if (searchInput) searchInput.value = query;
                this.performSearch(query);
            }
        } catch (error) {
            console.error('Failed to initialize search:', error);
        }
    }

    async loadData() {
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books;
        this.categories = data.categories;
    }

    performSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        const resultCount = document.getElementById('searchResultCount');
        const bookwallGrid = document.getElementById('bookwallGrid');
        const filterBar = document.getElementById('filterBar');

        let results = this.books.filter(book => {
            // Filter by category if selected
            if (this.currentFilter !== 'all' && book.category !== this.currentFilter) {
                return false;
            }
            
            // Search in title, author, tags
            return (
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                (this.categories[book.category] && this.categories[book.category].toLowerCase().includes(searchTerm))
            );
        });

        resultCount.textContent = `找到 ${results.length} 本书`;
        filterBar.style.display = 'flex';

        if (results.length === 0) {
            bookwallGrid.innerHTML = `
                <div class="bookwall-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <p>没有找到匹配的书籍</p>
                    <span>试试其他关键词？</span>
                </div>
            `;
        } else {
            bookwallGrid.innerHTML = results.map(book => this.renderBookCard(book)).join('');
            bookwallGrid.querySelectorAll('.book-card').forEach((card, index) => {
                card.addEventListener('click', () => {
                    window.location.href = `book.html?id=${results[index].id}`;
                });
            });
        }
    }

    renderBookCard(book) {
        return `
            <article class="book-card" data-book-id="${book.id}">
                <div class="book-cover" style="background-color: ${book.cover}">
                    <div class="book-cover-placeholder">
                        <div class="book-cover-title">${book.title}</div>
                        <div class="book-cover-author">${book.author}</div>
                    </div>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="book-meta">
                        <span class="book-rating">
                            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            ${book.rating}
                        </span>
                        <span>¥${book.price.toFixed(2)}</span>
                    </div>
                </div>
            </article>
        `;
    }

    setupEventListeners() {
        const searchInput = document.getElementById('mainSearchInput');

        // Search input
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    this.updateURL(value);
                    this.performSearch(value);
                }
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                
                const query = searchInput?.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            });
        });

        // Mobile nav
        const navToggle = document.getElementById('navToggle');
        const navIcons = document.querySelector('.nav-icons');

        navToggle?.addEventListener('click', () => {
            const isVisible = navIcons.style.display === 'flex';
            navIcons.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                navIcons.style.position = 'absolute';
                navIcons.style.top = '52px';
                navIcons.style.left = '0';
                navIcons.style.right = '0';
                navIcons.style.background = 'var(--bg)';
                navIcons.style.flexDirection = 'row';
                navIcons.style.justifyContent = 'center';
                navIcons.style.padding = '16px';
                navIcons.style.borderBottom = '1px solid var(--hairline)';
                navIcons.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }
        });
    }

    updateURL(query) {
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SearchPage();
});
