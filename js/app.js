// Wavecrest Bookstore - Home Page with Carousel

class BookstoreApp {
    constructor() {
        this.books = [];
        this.carouselData = [
            {
                id: 1,
                tag: '专题',
                title: '村上春树的夏天',
                desc: '探索村上春树作品中的夏日意象与孤独美学',
                image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=1'
            },
            {
                id: 2,
                tag: '书单',
                title: '春日治愈系书单',
                desc: '十本让心灵平静的好书，陪你度过温暖春日',
                image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=2'
            },
            {
                id: 3,
                tag: '访谈',
                title: '与译者对话',
                desc: '翻译的艺术：如何在两种语言间传递文学之美',
                image: 'https://images.unsplash.com/photo-1455885666463-9e84d871a46b?auto=format&fit=crop&w=1800&q=80',
                link: 'article-detail.html?id=3'
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
        });
    }

    setupEventListeners() {
        // Carousel buttons
        document.getElementById('carouselPrev')?.addEventListener('click', () => this.prevSlide());
        document.getElementById('carouselNext')?.addEventListener('click', () => this.nextSlide());

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
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BookstoreApp();
});
