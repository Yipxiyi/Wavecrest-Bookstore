// Articles Page - Blog Style

class ArticlesPage {
    constructor() {
        this.articles = [];
        this.books = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderFeaturedArticles();
            this.renderArticleList();
            this.renderCategories();
            this.renderWidgetBooks();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize articles page:', error);
        }
    }

    async loadData() {
        // 加载文章数据
        const articlesResponse = await fetch('data/articles.json');
        const articlesData = await articlesResponse.json();
        this.articles = articlesData.articles;

        // 加载书籍数据
        const booksResponse = await fetch('data/books.json');
        const booksData = await booksResponse.json();
        this.books = booksData.books;
    }

    // 获取精选文章
    getFeaturedArticles() {
        return this.articles.filter(article => article.featured).slice(0, 2);
    }

    // 渲染精选文章
    renderFeaturedArticles() {
        const container = document.getElementById('featuredGrid');
        if (!container) return;

        const featured = this.getFeaturedArticles();
        
        if (featured.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无精选文章</p>';
            return;
        }

        container.innerHTML = featured.map(article => `
            <article class="featured-card" onclick="window.location.href='${article.link}'">
                <div class="featured-card-image" style="background-image: url('${article.image}')">
                    <span class="featured-card-tag">${article.tag}</span>
                </div>
                <div class="featured-card-content">
                    <h3 class="featured-card-title">${article.title}</h3>
                    <p class="featured-card-excerpt">${article.excerpt}</p>
                </div>
            </article>
        `).join('');
    }

    // 获取过滤后的文章
    getFilteredArticles() {
        if (this.currentFilter === 'all') {
            return this.articles;
        }
        return this.articles.filter(article => article.tag === this.currentFilter);
    }

    // 渲染文章列表
    renderArticleList() {
        const container = document.getElementById('articlesStream');
        if (!container) return;

        const filtered = this.getFilteredArticles();
        
        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无文章</p>';
            return;
        }

        container.innerHTML = filtered.map(article => `
            <article class="article-item" onclick="window.location.href='${article.link}'">
                <div class="article-item-image" style="background-image: url('${article.image}')">
                    <span class="article-item-tag">${article.tag}</span>
                </div>
                <div class="article-item-content">
                    <span class="article-item-category">${article.category}</span>
                    <h3 class="article-item-title">${article.title}</h3>
                    <p class="article-item-excerpt">${article.excerpt}</p>
                    <div class="article-item-meta">
                        <span>${article.date}</span>
                        <span>${article.readTime}阅读</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    // 渲染分类列表
    renderCategories() {
        const container = document.getElementById('categoryList');
        if (!container) return;

        // 统计每个分类的文章数
        const categoryCount = {};
        this.articles.forEach(article => {
            categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
        });

        // 转换为数组并排序
        const categories = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        container.innerHTML = categories.map(([category, count]) => `
            <li>
                <a href="#">${category}</a>
                <span class="category-count">${count}</span>
            </li>
        `).join('');
    }

    // 渲染侧边栏热门书籍
    renderWidgetBooks() {
        const container = document.getElementById('widgetBooks');
        if (!container) return;

        // 获取最新的几本书
        const recentBooks = this.books
            .filter(book => book.sections && book.sections.includes('recent'))
            .slice(0, 4);

        container.innerHTML = recentBooks.map(book => {
            const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
            const coverStyle = isImageUrl 
                ? `background-image: url('${book.cover}')`
                : `background-color: ${book.cover}`;
            
            return `
                <div class="widget-book" onclick="window.location.href='book.html?id=${book.id}'">
                    <div class="widget-book-cover" style="${coverStyle}"></div>
                    <div class="widget-book-info">
                        <div class="widget-book-title">${book.title}</div>
                        <div class="widget-book-author">${book.author}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 设置事件监听
    setupEventListeners() {
        // 过滤标签
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // 移除所有active
                filterTabs.forEach(t => t.classList.remove('active'));
                // 添加active到当前
                e.target.classList.add('active');
                // 更新过滤器
                this.currentFilter = e.target.dataset.filter;
                // 重新渲染
                this.renderArticleList();
            });
        });

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
    new ArticlesPage();
});
