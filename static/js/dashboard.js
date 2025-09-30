// Dashboard JavaScript - Shalabiverse Arabic RTL

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard functionality
    initializeSidebar();
    initializeThemeToggle();
    initializeProgressBars();
    initializeAnimations();
    initializeInteractions();
    initializeRealTimeUpdates();
    initializeStatisticsInteractions();
    initializeAutoRefresh();
});

// Real-time updates functionality
function initializeRealTimeUpdates() {
    // Auto-refresh user statistics every 5 minutes
    setInterval(refreshUserStats, 5 * 60 * 1000);
    
    // Auto-refresh recent activities every 2 minutes
    setInterval(refreshRecentActivities, 2 * 60 * 1000);
    
    // Check for new notifications every minute
    setInterval(checkNewNotifications, 60 * 1000);
}

// Statistics interactions
function initializeStatisticsInteractions() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        // Add hover effects with data visualization
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(39, 110, 241, 0.2)';
            
            // Add pulse animation to stat numbers
            const statNumber = this.querySelector('.stat-content h3');
            if (statNumber) {
                statNumber.style.animation = 'pulse 1s ease-in-out';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            
            const statNumber = this.querySelector('.stat-content h3');
            if (statNumber) {
                statNumber.style.animation = '';
            }
        });
        
        // Add click functionality for detailed stats
        card.addEventListener('click', function() {
            const statType = this.dataset.statType;
            showDetailedStats(statType);
        });
    });
}

// Auto-refresh functionality
function initializeAutoRefresh() {
    let refreshInterval;
    let isAutoRefreshEnabled = localStorage.getItem('autoRefresh') !== 'false';
    
    // Create auto-refresh toggle
    const autoRefreshToggle = createAutoRefreshToggle();
    document.querySelector('.dashboard-header').appendChild(autoRefreshToggle);
    
    function startAutoRefresh() {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            refreshDashboardData();
            showNotification('تم تحديث البيانات تلقائياً', 'info');
        }, 10 * 60 * 1000); // Every 10 minutes
    }
    
    function stopAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    }
    
    // Initialize based on saved preference
    if (isAutoRefreshEnabled) {
        startAutoRefresh();
        autoRefreshToggle.classList.add('active');
    }
    
    // Toggle functionality
    autoRefreshToggle.addEventListener('click', function() {
        isAutoRefreshEnabled = !isAutoRefreshEnabled;
        localStorage.setItem('autoRefresh', isAutoRefreshEnabled);
        
        if (isAutoRefreshEnabled) {
            startAutoRefresh();
            this.classList.add('active');
            showNotification('تم تفعيل التحديث التلقائي', 'success');
        } else {
            stopAutoRefresh();
            this.classList.remove('active');
            showNotification('تم إيقاف التحديث التلقائي', 'info');
        }
    });
}

// Create auto-refresh toggle button
function createAutoRefreshToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'auto-refresh-toggle';
    toggle.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span>التحديث التلقائي</span>
    `;
    toggle.style.cssText = `
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 0.5rem 1rem;
        color: var(--text-primary);
        font-family: 'Cairo', sans-serif;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    return toggle;
}

