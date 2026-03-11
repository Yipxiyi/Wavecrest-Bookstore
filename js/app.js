// Wavecrest Bookstore App

class Bookstore {
    constructor() {
        this.books = [];
        this.sections = {};
        this.categories = {};
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderAllSections();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize bookstore:', error);
        }
    }

    async loadData() {
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books;
        this.sections = data.sections;
        this.categories = data.categories;
    }

    renderAllSections() {
        this.renderSection('recent', 'recentGrid');
        this.renderSection('featured', 'featuredGrid');
        this.renderSection('popular', 'popularGrid');
        this.renderSection('classic', 'classicGrid');
    }

    renderSection(sectionKey, gridId) {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        const sectionBooks = this.books.filter(book => 
            book.sections && book.sections.includes(sectionKey)
        );

        if (sectionBooks.length === 0) {
            grid.innerHTML = this.renderEmptyState();
            return;
        }

        grid.innerHTML = sectionBooks.map(book => this.renderBookCard(book)).join('');

        // Add click handlers
        grid.querySelectorAll('.book-card').forEach((card, index) => {
            card.addEventListener('click', () => this.openBookDetail(sectionBooks[index]));
        });
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
                        <span class="book-price">¥${book.price.toFixed(2)}</span>
                    </div>
                    ${book.tags.slice(0, 1).map(tag => `<span class="book-tag">${tag}</span>`).join('')}
                </div>
            </article>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <p>暂无书籍</p>
            </div>
        `;
    }

    openBookDetail(book) {
        const modal = document.getElementById('bookModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <div class="book-detail">
                <div class="book-detail-cover" style="background-color: ${book.cover}">
                    <div class="book-detail-cover-content">
                        <div class="book-detail-cover-title">${book.title}</div>
                        <div class="book-detail-cover-author">${book.author}</div>
                    </div>
                </div>
                <div class="book-detail-info">
                    <div class="book-detail-header">
                        <h2 class="book-detail-title">${book.title}</h2>
                        <p class="book-detail-author">${book.author}</p>
                        <div class="book-detail-meta">
                            <span>${book.publisher}</span>
                            <span>${book.year}年</span>
                            <span>${book.pages}页</span>
                            <span class="book-detail-rating">
                                <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                ${book.rating} (${book.reviews}人评价)
                            </span>
                        </div>
                    </div>
                    <div class="book-detail-highlight">"${book.highlight}"</div>
                    <div class="book-detail-description">${book.description}</div>
                    <div class="book-detail-tags">
                        ${book.tags.map(tag => `<span class="book-detail-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="book-detail-footer">
                        <span class="book-detail-price">¥${book.price.toFixed(2)}</span>
                        <button class="btn btn-primary">预约借阅</button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('bookModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    searchBooks(query) {
        if (!query || query.trim() === '') {
            this.showLibrary();
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const results = this.books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            this.categories[book.category]?.toLowerCase().includes(searchTerm)
        );

        this.showSearchResults(results, query);
    }

    showSearchResults(results, query) {
        const library = document.getElementById('library');
        const searchResults = document.getElementById('searchResults');
        const searchDesc = document.getElementById('searchDesc');
        const resultsGrid = document.getElementById('searchResultsGrid');

        library.style.display = 'none';
        searchResults.style.display = 'block';
        
        searchDesc.textContent = `"${query}" 找到 ${results.length} 本书`;

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
                card.addEventListener('click', () => this.openBookDetail(results[index]));
            });
        }

        // Scroll to results
        searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showLibrary() {
        const library = document.getElementById('library');
        const searchResults = document.getElementById('searchResults');
        
        library.style.display = 'block';
        searchResults.style.display = 'none';
        
        document.getElementById('searchInput').value = '';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        const clearSearch = document.getElementById('clearSearch');

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchBooks(e.target.value);
            }
        });

        searchBtn.addEventListener('click', () => {
            this.searchBooks(searchInput.value);
        });

        clearSearch?.addEventListener('click', () => {
            this.showLibrary();
        });

        // Modal close
        const modal = document.getElementById('bookModal');
        const modalClose = document.querySelector('.modal-close');
        const modalBackdrop = document.querySelector('.modal-backdrop');

        modalClose?.addEventListener('click', () => this.closeModal());
        modalBackdrop?.addEventListener('click', () => this.closeModal());

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        navToggle?.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Bookstore();
});
