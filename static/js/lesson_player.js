// Lesson Player JavaScript

// Complete lesson function
function completeLesson(lessonId) {
    const button = document.querySelector('.complete-btn');
    if (!button) return;

    // Show loading state
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

    fetch(`/lesson/${lessonId}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update button to completed state
            button.className = 'completed-btn';
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> تم إكمال الدرس';
            
            // Update progress bar if exists
            const progressFill = document.querySelector('.progress-fill');
            const progressPercentage = document.querySelector('.progress-percentage');
            if (progressFill && progressPercentage && data.progress !== undefined) {
                progressFill.style.width = data.progress + '%';
                progressPercentage.textContent = data.progress + '%';
            }

            // Show success notification
            showNotification(data.message, 'success');

            // Update lesson status in sidebar
            updateLessonStatus(lessonId, true);
        } else {
            // Reset button state
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-check"></i> إكمال الدرس';
            
            // Show error notification
            showNotification(data.message || 'حدث خطأ أثناء إكمال الدرس', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        
        // Reset button state
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check"></i> إكمال الدرس';
        
        // Show error notification
        showNotification('حدث خطأ في الاتصال', 'error');
    });
}

// Update lesson status in sidebar
function updateLessonStatus(lessonId, completed) {
    const lessonItems = document.querySelectorAll('.lesson-item');
    lessonItems.forEach(item => {
        const link = item.querySelector('.lesson-link');
        if (link && link.href.includes(`/lesson/${lessonId}`)) {
            const statusIcon = item.querySelector('.lesson-status i');
            if (statusIcon && completed) {
                statusIcon.className = 'fas fa-check-circle completed';
            }
        }
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Video player enhancements
document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.lesson-video');
    
    if (video && video.tagName === 'VIDEO') {
        // Track video progress
        video.addEventListener('timeupdate', function() {
            const progress = (video.currentTime / video.duration) * 100;
            // You can add progress tracking logic here
        });

        // Auto-complete lesson when video ends (for enrolled users)
        video.addEventListener('ended', function() {
            const completeBtn = document.querySelector('.complete-btn');
            if (completeBtn && !completeBtn.disabled) {
                // Optional: Auto-complete lesson when video ends
                // completeLesson(lessonId);
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (video && video.tagName === 'VIDEO') {
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case 'f':
                    e.preventDefault();
                    if (video.requestFullscreen) {
                        video.requestFullscreen();
                    }
                    break;
            }
        }
    });

    // Smooth scrolling for lesson navigation
    const lessonLinks = document.querySelectorAll('.lesson-link:not(.locked)');
    lessonLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Add loading state or transition effect if needed
        });
    });

    // Initialize progress bars
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
});

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function updateVideoProgress(video) {
    if (!video) return;
    
    const currentTime = formatTime(video.currentTime);
    const duration = formatTime(video.duration);
    
    // Update time display if elements exist
    const timeDisplay = document.querySelector('.video-time');
    if (timeDisplay) {
        timeDisplay.textContent = `${currentTime} / ${duration}`;
    }
}

// Export functions for global access
window.completeLesson = completeLesson;
window.showNotification = showNotification;