// Refresh functions
async function refreshUserStats() {
    try {
        const response = await fetch('/api/user-stats');
        if (response.ok) {
            const stats = await response.json();
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Error refreshing user stats:', error);
    }
}

async function refreshRecentActivities() {
    try {
        const response = await fetch('/api/recent-activities');
        if (response.ok) {
            const activities = await response.json();
            updateActivitiesDisplay(activities);
        }
    } catch (error) {
        console.error('Error refreshing activities:', error);
    }
}

async function checkNewNotifications() {
    try {
        const response = await fetch('/api/notifications/check');
        if (response.ok) {
            const data = await response.json();
            if (data.hasNew) {
                showNotification('لديك إشعارات جديدة!', 'info');
                updateNotificationBadge(data.count);
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

async function refreshDashboardData() {
    try {
        const [statsResponse, activitiesResponse] = await Promise.all([
            fetch('/api/user-stats'),
            fetch('/api/recent-activities')
        ]);
        
        if (statsResponse.ok && activitiesResponse.ok) {
            const [stats, activities] = await Promise.all([
                statsResponse.json(),
                activitiesResponse.json()
            ]);
            
            updateStatsDisplay(stats);
            updateActivitiesDisplay(activities);
            
            // Add refresh animation
            document.querySelectorAll('.stat-card, .activity-item').forEach(el => {
                el.style.animation = 'refreshPulse 0.5s ease';
            });
        }
    } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        showNotification('حدث خطأ في تحديث البيانات', 'error');
    }
}

// Update display functions
function updateStatsDisplay(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const statType = card.dataset.statType;
        const statNumber = card.querySelector('.stat-content h3');
        
        if (statNumber && stats[statType] !== undefined) {
            animateNumber(statNumber, parseInt(statNumber.textContent), stats[statType]);
        }
    });
}

function updateActivitiesDisplay(activities) {
    const activitiesContainer = document.querySelector('.activities-list');
    if (!activitiesContainer) return;
    
    // Clear existing activities
    activitiesContainer.innerHTML = '';
    
    if (activities.length === 0) {
        activitiesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <p>لا توجد أنشطة حديثة</p>
            </div>
        `;
        return;
    }
    
    activities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        activitiesContainer.appendChild(activityElement);
    });
}

function createActivityElement(activity) {
    const element = document.createElement('div');
    element.className = 'activity-item';
    element.innerHTML = `
        <div class="activity-icon">
            <i class="fas ${getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-content">
            <p>${activity.description}</p>
            <span class="activity-time">${activity.time_ago}</span>
        </div>
    `;
    return element;
}

function getActivityIcon(type) {
    const icons = {
        'lesson_completed': 'fa-check-circle',
        'course_enrolled': 'fa-book-open',
        'achievement_earned': 'fa-trophy',
        'default': 'fa-bell'
    };
    return icons[type] || icons.default;
}

// Show detailed statistics modal
function showDetailedStats(statType) {
    const modal = createStatsModal(statType);
    document.body.appendChild(modal);
    
    // Animate modal in
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    const overlay = modal.querySelector('.modal-overlay');
    
    [closeBtn, overlay].forEach(el => {
        el.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    });
}

function createStatsModal(statType) {
    const modal = document.createElement('div');
    modal.className = 'stats-modal';
    
    const titles = {
        'courses_enrolled': 'الدورات المسجلة',
        'study_hours': 'ساعات الدراسة',
        'achievements': 'الإنجازات',
        'points': 'النقاط'
    };
    
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${titles[statType] || 'الإحصائيات'}</h3>
                <button class="close-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="stats-chart-container">
                    <canvas id="statsChart"></canvas>
                </div>
                <div class="stats-details">
                    <p>تفاصيل إضافية حول ${titles[statType]} ستظهر هنا</p>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

// Number animation function
function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (difference * easeOutQuart));
        
        element.textContent = current.toLocaleString('ar');
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Update notification badge
function updateNotificationBadge(count) {
    let badge = document.querySelector('.notification-badge');
    
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-badge';
        const notificationLink = document.querySelector('a[href*="notifications"]');
        if (notificationLink) {
            notificationLink.style.position = 'relative';
            notificationLink.appendChild(badge);
        }
    }
    
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.cssText = `
        position: absolute;
        top: -5px;
        right: -5px;
        background: #FF6F91;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        animation: bounce 0.5s ease;
    `;
}

// Sidebar functionality
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            
            // Add overlay for mobile
            if (window.innerWidth <= 1024) {
                toggleOverlay();
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024 && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target) &&
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                removeOverlay();
            }
        });
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
            removeOverlay();
        }
    });
}

// Theme toggle functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    updateThemeToggleText(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggleText(newTheme);
            
            // Add transition effect
            body.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                body.style.transition = '';
            }, 300);
        });
    }
}

function updateThemeToggleText(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'الوضع الفاتح';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'الوضع الليلي';
        }
    }
}

// Progress bars animation
function initializeProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    // Animate progress bars on load
    setTimeout(() => {
        progressBars.forEach(bar => {
            const progress = bar.getAttribute('data-progress');
            bar.style.width = progress + '%';
        });
    }, 500);

    // Intersection Observer for progress bars
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target.querySelector('.progress-fill');
                if (progressBar) {
                    const progress = progressBar.getAttribute('data-progress');
                    progressBar.style.width = progress + '%';
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.course-item').forEach(item => {
        observer.observe(item);
    });
}

// Initialize animations
function initializeAnimations() {
    // Stagger animation for cards
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    // Floating animation for shapes
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach(shape => {
        const randomDelay = Math.random() * 5;
        const randomDuration = 15 + Math.random() * 10;
        shape.style.animationDelay = randomDelay + 's';
        shape.style.animationDuration = randomDuration + 's';
    });
}

// Interactive elements
function initializeInteractions() {
    // Enroll buttons
    const enrollButtons = document.querySelectorAll('.enroll-btn');
    enrollButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add ripple effect
            createRippleEffect(this, e);
            
            // Show enrollment modal (placeholder)
            showNotification('تم إرسال طلب التسجيل بنجاح!', 'success');
        });
    });

    // Profile update button
    const profileUpdateBtn = document.querySelector('.profile-update-btn');
    if (profileUpdateBtn) {
        profileUpdateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            createRippleEffect(this, e);
            showNotification('سيتم توجيهك لصفحة تحديث الملف الشخصي', 'info');
        });
    }

    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            
            // Add active class to clicked link
            this.parentElement.classList.add('active');
            
            // Show navigation feedback
            const linkText = this.querySelector('span').textContent;
            showNotification(`تم الانتقال إلى ${linkText}`, 'info');
        });
    });

    // Course items hover effect
    const courseItems = document.querySelectorAll('.course-item');
    courseItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(-10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0) scale(1)';
        });
    });

    // Notification items click
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 200);
            
            showNotification('تم فتح الإشعار', 'info');
        });
    });
}

// Utility functions
function toggleOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        overlay.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.remove('active');
            removeOverlay();
        });
    }
}

function removeOverlay() {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

function createRippleEffect(element, event) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.toast-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'toast-notification';
    
    const colors = {
        success: '#21E6C1',
        error: '#FF6F91',
        info: '#276EF1',
        warning: '#FFB400'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${colors[type] || colors.info};
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        text-align: center;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .glass-card {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .sidebar-overlay {
        backdrop-filter: blur(5px);
    }
    
    /* Smooth scrolling */
    html {
        scroll-behavior: smooth;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: var(--sky-blue);
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: var(--primary-sapphire);
        border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: var(--deep-navy);
    }
`;
document.head.appendChild(style);

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized resize handler
const handleResize = debounce(() => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 1024 && sidebar) {
        sidebar.classList.remove('active');
        removeOverlay();
    }
}, 250);

window.addEventListener('resize', handleResize);

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading if needed
initializeLazyLoading();

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key to close sidebar on mobile
    if (e.key === 'Escape') {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            removeOverlay();
        }
    }
    
    // Tab navigation enhancement
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

// Remove keyboard navigation class on mouse use
document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Add keyboard navigation styles
const keyboardStyle = document.createElement('style');
keyboardStyle.textContent = `
    .keyboard-navigation *:focus {
        outline: 2px solid var(--primary-sapphire) !important;
        outline-offset: 2px !important;
    }
`;
document.head.appendChild(keyboardStyle);