// Wavecrest Bookstore - Home Page with Carousel
// Supabase Integration: Fetches books from Supabase PostgreSQL

class BookstoreApp {
    constructor() {
        this.books = [];
        this.carouselData = [
            {
                id: 1,
                tag: '新书速递',
                title: '2026春季新书速递',
                desc: '五本值得期待的非虚构佳作：从《鏡之孤城》作者的创作指南到印尼无政府主义社会的隐秘历史，陪你度过这个充满希望的春天。',
                image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=spring-2026'
            },
            {
                id: 2,
                tag: '编辑精选',
                title: '哲学思考的另一种可能',
                desc: '当哲学家卸下神圣光环，他们的人生比理论更有趣。从苏格拉底到尼采，看见思想背后的真实人性。',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=new-1'
            },
            {
                id: 3,
                tag: '专题策划',
                title: '被遗忘的女性艺术家',
                desc: '艺术史不应只是男性的历史。52位欧洲女性艺术家的生平与创作，还原被遮蔽的艺术真相。',
                image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=new-2'
            },
            {
                id: 4,
                tag: '深度阅读',
                title: '寻访中国千年木构',
                desc: '从应县木塔到佛光寺，一场跨越千年的文化之旅。在古建筑中，寻找文明的根脉与匠心。',
                image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=new-3'
            }
        ];
        this.currentSlide = 0;
        
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
        console.log('🚀 BookstoreApp initializing...');
        try {
            await this.loadData();
            console.log('✅ Data loaded, rendering...');
            this.renderCarousel();
            console.log('✅ Carousel rendered');
            this.renderAllSections();
            console.log('✅ Sections rendered');
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            this.setupScrollButtons();
            console.log('✅ Scroll buttons setup');
            this.startAutoPlay();
            console.log('✅ Autoplay started');
            console.log('✅ BookstoreApp fully initialized!');
        } catch (error) {
            console.error('❌ Failed to initialize BookstoreApp:', error);
            console.error('Error stack:', error.stack);
        }
    }

    async loadData() {
        console.log('📚 Starting to load data...');
        // 首先加载本地数据确保页面有内容
        await this.loadLocalData();
        
        // 然后尝试从 Supabase 加载更新数据
        try {
            console.log('🔄 Trying Supabase...');
            const books = await this.fetchFromSupabase();
            console.log('📦 Supabase response:', books);
            
            if (books && books.length > 0) {
                console.log(`✅ Loaded ${books.length} books from Supabase`);
                this.books = this.formatBooks(books);
                console.log(`✅ Formatted ${this.books.length} books for display`);
                // 重新渲染以显示 Supabase 数据
                this.renderAllSections();
            }
        } catch (error) {
            console.error('❌ Supabase failed, keeping local data:', error.message);
        }
    }
    
