// Wavecrest Bookstore - Book Detail Page
// Supabase Integration: Fetches book details from Supabase PostgreSQL

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
        
        // Supabase 配置
        this.SUPABASE_URL = 'https://tjqaqieefrolvtqzpaeo.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo';
        
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
            
            // Get book ID from URL (支持 neodb_uuid 或 id)
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('id');
            
            if (bookId) {
                await this.loadBook(bookId);
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
            // 优先从 Supabase 加载
            console.log('Loading books from Supabase...');
            const books = await this.fetchFromSupabase();
            if (books && books.length > 0) {
                this.books = this.formatBooks(books);
                console.log(`Loaded ${this.books.length} books from Supabase`);
            } else {
                // 回退到本地 JSON
                console.log('Falling back to local data...');
                const response = await fetch('data/books.json');
                const data = await response.json();
                this.books = data.books || [];
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            // 回退到本地 JSON
            try {
                const response = await fetch('data/books.json');
                const data = await response.json();
                this.books = data.books || [];
            } catch (e) {
                this.books = [];
            }
        }
    }

    async fetchFromSupabase() {
        const url = `${this.SUPABASE_URL}/rest/v1/books?select=*&order=created_at.desc`;
        const response = await fetch(url, {
            headers: {
                'apikey': this.SUPABASE_KEY,
                'Authorization': `Bearer ${this.SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status}`);
        }
        
        return await response.json();
    }

    formatBooks(supabaseBooks) {
        return supabaseBooks.map((book, index) => {
            // 解析 JSON 字段
            let authors = [];
            let categories = [];
            let tags = [];
            
            try {
                authors = JSON.parse(book.authors || '[]');
            } catch (e) { authors = [book.authors].filter(Boolean); }
            
            try {
                categories = JSON.parse(book.categories || '[]');
            } catch (e) { categories = [book.categories].filter(Boolean); }
            
            try {
                tags = JSON.parse(book.tags || '[]');
            } catch (e) { tags = []; }

            const year = book.publish_date ? parseInt(book.publish_date.split('-')[0]) : null;
            
            return {
                id: (index + 1).toString(),
                neodb_uuid: book.uuid,
                title: book.title,
                subtitle: book.subtitle || '',
                author: authors.join(', ') || '未知作者',
                publisher: book.publisher || '未知出版社',
                year: year || 2026,
                pages: book.page_count || 0,
                category: this.mapCategory(categories),
                tags: tags,
                cover: book.cover_image_url || '',
                rating: book.rating ? book.rating.toFixed(1) : '4.0',
                reviews: book.rating_count || 0,
                description: book.description || '暂无简介',
                highlight: book.description ? book.description.substring(0, 100) + '...' : '一本值得阅读的书',
                sections: ['recent'],
                dateAdded: book.created_at ? book.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            };
        });
    }

    mapCategory(categories) {
        const categoryMap = {
            '小说': 'fiction',
            '文学': 'literature',
            '艺术': 'art',
            '设计': 'design',
            '历史': 'history',
            '哲学': 'philosophy',
            '心理学': 'psychology',
            '科学': 'science',
            '商业': 'business',
            '传记': 'biography'
        };
        
        for (const cat of categories) {
            for (const [cn, en] of Object.entries(categoryMap)) {
                if (cat && cat.includes(cn)) return en;
            }
        }
        return 'nonfiction';
    }

    async loadBook(bookId) {
        // 支持 neodb_uuid 或数字 id 查找
        this.currentBook = this.books.find(b => 
            b.neodb_uuid === bookId || b.id === bookId
        );
        
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

        // 初始化购书链接模块
        if (typeof PurchaseLinksModule !== 'undefined') {
            const purchaseModule = new PurchaseLinksModule();
            purchaseModule.render(book.neodb_uuid || book.id, book.title, 'purchaseLinksContainer');
        }

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
