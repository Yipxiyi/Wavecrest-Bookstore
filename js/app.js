// Wavecrest Bookstore - Home Page App

class BookstoreApp {
    constructor() {
        this.books = [];
        this.carouselData = [
            {
                id: 'article-1',
                title: '如何在浮躁的时代保持深度阅读',
                desc: '在这个信息爆炸的时代，深度阅读变得越来越珍贵',
                color: 'linear-gradient(135deg, #8B7355, #A89078)',
                tag: '编辑推荐'
            },
            {
                id: 'article-2',
                title: '浪潮与岛屿：Wavecrest的诞生',
                desc: '每个书店都有自己的故事',
                color: 'linear-gradient(135deg, #6B7B8C, #8B9BA8)',
                tag: '专题'
            },
            {
                id: 'article-3',
                title: '春日治愈书单',
                desc: '10本书带你逃离喧嚣，享受阅读时光',
                color: 'linear-gradient(135deg, #A5B5A0, #B8C4A8)',
                tag: '书单'
            },
            {
                id: 'article-4',
                title: '对话村上春树',
                desc: '跑步、写作与爵士乐',
                color: 'linear-gradient(135deg, #9A8B7A, #B5A89A)',
                tag: '访谈'
            },
            {
                id: 'article-5',
                title: '设计一间理想的书房',
                desc: 'MUJI美学的启示',
                color: 'linear-gradient(135deg, #7A8B99, #9AABBA)',
                tag: '空间'
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
        this.categories = data.categories;
    }

    renderCarousel() {
        const container = document.getElementById('carouselContainer');
        const dotsContainer = document.getElementById('carouselDots');
        
        if (!container) return;

        // Render carousel items
        container.innerHTML = this.carouselData.map((item, index) => `
            <div class="carousel-item" data-index="${index}" data-id="${item.id}"
                 style="background: ${item.color}"
                 onclick="window.location.href='${item.id}.html'">
                <div class="carousel-image" style="background: ${item.color}">
                    <span class="carousel-tag">${item.tag}</span>
                    <div class="carousel-content">
                        <h2 class="carousel-title">${item.title}</h2>
                        <p class="carousel-desc">${item.desc}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Render dots
        dotsContainer.innerHTML = this.carouselData.map((_, index) => `
            <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"
                    aria-label="跳转到第${index + 1}张"></button>
        `).join('');

        // Center first item
        this.scrollToSlide(0);
    }

    scrollToSlide(index) {
        const container = document.getElementById('carouselContainer');
        const dots = document.querySelectorAll('.carousel-dot');
        
        if (!container) return;

        this.currentSlide = index;
        const item = container.children[index];
        
        // Calculate scroll position to center the item
        const containerWidth = container.offsetWidth;
        const itemWidth = item.offsetWidth;
        const itemLeft = item.offsetLeft;
        const scrollPosition = itemLeft - (containerWidth - itemWidth) / 2;
        
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' });

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.carouselData.length;
        this.scrollToSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.carouselData.length) % this.carouselData.length;
        this.scrollToSlide(prev);
    }

    startAutoPlay() {
        setInterval(() => {
            this.nextSlide();
        }, 5000);
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
        // Carousel controls
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        const dotsContainer = document.getElementById('carouselDots');

        prevBtn?.addEventListener('click', () => this.prevSlide());
        nextBtn?.addEventListener('click', () => this.nextSlide());

        dotsContainer?.addEventListener('click', (e) => {
            if (e.target.classList.contains('carousel-dot')) {
                const index = parseInt(e.target.dataset.index);
                this.scrollToSlide(index);
            }
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
    new BookstoreApp();
});
