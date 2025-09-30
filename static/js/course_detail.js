// Course Detail Page JavaScript

// Modal functionality
function showEnrollmentForm() {
    const modal = document.getElementById('enrollmentModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeEnrollmentForm() {
    const modal = document.getElementById('enrollmentModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('enrollmentModal');
    if (event.target === modal) {
        closeEnrollmentForm();
    }
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeEnrollmentForm();
    }
});

// Enrollment form submission
document.getElementById('enrollmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        message: formData.get('message'),
        course_id: window.location.pathname.split('/').pop()
    };
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'جاري الإرسال...';
    submitBtn.disabled = true;
    
    // Send enrollment request
    fetch('/enroll-request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            showNotification('تم إرسال طلب التسجيل بنجاح! سنتواصل معك قريباً.', 'success');
            closeEnrollmentForm();
            this.reset();
        } else {
            showNotification('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.', 'error');
    })
    .finally(() => {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
});

// Preview lesson functionality
function previewLesson(lessonId) {
    // For now, show a simple alert. In a real implementation, 
    // this would open a lesson player modal or redirect to a lesson page
    showNotification('سيتم فتح مشغل الدرس قريباً...', 'info');
    
    // TODO: Implement lesson player
    // This could open a modal with video player, or redirect to a lesson page
    // Example: window.open(`/lesson/${lessonId}/preview`, '_blank');
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 1001;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
        border-radius: 8px;
        padding: 15px 20px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        .notification-close:hover {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Module collapse/expand functionality (optional enhancement)
document.querySelectorAll('.module-header').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function() {
        const moduleItem = this.parentElement;
        const lessonsList = moduleItem.querySelector('.lessons-list');
        
        if (lessonsList.style.display === 'none') {
            lessonsList.style.display = 'block';
            this.classList.remove('collapsed');
        } else {
            lessonsList.style.display = 'none';
            this.classList.add('collapsed');
        }
    });
});

// Add loading states for buttons
document.querySelectorAll('.btn-preview').forEach(button => {
    button.addEventListener('click', function() {
        const originalText = this.textContent;
        this.textContent = 'جاري التحميل...';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = originalText;
            this.disabled = false;
        }, 2000);
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe content cards for animation
document.querySelectorAll('.content-card, .module-item').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code here
    console.log('Course detail page loaded');
    
    // Check if user is enrolled and update UI accordingly
    const enrolledStatus = document.querySelector('.enrolled-status');
    if (enrolledStatus) {
        // User is enrolled, maybe fetch progress data
        console.log('User is enrolled in this course');
    }
    
    // Add click tracking for analytics (optional)
    document.querySelectorAll('.btn-preview, .btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            // Track button clicks for analytics
            const action = this.textContent.trim();
            console.log(`Button clicked: ${action}`);
            // You can send this data to your analytics service
        });
    });
});