// Wavecrest Bookstore - Book Detail Page

class BookDetailPage {
    constructor() {
        this.books = [];
        this.categories = {};
        this.currentBook = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            
            // Get book ID from URL
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('id');
            
            if (bookId) {
                this.loadBook(bookId);
            } else {
                this.showNotFound();
            }
            
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize book detail:', error);
        }
    }

    async loadData() {
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books;
        this.categories = data.categories;
    }

    loadBook(bookId) {
        this.currentBook = this.books.find(b => b.id === bookId);
        
        if (!this.currentBook) {
            this.showNotFound();
            return;
        }

        this.renderBook();
    }

    renderBook() {
        const book = this.currentBook;
        
        // Hide loading, show content
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('bookContent').style.display = 'block';
        document.getElementById('notFoundState').style.display = 'none';

        // Cover section
        const coverEl = document.getElementById('bookCover');
        coverEl.style.backgroundColor = book.cover;
        document.getElementById('coverTitle').textContent = book.title;
        document.getElementById('coverAuthor').textContent = book.author;

        // Breadcrumb
        document.getElementById('categoryName').textContent = this.categories[book.category] || '其他';
        document.getElementById('breadcrumbTitle').textContent = book.title;

        // Main info
        document.getElementById('bookTitle').textContent = book.title;
        document.getElementById('bookAuthor').textContent = book.author;
        document.getElementById('ratingValue').textContent = book.rating;
        document.getElementById('reviewCount').textContent = `(${book.reviews}人评价)`;
        document.getElementById('bookPrice').textContent = `¥${book.price.toFixed(2)}`;

        // Meta info
        document.getElementById('metaPublisher').textContent = book.publisher;
        document.getElementById('metaYear').textContent = `${book.year}年`;
        document.getElementById('metaPages').textContent = `${book.pages}页`;
        document.getElementById('metaCategory').textContent = this.categories[book.category] || '其他';

        // Content sections
        document.getElementById('bookHighlight').textContent = `"${book.highlight}"`;
        document.getElementById('bookDescription').textContent = book.description;

        // Tags
        const tagsContainer = document.getElementById('bookTags');
        tagsContainer.innerHTML = book.tags.map(tag => 
            `<span class="book-detail-tag">${tag}</span>`
        ).join('');

        // Related books (same category, excluding current)
        const relatedBooks = this.books
            .filter(b => b.category === book.category && b.id !== book.id)
            .slice(0, 4);
        
        this.renderRelatedBooks(relatedBooks);

        // Setup buy button
        document.getElementById('buyBtn').addEventListener('click', () => {
            alert(`已将《${book.title}》加入购物车`);
        });

        // Setup share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: book.title,
                    text: `${book.title} - ${book.author}`,
                    url: window.location.href
                });
            } else {
                // Copy to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert('链接已复制到剪贴板');
            }
        });
    }

    renderRelatedBooks(relatedBooks) {
        const container = document.getElementById('relatedBooks');
        
        if (relatedBooks.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-muted); font-size: 0.875rem;">暂无相关推荐</p>';
            return;
        }

        container.innerHTML = relatedBooks.map(book => `
            <div class="sidebar-book" data-book-id="${book.id}">
                <div class="sidebar-book-cover" style="background-color: ${book.cover}"></div>
                <div class="sidebar-book-info">
                    <div class="sidebar-book-title">${book.title}</div>
                    <div class="sidebar-book-author">${book.author}</div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.sidebar-book').forEach((el, index) => {
            el.addEventListener('click', () => {
                window.location.href = `book.html?id=${relatedBooks[index].id}`;
            });
        });
    }

    showNotFound() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('bookContent').style.display = 'none';
        document.getElementById('notFoundState').style.display = 'block';
    }

    setupEventListeners() {
        // Search
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

        // Mobile nav
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        navToggle?.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'var(--color-bg)';
                navLinks.style.flexDirection = 'column';
                navLinks.style.padding = 'var(--space-md)';
                navLinks.style.borderBottom = '1px solid var(--color-border)';
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BookDetailPage();
});
