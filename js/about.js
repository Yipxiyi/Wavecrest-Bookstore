// Wavecrest Bookstore - About Page

class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                window.location.href = `search.html?q=${encodeURIComponent(e.target.value.trim())}`;
            }
        });

        searchBtn?.addEventListener('click', () => {
            const value = searchInput?.value.trim();
            if (value) {
                window.location.href = `search.html?q=${encodeURIComponent(value)}`;
            }
        });

        // Mobile nav
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.querySelector('.nav-links');

        navToggle?.addEventListener('click', () => {
            const isVisible = navLinks.style.display === 'flex';
            navLinks.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'var(--color-bg)';
                navLinks.style.flexDirection = 'column';
                navLinks.style.padding = 'var(--space-md)';
                navLinks.style.borderBottom = '1px solid var(--color-border)';
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new AboutPage();
});
