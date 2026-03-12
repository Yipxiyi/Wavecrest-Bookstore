// Article Detail Page - Markdown Renderer

class ArticleDetailPage {
    constructor() {
        this.article = null;
        this.books = [];
        this.articles = [];
        this.init();
    }

    async init() {
        try {
            // 获取URL参数
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');

            if (!articleId) {
                this.showError('文章ID不能为空');
                return;
            }

            // 加载数据
            await this.loadData();
            
            // 查找文章
            this.article = this.articles.find(a => a.id === articleId);
            
            if (!this.article) {
                this.showError('文章未找到');
                return;
            }

            // 渲染页面
            this.renderArticle();
            this.renderRelatedBook();
            this.renderRelatedArticles();

        } catch (error) {
            console.error('Failed to initialize article page:', error);
            this.showError('加载文章失败');
        }
    }

    async loadData() {
        // 并行加载文章和书籍数据
        const [articlesRes, booksRes] = await Promise.all([
            fetch('data/articles.json'),
            fetch('data/books.json')
        ]);

        const articlesData = await articlesRes.json();
        const booksData = await booksRes.json();

        this.articles = articlesData.articles;
        this.books = booksData.books;
    }

    renderArticle() {
        const article = this.article;

        // 设置页面标题
        document.title = `${article.title} - Wavecrest Bookstore`;

        // 渲染头部背景
        const headerBg = document.getElementById('articleHeaderBg');
        if (headerBg && article.image) {
            headerBg.style.backgroundImage = `url('${article.image}')`;
        }

        // 渲染标签
        const tagEl = document.getElementById('articleTag');
        if (tagEl) tagEl.textContent = article.tag;

        // 渲染标题
        const titleEl = document.getElementById('articleTitle');
        if (titleEl) titleEl.textContent = article.title;

        // 渲染元信息
        const dateEl = document.getElementById('articleDate');
        const readTimeEl = document.getElementById('articleReadTime');
        const categoryEl = document.getElementById('articleCategory');

        if (dateEl) dateEl.textContent = article.date;
        if (readTimeEl) readTimeEl.textContent = article.readTime;
        if (categoryEl) categoryEl.textContent = article.category;

        // 渲染内容（Markdown to HTML）
        const contentEl = document.getElementById('articleContent');
        if (contentEl && article.content) {
            // 将纯文本转换为 Markdown 格式
            // 分段落，空行分隔
            const markdownContent = this.formatContent(article.content);
            contentEl.innerHTML = marked.parse(markdownContent);
        }

        // 渲染标签
        const tagsEl = document.getElementById('articleTags');
        if (tagsEl && article.tags) {
            tagsEl.innerHTML = article.tags.map(tag => 
                `<span class="article-tag">${tag}</span>`
            ).join('');
        }
    }

    // 将纯文本内容格式化为 Markdown
    formatContent(content) {
        if (!content) return '';
        
        // 如果内容已经是 HTML，直接返回
        if (content.includes('<') && content.includes('>')) {
            return content;
        }

        // 处理段落：将双换行转换为段落
        let formatted = content
            .replace(/\n\n/g, '\n\n')  // 保持段落间距
            .trim();

        // 检测是否包含 Markdown 标记
        const hasMarkdown = /[#*\-_\[\]\(\)]/.test(formatted);
        
        if (!hasMarkdown) {
            // 如果没有任何 Markdown 标记，将每段用空行分隔
            const paragraphs = formatted.split('\n').filter(p => p.trim());
            formatted = paragraphs.join('\n\n');
        }

        return formatted;
    }

    renderRelatedBook() {
        const container = document.getElementById('relatedBook');
        if (!container || !this.article.bookId) return;

        const book = this.books.find(b => b.id === this.article.bookId);
        if (!book) {
            container.style.display = 'none';
            return;
        }

        const isImageUrl = book.cover && (book.cover.startsWith('http://') || book.cover.startsWith('https://'));
        const coverStyle = isImageUrl 
            ? `background-image: url('${book.cover}')`
            : `background-color: ${book.cover}`;

        container.innerHTML = `
            <div class="author-book" onclick="window.location.href='book.html?id=${book.id}'">
                <div class="author-book-cover" style="${coverStyle}"></div>
                <div class="author-book-info">
                    <div class="author-book-title">${book.title}</div>
                    <div class="author-book-author">${book.author}</div>
                    <div class="author-book-desc">${book.highlight || book.description?.substring(0, 60) + '...'}</div>
                </div>
            </div>
        `;
    }

    renderRelatedArticles() {
        const container = document.getElementById('relatedArticles');
        if (!container) return;

        // 获取同分类的其他文章
        const related = this.articles
            .filter(a => a.category === this.article.category && a.id !== this.article.id)
            .slice(0, 3);

        // 如果同分类不够，补充其他文章
        if (related.length < 3) {
            const otherArticles = this.articles
                .filter(a => a.id !== this.article.id && !related.includes(a))
                .slice(0, 3 - related.length);
            related.push(...otherArticles);
        }

        if (related.length === 0) {
            container.innerHTML = '<p style="color: var(--tertiary); font-size: 14px;">暂无相关文章</p>';
            return;
        }

        container.innerHTML = related.map(article => `
            <div class="related-article" onclick="window.location.href='article-detail.html?id=${article.id}'">
                <div class="related-article-title">${article.title}</div>
                <div class="related-article-meta">${article.date} · ${article.readTime}</div>
            </div>
        `).join('');
    }

    showError(message) {
        const contentEl = document.getElementById('articleContent');
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="error-message">
                    <h2>🤔 ${message}</h2>
                    <p>抱歉，无法加载这篇文章。</p>
                    <a href="articles.html">返回文章列表 →</a>
                </div>
            `;
        }
    }
}

// 分享功能
function shareArticle() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        }).catch(err => console.log('Share failed:', err));
    } else {
        // 复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('链接已复制到剪贴板');
        }).catch(() => {
            alert('复制失败，请手动复制链接');
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ArticleDetailPage();
    
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
});
