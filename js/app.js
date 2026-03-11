// Wavecrest Bookstore - Home Page App

class BookstoreApp {
    constructor() {
        this.books = [];
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderAllSections();
            this.setupEventListeners();
            this.setupScrollButtons();
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    async loadData() {
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books;
        this.categories = data.categories;
    }

    renderAllSections() {
        this.renderSection('recent', 'recentContainer');
        this.renderSection('featured', 'featuredContainer');
        this.renderSection('popular', 'popularContainer');
        this.renderSection('classic', 'classicContainer');
    }

    renderSection(sectionKey, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const sectionBooks = this.books.filter(book => 
            book.sections && book.sections.includes(sectionKey)
        );

        if (sectionBooks.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无书籍</p>';
            return;
        }

        container.innerHTML = sectionBooks.map(book => this.renderBookCard(book)).join('');

        // Add click handlers
        container.querySelectorAll('.book-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                window.location.href = `book.html?id=${sectionBooks[index].id}`;
            });
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
                    </div>
                </div>
            </article>
        `;
    }

    setupScrollButtons() {
        const sections = ['recent', 'featured', 'popular', 'classic'];
        
        sections.forEach(section => {
            const container = document.getElementById(`${section}Container`);
            const prevBtn = document.querySelector(`#${section}Scroll .scroll-prev`);
            const nextBtn = document.querySelector(`#${section}Scroll .scroll-next`);
            
            if (!container || !prevBtn || !nextBtn) return;

            const scrollAmount = 300;

            prevBtn.addEventListener('click', () => {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });

            nextBtn.addEventListener('click', () => {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });

            // Update button states
            const updateButtons = () => {
                prevBtn.disabled = container.scrollLeft <= 0;
                nextBtn.disabled = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
            };

            container.addEventListener('scroll', updateButtons);
            updateButtons();
        });
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                window.location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
            }
        });

        searchBtn?.addEventListener('click', () => {
            const value = searchInput?.value.trim();
            if (value) {
                window.location.href = `search.html?q=${encodeURIComponent(value)}`;
            }
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        navToggle?.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.right = '0';
            navLinks.style.background = 'var(--color-bg)';
            navLinks.style.flexDirection = 'column';
            navLinks.style.padding = 'var(--space-md)';
            navLinks.style.borderBottom = '1px solid var(--color-border)';
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});
