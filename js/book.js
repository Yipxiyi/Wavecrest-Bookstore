// Wavecrest Bookstore - Book Detail Page

class BookDetailPage {
    constructor() {
        this.books = [];
        this.categories = {
            'fiction': '小说',
            'literature': '文学',
            'art': '艺术',
            'history': '历史',
            'philosophy': '哲学',
            'science': '科学',
            'business': '商业',
            'design': '设计',
            'essay': '散文',
            'nonfiction': '非虚构',
            'technology': '科技',
            'biography': '传记'
        };
        this.currentBook = null;
        this.init();
    }

    // 图片代理 - 绕过防盗链
    getProxiedImageUrl(url) {
        if (!url) return '';
        // 使用 images.weserv.nl 代理服务
        if (url.includes('doubanio.com')) {
            return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
        }
        return url;
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
            this.showNotFound();
        }
    }

    async loadData() {
        try {
            const response = await fetch('data/books.json');
            const data = await response.json();
            this.books = data.books || [];
            // 如果 JSON 中有 categories 就使用，否则使用默认值
            if (data.categories) {
                this.categories = data.categories;
            }
        } catch (error) {
            console.error('Failed to load books data:', error);
            this.books = [];
        }
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

        // 判断封面是颜色还是图片URL
        const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
        
        // Cover section
        const coverEl = document.getElementById('bookCover');
        
        if (isImageUrl) {
            // 使用代理绕过防盗链
            const proxiedUrl = this.getProxiedImageUrl(book.cover);
            
            coverEl.style.backgroundImage = `url('${proxiedUrl}')`;
            coverEl.style.backgroundSize = 'cover';
            coverEl.style.backgroundPosition = 'center';
            coverEl.style.backgroundColor = 'var(--bg-secondary)';
            
            // 图片加载失败时回退
            coverEl.onerror = () => {
                coverEl.style.backgroundImage = '';
                coverEl.style.backgroundColor = '#9B8B7A';
            };
            
            // 隐藏 placeholder
            const placeholder = coverEl.querySelector('.book-cover-placeholder-large');
            if (placeholder) placeholder.style.display = 'none';
        } else {
            coverEl.style.backgroundColor = book.cover;
            coverEl.style.backgroundImage = '';
            // 显示 placeholder
            const placeholder = coverEl.querySelector('.book-cover-placeholder-large');
            if (placeholder) placeholder.style.display = 'flex';
        }
        
        document.getElementById('coverTitle').textContent = book.title;
        document.getElementById('coverAuthor').textContent = book.author;

        // Breadcrumb
        const categoryName = this.categories[book.category] || '其他';
        document.getElementById('categoryName').textContent = categoryName;
        document.getElementById('breadcrumbTitle').textContent = book.title;

        // Main info
        document.getElementById('bookTitle').textContent = book.title;
        document.getElementById('bookAuthor').textContent = book.author;
        document.getElementById('ratingValue').textContent = book.rating;
        document.getElementById('reviewCount').textContent = `(${book.reviews || 0}人评价)`;
        document.getElementById('bookPrice').textContent = `¥${(book.price || 0).toFixed(2)}`;

        // Meta info
        document.getElementById('metaPublisher').textContent = book.publisher || '-';
        document.getElementById('metaYear').textContent = book.year ? `${book.year}年` : '-';
        document.getElementById('metaPages').textContent = book.pages ? `${book.pages}页` : '-';
        document.getElementById('metaCategory').textContent = categoryName;

        // Content sections
        const highlightEl = document.getElementById('bookHighlight');
        if (book.highlight) {
            highlightEl.textContent = `"${book.highlight}"`;
            highlightEl.style.display = 'block';
        } else {
            highlightEl.style.display = 'none';
        }
        
        document.getElementById('bookDescription').textContent = book.description || '暂无简介';

        // Tags
        const tagsContainer = document.getElementById('bookTags');
        if (book.tags && book.tags.length > 0) {
            tagsContainer.innerHTML = book.tags.map(tag => 
                `<span class="book-detail-tag">${tag}</span>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<span style="color: var(--tertiary); font-size: 14px;">暂无标签</span>';
        }

        // Related books (same category, excluding current)
        const relatedBooks = this.books
            .filter(b => b.category === book.category && b.id !== book.id)
            .slice(0, 4);
        
        this.renderRelatedBooks(relatedBooks);

        // Setup buy button
        const buyBtn = document.getElementById('buyBtn');
        buyBtn.onclick = () => {
            alert(`已将《${book.title}》加入购物车`);
        };

        // Setup share button
        const shareBtn = document.getElementById('shareBtn');
        shareBtn.onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: book.title,
                    text: `${book.title} - ${book.author}`,
                    url: window.location.href
                });
            } else {
                // Copy to clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    alert('链接已复制到剪贴板');
                });
            }
        };
    }

    renderRelatedBooks(relatedBooks) {
        const container = document.getElementById('relatedBooks');
        
        if (relatedBooks.length === 0) {
            container.innerHTML = '<p style="color: var(--tertiary); font-size: 14px;">暂无相关推荐</p>';
            return;
        }

        container.innerHTML = relatedBooks.map(book => {
            const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
            const coverStyle = isImageUrl 
                ? `background-image: url('${this.getProxiedImageUrl(book.cover)}'); background-size: cover; background-position: center;`
                : `background-color: ${book.cover}`;
            
            return `
                <div class="sidebar-book" data-book-id="${book.id}">
                    <div class="sidebar-book-cover" 
                         style="${coverStyle}"
                         onerror="this.style.backgroundColor='#9B8B7A'">
                    </div>
                    <div class="sidebar-book-info">
                        <div class="sidebar-book-title">${book.title}</div>
                        <div class="sidebar-book-author">${book.author}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.sidebar-book').forEach((el) => {
            el.addEventListener('click', () => {
                const bookId = el.dataset.bookId;
                window.location.href = `book.html?id=${bookId}`;
            });
        });
    }

    showNotFound() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('bookContent').style.display = 'none';
        document.getElementById('notFoundState').style.display = 'block';
    }

    setupEventListeners() {
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
                navIcons.style.boxShadow = 'var(--shadow-md)';
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BookDetailPage();
});
