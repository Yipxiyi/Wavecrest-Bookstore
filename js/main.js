/**
 * Wavecrest Bookstore - Main JavaScript
 * 交互功能：滚动动画、导航效果、移动端菜单、表单处理
 */

(function() {
    'use strict';

    // ===== DOM Elements =====
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    const contactForm = document.getElementById('contactForm');
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up');

    // ===== Navigation Scroll Effect =====
    function handleNavScroll() {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    // ===== Mobile Menu Toggle =====
    function toggleMobileMenu() {
        navLinks.classList.toggle('active');
        
        // Animate hamburger to X
        const spans = navToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    }

    // ===== Close mobile menu when clicking a link =====
    function closeMobileMenu() {
        navLinks.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }

    // ===== Scroll Animation Observer =====
    function initScrollAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: stop observing after animation
                    // observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => observer.observe(el));
    }

    // ===== Smooth Scroll for Anchor Links =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navHeight = nav.offsetHeight;
                    const targetPosition = targetElement.offsetTop - navHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    closeMobileMenu();
                }
            });
        });
    }

    // ===== Contact Form Handler =====
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        // Simple validation
        if (!data.name || !data.email || !data.message) {
            showNotification('请填写所有字段', 'error');
            return;
        }
        
        if (!isValidEmail(data.email)) {
            showNotification('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // Simulate form submission (replace with actual API call)
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '发送中...';
        submitBtn.disabled = true;
        
        // Simulate API delay
        setTimeout(() => {
            showNotification('消息已发送，我们会尽快回复！', 'success');
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // ===== Email Validation =====
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ===== Notification System =====
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="关闭通知">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            padding: 16px 20px;
            background: ${type === 'success' ? '#1E2A38' : type === 'error' ? '#dc2626' : '#BFC9D9'};
            color: ${type === 'success' ? '#fff' : type === 'error' ? '#fff' : '#1E2A38'};
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            .notification-close:hover { opacity: 1; }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ===== Parallax Effect for Waves =====
    function initParallax() {
        const waves = document.querySelectorAll('.wave');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            
            waves.forEach((wave, index) => {
                const speed = 0.1 + (index * 0.05);
                wave.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }

    // ===== Book Card Hover Effect =====
    function initBookCardEffects() {
        const bookCards = document.querySelectorAll('.book-card');
        
        bookCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                const bookSpine = this.querySelector('.book-spine');
                const bookFront = this.querySelector('.book-front');
                
                if (bookSpine) bookSpine.style.transform = 'translateX(-50%) rotateY(-15deg)';
                if (bookFront) {
                    bookFront.style.transform = 'translateX(-50%) rotateY(-15deg) translateX(4px)';
                    bookFront.style.transformOrigin = 'left center';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                const bookSpine = this.querySelector('.book-spine');
                const bookFront = this.querySelector('.book-front');
                
                if (bookSpine) bookSpine.style.transform = 'translateX(-50%)';
                if (bookFront) {
                    bookFront.style.transform = 'translateX(-50%)';
                }
            });
        });
    }

    // ===== Initialize Hero Animations =====
    function initHeroAnimations() {
        const heroElements = document.querySelectorAll('.hero .fade-in-up');
        
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 150);
        });
    }

    // ===== Active Navigation Link =====
    function initActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (scrollY >= sectionTop - 200) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // ===== Initialize Everything =====
    function init() {
        // Initial nav state
        handleNavScroll();
        
        // Event listeners
        window.addEventListener('scroll', handleNavScroll, { passive: true });
        
        if (navToggle) {
            navToggle.addEventListener('click', toggleMobileMenu);
        }
        
        if (contactForm) {
            contactForm.addEventListener('submit', handleFormSubmit);
        }
        
        // Initialize features
        initScrollAnimations();
        initSmoothScroll();
        initParallax();
        initBookCardEffects();
        initHeroAnimations();
        initActiveNavLink();
        
        // Add CSS for active nav link
        const style = document.createElement('style');
        style.textContent = `
            .nav-links a.active {
                opacity: 1;
            }
            .nav-links a.active::after {
                width: 100%;
            }
        `;
        document.head.appendChild(style);
        
        console.log('🌊 Wavecrest Bookstore initialized');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
