// Wavecrest Bookstore - Home Page with Carousel

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
        try {
            await this.loadData();
            this.renderCarousel();
            this.renderAllSections();
            this.setupEventListeners();
            this.setupScrollButtons();
            this.startAutoPlay();
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    async loadData() {
        const response = await fetch('data/books.json');
        const data = await response.json();
        this.books = data.books;
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

        container.querySelectorAll('.book-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                window.location.href = `book.html?id=${sectionBooks[index].id}`;
            });
        });
    }

    renderBookCard(book) {
        const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
        const coverId = `cover-${book.id}`;
        
        if (isImageUrl) {
            // 使用 img 标签预加载检测
            setTimeout(() => {
                const img = new Image();
                img.onload = () => {
                    const el = document.getElementById(coverId);
                    if (el) el.style.backgroundImage = `url('${book.cover}')`;
                };
                img.onerror = () => {
                    const el = document.getElementById(coverId);
                    if (el) {
                        el.style.backgroundImage = '';
                        el.style.backgroundColor = '#9B8B7A';
                        el.innerHTML = `<div class="book-cover-placeholder"><div class="book-cover-title">${book.title.substring(0,6)}...</div><div class="book-cover-author">${book.author}</div></div>`;
                    }
                };
                img.src = book.cover;
            }, 0);
            
            return `
                <article class="book-card" data-book-id="${book.id}">
                    <div class="book-cover" id="${coverId}" style="background-color: var(--bg-secondary);"></div>
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
