// purchase-links.js - 购书链接模块

class PurchaseLinksModule {
    constructor() {
        this.SUPABASE_URL = 'https://tjqaqieefrolvtqzpaeo.supabase.co';
        this.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcWFxaWVlZnJvbHZ0cXpwYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg3ODgsImV4cCI6MjA4ODc5NDc4OH0.c_5SbFQ5ByQk5dMFwHMGgn3nMzbdjWvwWAVhUFvW5xo';
        
        this.platformConfig = {
            douban: { name: '豆瓣', icon: '📚', color: '#00B51D' },
            jd: { name: '京东', icon: '🛒', color: '#E4393C' },
            dangdang: { name: '当当', icon: '📖', color: '#FF2832' },
            amazon_cn: { name: '亚马逊', icon: '📦', color: '#FF9900' },
            amazon_com: { name: 'Amazon', icon: '🌐', color: '#FF9900' }
        };
    }

    // 生成搜索链接（无需API）
    generateSearchLinks(bookTitle, bookAuthor = '') {
        const searchQuery = encodeURIComponent(bookTitle);
        return [
            {
                platform: 'douban',
                url: `https://book.douban.com/subject_search?search_text=${searchQuery}`,
                name: '豆瓣'
            },
            {
                platform: 'jd', 
                url: `https://search.jd.com/Search?keyword=${searchQuery}&enc=utf-8`,
                name: '京东'
            },
            {
                platform: 'dangdang',
                url: `http://search.dangdang.com/?key=${searchQuery}`,
                name: '当当'
            },
            {
                platform: 'amazon_cn',
                url: `https://www.amazon.cn/s?k=${searchQuery}`,
                name: '亚马逊'
            }
        ];
    }

    // 从Supabase获取购书链接
    async fetchPurchaseLinks(bookId) {
        try {
            const url = `${this.SUPABASE_URL}/rest/v1/purchase_links?book_id=eq.${bookId}&order=is_primary.desc,created_at.desc`;
            const response = await fetch(url, {
                headers: {
                    'apikey': this.SUPABASE_KEY,
                    'Authorization': `Bearer ${this.SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch purchase links:', error);
            return [];
        }
    }

    // 渲染购书链接区域
    render(bookId, bookTitle, containerId = 'purchaseLinksContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 先显示搜索链接（立即可用）
        const searchLinks = this.generateSearchLinks(bookTitle);
        
        container.innerHTML = `
            <div class="purchase-section">
                <h3 class="purchase-title">📚 购买本书</h3>
                <p class="purchase-subtitle">以下平台可购买或查看此书信息</p>
                <div class="purchase-links-grid">
                    ${searchLinks.map(link => this.renderLinkButton(link)).join('')}
                </div>
                <div class="purchase-note">
                    <small>💡 点击跳转至平台搜索页面，价格和库存以实际页面为准</small>
                </div>
            </div>
        `;

        // 异步加载数据库中的具体链接
        this.loadDatabaseLinks(bookId, container);
    }

    renderLinkButton(link) {
        const config = this.platformConfig[link.platform] || { name: link.platform, icon: '🔗', color: '#666' };
        const availabilityBadge = link.availability === 'in_stock' ? '<span class="stock-badge in-stock">有货</span>' : 
                                 link.availability === 'out_of_stock' ? '<span class="stock-badge out-stock">缺货</span>' : '';
        const priceTag = link.price ? `<span class="price-tag">¥${link.price}</span>` : '';
        
        return `
            <a href="${link.url}" target="_blank" rel="noopener" class="purchase-link-btn" data-platform="${link.platform}">
                <span class="platform-icon">${config.icon}</span>
                <span class="platform-name">${config.name}</span>
                ${priceTag}
                ${availabilityBadge}
            </a>
        `;
    }

    async loadDatabaseLinks(bookId, container) {
        try {
            const dbLinks = await this.fetchPurchaseLinks(bookId);
            if (dbLinks && dbLinks.length > 0) {
                // 如果有数据库链接，更新显示
                this.updateWithDatabaseLinks(dbLinks, container);
            }
        } catch (error) {
            console.log('No database links available, using search links');
        }
    }

    updateWithDatabaseLinks(links, container) {
        const grid = container.querySelector('.purchase-links-grid');
        if (!grid) return;

        // 用数据库链接替换搜索链接
        grid.innerHTML = links.map(link => this.renderLinkButton({
            platform: link.platform,
            url: link.url,
            price: link.price,
            availability: link.availability
        })).join('');

        // 添加更新时间
        const lastUpdate = links[0]?.last_verified || links[0]?.updated_at;
        if (lastUpdate) {
            const note = container.querySelector('.purchase-note');
            if (note) {
                note.innerHTML = `<small>🕐 价格信息更新于 ${new Date(lastUpdate).toLocaleDateString('zh-CN')}</small>`;
            }
        }
    }
}

// 初始化
window.PurchaseLinksModule = PurchaseLinksModule;
