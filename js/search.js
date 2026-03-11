// Wavecrest Bookstore - Search Page (New Vertical Layout)

class SearchPage {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.categories = {};
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.filteredBooks = [...this.books];
            this.renderBooks();
            this.setupEventListeners();
            this.updateResultsCount();
            
            // Check for URL parameter
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            if (query) {
                document.getElementById('searchInput').value = query;
                this.searchQuery = query;
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
        this.searchQuery = query.toLowerCase().trim();
        this.filterBooks();
    }

    filterBooks() {
        let results = this.books;

        // Filter by category
        if (this.currentFilter !== 'all') {
            results = results.filter(book => book.category === this.currentFilter);
        }

        // Filter by search query
        if (this.searchQuery) {
            results = results.filter(book => {
                return (
                    book.title.toLowerCase().includes(this.searchQuery) ||
                    book.author.toLowerCase().includes(this.searchQuery) ||
                    book.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)) ||
                    (this.categories[book.category] && this.categories[book.category].toLowerCase().includes(this.searchQuery))
                );
            });
        }

        this.filteredBooks = results;
        this.renderBooks();
        this.updateResultsCount();
        
        // Show/hide empty state
        const emptyState = document.getElementById('emptyState');
        const bookWall = document.getElementById('bookWall');
        
        if (results.length === 0) {
            emptyState.style.display = 'block';
            bookWall.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            bookWall.style.display = 'grid';
        }
    }

    renderBooks() {
        const container = document.getElementById('bookWall');
        if (!container) return;

        container.innerHTML = this.filteredBooks.map(book => `
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
        `).join('');

        // Add click handlers
        container.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => {
                const bookId = card.dataset.bookId;
                window.location.href = `book.html?id=${bookId}`;
            });
        });
    }

    updateResultsCount() {
        const countEl = document.getElementById('resultsCount');
        if (!countEl) return;

        const total = this.books.length;
        const filtered = this.filteredBooks.length;

        if (this.searchQuery || this.currentFilter !== 'all') {
            countEl.textContent = `找到 ${filtered} 本书`;
        } else {
            countEl.textContent = `共 ${total} 本书`;
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // Filter chips
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Update active state
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                
                // Apply filter
                this.currentFilter = chip.dataset.filter;
                this.filterBooks();
            });
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('navToggle');
        const navIcons = document.querySelector('.nav-icons');

        navToggle?.addEventListener('click', () => {
            navIcons?.classList.toggle('show');
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SearchPage();
});
