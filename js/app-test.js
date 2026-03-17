// 测试版本 - 直接使用本地数据
class BookstoreApp {
    constructor() {
        this.books = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing...');
        try {
            // 直接使用本地数据，绕过 Supabase
            const response = await fetch('data/books.json');
            const data = await response.json();
            this.books = data.books || [];
            console.log('✅ Loaded', this.books.length, 'books');
            
            this.renderAllSections();
            console.log('✅ Rendered');
        } catch (e) {
            console.error('❌ Error:', e);
            document.body.innerHTML += '<div style="color:red;padding:20px;">Error: ' + e.message + '</div>';
        }
    }

    renderAllSections() {
        const container = document.getElementById('recentContainer');
        if (!container) {
            console.error('❌ Container not found');
            return;
        }
        
        if (this.books.length === 0) {
            container.innerHTML = '<p>暂无书籍</p>';
            return;
        }
        
        container.innerHTML = this.books.map(b => 
            '<div class="book-card">' + b.title + '</div>'
        ).join('');
    }
}

new BookstoreApp();