    async loadLocalData() {
        try {
            const response = await fetch('data/books.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.books = data.books || [];
            console.log(`✅ Loaded ${this.books.length} books from local JSON`);
        } catch (error) {
            console.error('❌ Failed to load local data:', error);
            this.books = [];
        }
    }

    async fetchFromSupabase() {
        const url = `${this.SUPABASE_URL}/rest/v1/books?select=*&order=created_at.desc`;
        console.log('📡 Fetching from:', url);
        
        try {
            const response = await fetch(url, {
                headers: {
                    'apikey': this.SUPABASE_KEY,
                    'Authorization': `Bearer ${this.SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📨 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Supabase error response:', errorText);
                throw new Error(`Supabase error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Supabase data received:', data.length, 'books');
            return data;
            
        } catch (error) {
            console.error('❌ fetchFromSupabase failed:', error);
            throw error;
        }
    }

    formatBooks(supabaseBooks) {
        if (!Array.isArray(supabaseBooks)) {
            console.error('formatBooks: expected array, got', typeof supabaseBooks);
            return [];
        }
        
        return supabaseBooks.map((book, index) => {
            try {
                // 解析 JSON 字段
                let authors = [];
                let categories = [];
                let tags = [];
                
                try {
                    authors = JSON.parse(book.authors || '[]');
                } catch (e) { 
                    authors = book.authors ? [book.authors] : []; 
                }
                
                try {
                    categories = JSON.parse(book.categories || '[]');
                } catch (e) { 
                    categories = book.categories ? [book.categories] : []; 
                }
                
                try {
                    tags = JSON.parse(book.tags || '[]');
                } catch (e) { 
                    tags = []; 
                }

                let year = 2026;
                try {
                    if (book.publish_date) {
                        year = parseInt(book.publish_date.split('-')[0]) || 2026;
                    }
                } catch (e) { year = 2026; }
                
                // 根据索引分配到不同区域
                let sections = ['recent'];
                if (index < 10) {
                    sections = ['recent'];
                } else if (index < 20) {
                    sections = ['featured'];
                } else if (index < 30) {
                    sections = ['popular'];
                } else {
                    sections = ['classic'];
                }
                
                // 处理日期
                let dateAdded = new Date().toISOString().split('T')[0];
                try {
                    if (book.created_at) {
                        dateAdded = book.created_at.split('T')[0];
                    }
                } catch (e) { dateAdded = new Date().toISOString().split('T')[0]; }
                
                return {
                    id: String(index + 1),
                    neodb_uuid: book.uuid || '',
                    title: book.title || '未知书名',
                    subtitle: book.subtitle || '',
                    author: Array.isArray(authors) ? authors.join(', ') : '未知作者',
                    publisher: book.publisher || '未知出版社',
                    year: year,
                    pages: book.page_count || 0,
                    category: this.mapCategory(categories),
                    tags: Array.isArray(tags) ? tags : [],
                    cover: book.cover_image_url || '',
                    rating: book.rating ? String(book.rating.toFixed(1)) : '4.0',
                    reviews: book.rating_count || 0,
                    description: book.description || '暂无简介',
                    highlight: book.description ? book.description.substring(0, 100) + '...' : '一本值得阅读的书',
                    sections: sections,
                    dateAdded: dateAdded
                };
            } catch (err) {
                console.error('Error formatting book at index', index, err);
                // 返回一个默认的书籍对象
                return {
                    id: String(index + 1),
                    neodb_uuid: '',
                    title: '加载失败',
                    subtitle: '',
                    author: '未知',
                    publisher: '未知出版社',
                    year: 2026,
                    pages: 0,
                    category: 'nonfiction',
                    tags: [],
                    cover: '',
                    rating: '4.0',
                    reviews: 0,
                    description: '数据加载失败',
                    highlight: '数据加载失败',
                    sections: ['recent'],
                    dateAdded: new Date().toISOString().split('T')[0]
                };
            }
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

    renderCarousel() {
        const container = document.getElementById('carouselContainer');
        const dotsContainer = document.getElementById('carouselDots');
        
        if (!container) return;

        // Render slides
        container.innerHTML = this.carouselData.map(item => `
            <div class="carousel-item" data-link="${item.link}" style="background-image: url('${item.image}');">
                <div class="carousel-content">
                    <div class="carousel-card">
                        <div class="carousel-tag">${item.tag}</div>
                        <h2 class="carousel-title">${item.title}</h2>
                        <p class="carousel-desc">${item.desc}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Render dots
        dotsContainer.innerHTML = this.carouselData.map((_, index) => `
            <div class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
        `).join('');

        // Add click handlers to slides
        container.querySelectorAll('.carousel-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = item.dataset.link;
            });
        });

        // Add click handlers to dots
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
    }

    goToSlide(index) {
        this.currentSlide = index;
        const container = document.getElementById('carouselContainer');
        container.style.transform = `translateX(-${index * 100}%)`;
        
        // Update dots
        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.carouselData.length;
        this.goToSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.carouselData.length) % this.carouselData.length;
        this.goToSlide(prev);
    }

    startAutoPlay() {
        setInterval(() => this.nextSlide(), 5000);
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
                const book = sectionBooks[index];
                // 使用 neodb_uuid 如果存在，否则使用 id
                const bookId = book.neodb_uuid || book.id;
                window.location.href = `book.html?id=${bookId}`;
            });
        });
    }

    renderBookCard(book) {
        const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
        const coverId = `cover-${book.id}`;
        
        if (isImageUrl) {
            // 使用代理绕过防盗链
            const proxiedUrl = this.getProxiedImageUrl(book.cover);
            
            return `
                <article class="book-card" data-book-id="${book.id}">
                    <div class="book-cover" id="${coverId}" 
                         style="background-image: url('${proxiedUrl}'); background-size: cover; background-position: center;"
                         onerror="this.style.backgroundImage=''; this.style.backgroundColor='#9B8B7A'; this.innerHTML='<div class=\'book-cover-placeholder\'><div class=\'book-cover-title\'>'+'${book.title.replace(/'/g, "\\'")}'.substring(0,6)+'...</div><div class=\'book-cover-author\'>'+'${book.author.replace(/'/g, "\\'")}'.substring(0,8)+'</div></div>'">
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
                </article>`;
        }
        
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
            </article>`;
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
        });
    }

    setupEventListeners() {
        // Carousel buttons
        document.getElementById('carouselPrev')?.addEventListener('click', () => this.prevSlide());
        document.getElementById('carouselNext')?.addEventListener('click', () => this.nextSlide());

        // Touch/Swipe support for carousel
        this.setupCarouselSwipe();

        // Mobile nav toggle
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

    setupCarouselSwipe() {
        const container = document.getElementById('carouselContainer');
        if (!container) return;

        let touchStartX = 0;
        let touchEndX = 0;
        let isDragging = false;

        const handleTouchStart = (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isDragging = true;
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            touchEndX = e.changedTouches[0].screenX;
        };

        const handleTouchEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = touchStartX - touchEndX;
            const threshold = 50; // 滑动阈值

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // 向左滑动 -> 下一张
                    this.nextSlide();
                } else {
                    // 向右滑动 -> 上一张
                    this.prevSlide();
                }
            }
        };

        // 触摸事件
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        // 鼠标拖拽支持（桌面端）
        let mouseStartX = 0;
        let isMouseDown = false;

        container.addEventListener('mousedown', (e) => {
            mouseStartX = e.screenX;
            isMouseDown = true;
        });

        container.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            touchEndX = e.screenX;
        });

        container.addEventListener('mouseup', () => {
            if (!isMouseDown) return;
            isMouseDown = false;
            
            const diff = mouseStartX - touchEndX;
            const threshold = 50;

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
            }
        });

        container.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});
