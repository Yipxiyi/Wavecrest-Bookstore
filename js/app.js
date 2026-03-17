// Wavecrest Bookstore - Home Page
// Version: Robust with proper error handling

class BookstoreApp {
    constructor() {
        this.books = [];
        this.carouselData = [
            {
                id: 1,
                tag: '新书速递',
                title: '2026年春季新书',
                desc: '从豆瓣精选21本即将出版的重磅新作，涵盖哲学、艺术、历史与科学。每一本都值得期待。',
                image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1800&q=80',
                link: 'articles.html'
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
        this.init();
    }

    async init() {
        console.log('🚀 Initializing...');
        try {
            await this.loadData();
            this.renderCarousel();
            this.renderAllSections();
            console.log('✅ Done');
        } catch (e) {
            console.error('❌ Error:', e);
        }
    }

    async loadData() {
        console.log('📚 Loading...');
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books || [];
        console.log(`✅ Loaded ${this.books.length} books`);
    }

    renderCarousel() {
        const container = document.getElementById('carouselContainer');
        const dots = document.getElementById('carouselDots');
        if (!container || !dots) return;

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

        dots.innerHTML = this.carouselData.map((_, i) => `
            <div class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>
        `).join('');

        // Click handlers
        container.querySelectorAll('.carousel-item').forEach(item => {
            item.addEventListener('click', () => window.location.href = item.dataset.link);
        });

        dots.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.addEventListener('click', () => this.goToSlide(i));
        });
    }

    goToSlide(index) {
        this.currentSlide = index;
        document.getElementById('carouselContainer').style.transform = `translateX(-${index * 100}%)`;
        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    renderAllSections() {
        console.log('🎨 Rendering sections...');
        
        const sections = ['recent', 'featured', 'popular', 'classic'];
        
        sections.forEach((sectionKey, idx) => {
            const containerId = `${sectionKey}Container`;
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.warn(`Container #${containerId} not found`);
                return;
            }
            
            // 根据 sections 字段过滤，如果没有则按索引分配
            let sectionBooks = this.books.filter(b => 
                b.sections && b.sections.includes(sectionKey)
            );
            
            // 如果没有匹配的书籍，按索引分配
            if (sectionBooks.length === 0) {
                const start = idx * 10;
                const end = start + 10;
                sectionBooks = this.books.slice(start, end);
            }
            
            console.log(`${sectionKey}: ${sectionBooks.length} books`);
            
            if (sectionBooks.length === 0) {
                container.innerHTML = '<p class="empty-state">暂无书籍</p>';
                return;
            }
            
            container.innerHTML = sectionBooks.map(book => this.renderBookCard(book)).join('');
            
            // Click handlers
            container.querySelectorAll('.book-card').forEach((card, i) => {
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
        
        const placeholder = !hasImage ? `
            <div class="book-cover-placeholder">
                <div class="book-cover-title">${(book.title || '').substring(0,6)}...</div>
                <div class="book-cover-author">${(book.author || '').substring(0,8)}</div>
            </div>
        ` : '';
        
        return `
            <article class="book-card">
                <div class="book-cover" style="${coverStyle}">${placeholder}</div>
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

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BookstoreApp());
} else {
    new BookstoreApp();
}
