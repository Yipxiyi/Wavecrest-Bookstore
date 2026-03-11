// Wavecrest Bookstore - Search Page

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
                // Sync both search inputs
                const navSearch = document.getElementById('searchInput');
                const mainSearch = document.getElementById('mainSearchInput');
                if (navSearch) navSearch.value = query;
                if (mainSearch) mainSearch.value = query;
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
        const searchDesc = document.getElementById('searchDesc');
        const resultsGrid = document.getElementById('searchResultsGrid');
        const filters = document.getElementById('searchFilters');

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

        searchDesc.textContent = `"${query}" 找到 ${results.length} 本书`;
        filters.style.display = 'flex';

        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <p>没有找到匹配的书籍</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">试试其他关键词？</p>
                </div>
            `;
        } else {
            resultsGrid.innerHTML = results.map(book => this.renderBookCard(book)).join('');
            resultsGrid.querySelectorAll('.book-card').forEach((card, index) => {
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
        const navSearchInput = document.getElementById('searchInput');
        const mainSearchInput = document.getElementById('mainSearchInput');
        const navSearchBtn = document.querySelector('.nav-search .search-btn');

        // Main search input (large search box)
        mainSearchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    // Sync to nav search
                    if (navSearchInput) navSearchInput.value = value;
                    this.updateURL(value);
                    this.performSearch(value);
                }
            }
        });

        // Nav search input
        navSearchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    // Sync to main search
                    if (mainSearchInput) mainSearchInput.value = value;
                    this.updateURL(value);
                    this.performSearch(value);
                }
            }
        });

        navSearchBtn?.addEventListener('click', () => {
            const value = navSearchInput?.value.trim();
            if (value) {
                if (mainSearchInput) mainSearchInput.value = value;
                this.updateURL(value);
                this.performSearch(value);
            }
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                
                const query = mainSearchInput?.value.trim() || navSearchInput?.value.trim();
                if (query) {
                    this.performSearch(query);
                }
            });
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
