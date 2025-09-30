// Shalabiverse Educational Platform JavaScript
// Language switching, animations, and interactive features

// Global variables
let currentLanguage = 'ar';
let currentTestimonial = 0;
let testimonials = [];
let isAnimating = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Load external fonts
    loadFonts();
    
    // Initialize language system
    initializeLanguage();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize testimonials
    initializeTestimonials();
    
    // Initialize FAQ
    initializeFAQ();
    
    // Initialize contact form
    initializeContactForm();
    
    // Initialize scroll effects
    initializeScrollEffects();
    
    // Initialize counters
    initializeCounters();
    
    // Initialize accessibility features
    initializeAccessibility();
    
    console.log('Shalabiverse Educational Platform initialized successfully');
}

// Load External Fonts
function loadFonts() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

// Language System
function initializeLanguage() {
    const langBtn = document.querySelector('.lang-btn');
    const savedLang = localStorage.getItem('shalabiverse-language') || 'ar';
    
    setLanguage(savedLang);
    
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }
}

function toggleLanguage() {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
}

function setLanguage(lang) {
    currentLanguage = lang;
    const html = document.documentElement;
    const body = document.body;
    
    // Set direction and language attributes
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);
    body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    
    // Update language toggle button
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
        const icon = langBtn.querySelector('i');
        const text = langBtn.querySelector('span');
        
        if (lang === 'ar') {
            icon.className = 'fas fa-globe';
            text.textContent = 'English';
        } else {
            icon.className = 'fas fa-globe';
            text.textContent = 'العربية';
        }
    }
    
    // Show/hide language-specific content
    updateContentVisibility(lang);
    
    // Save language preference
    localStorage.setItem('shalabiverse-language', lang);
    
    // Trigger custom event for language change
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function updateContentVisibility(lang) {
    // Hide all language-specific content
    document.querySelectorAll('[data-lang]').forEach(element => {
        element.style.display = 'none';
    });
    
    // Show content for current language
    document.querySelectorAll(`[data-lang="${lang}"]`).forEach(element => {
        element.style.display = '';
    });
    
    // Update placeholders and form labels
    updateFormLabels(lang);
}

function updateFormLabels(lang) {
    const translations = {
        ar: {
            name: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            phone: 'رقم الهاتف',
            service: 'الخدمة المطلوبة',
            message: 'رسالتك',
            submit: 'إرسال الرسالة',
            consultation: 'احجز استشارة مجانية'
        },
        en: {
            name: 'Full Name',
            email: 'Email Address',
            phone: 'Phone Number',
            service: 'Service Needed',
            message: 'Your Message',
            submit: 'Send Message',
            consultation: 'Book Free Consultation'
        }
    };
    
    const t = translations[lang];
    
    // Update form placeholders
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const phoneInput = document.querySelector('input[name="phone"]');
    const messageTextarea = document.querySelector('textarea[name="message"]');
    const submitBtn = document.querySelector('.submit-btn');
    
    if (nameInput) nameInput.placeholder = t.name;
    if (emailInput) emailInput.placeholder = t.email;
    if (phoneInput) phoneInput.placeholder = t.phone;
    if (messageTextarea) messageTextarea.placeholder = t.message;
    if (submitBtn) submitBtn.textContent = t.submit;
    
    // Update CTA buttons
    document.querySelectorAll('.consultation-btn').forEach(btn => {
        btn.textContent = t.consultation;
    });
}

// Navigation System
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Scroll effect for navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // Close mobile menu
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
    
    // Update active navigation link
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Animation System
function initializeAnimations() {
    // Enhanced floating icons
    createFloatingIcons();
    
    // Enhanced typing animation
    initializeEnhancedTypingAnimation();
    
    // Binary rain effect
    initializeBinaryRain();
    
    // Tech particles
    initializeTechParticles();
    
    // Interactive elements
    initializeInteractiveElements();
    
    // IT Concepts animations
    initializeITConceptAnimations();
    
    // Parallax effects
    initializeParallax();
    
    // Code editor simulation
    initializeCodeEditor();
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe all elements with fade-in class
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    console.log('Enhanced animations initialized');
}

function createFloatingIcons() {
    const heroBackground = document.querySelector('.hero-background .floating-elements');
    if (!heroBackground) return;
    
    const icons = ['fas fa-laptop-code', 'fas fa-robot', 'fas fa-shield-alt', 'fas fa-users', 'fas fa-graduation-cap'];
    
    icons.forEach((iconClass, index) => {
        const icon = document.createElement('i');
        icon.className = `floating-icon ${iconClass}`;
        heroBackground.appendChild(icon);
    });
    
    // Add mouse interaction to floating icons
    const floatingElements = document.querySelector('.floating-elements');
    if (!floatingElements) return;
    
    const iconElements = floatingElements.querySelectorAll('.floating-icon');
    iconElements.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.3) rotate(15deg)';
            icon.style.opacity = '0.9';
            icon.style.color = 'var(--cta-emerald)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = '';
            icon.style.opacity = '';
            icon.style.color = '';
        });
    });
}

function initializeEnhancedTypingAnimation() {
    const codeLines = document.querySelectorAll('.code-line');
    const cursor = document.querySelector('.typing-cursor');
    
    if (codeLines.length === 0) return;
    
    let currentLine = 0;
    let currentChar = 0;
    const typingSpeed = 100;
    const lineDelay = 1000;
    
    function typeNextCharacter() {
        if (currentLine >= codeLines.length) {
            // Reset animation
            setTimeout(() => {
                currentLine = 0;
                currentChar = 0;
                codeLines.forEach(line => {
                    line.style.opacity = '0';
                });
                typeNextCharacter();
            }, 3000);
            return;
        }
        
        const line = codeLines[currentLine];
        const fullText = line.innerHTML;
        
        if (currentChar === 0) {
            line.style.opacity = '1';
        }
        
        if (currentChar < fullText.length) {
            // Simulate typing by revealing characters
            line.style.width = `${(currentChar / fullText.length) * 100}%`;
            line.style.overflow = 'hidden';
            currentChar++;
            setTimeout(typeNextCharacter, typingSpeed);
        } else {
            // Move to next line
            line.style.width = '100%';
            currentLine++;
            currentChar = 0;
            setTimeout(typeNextCharacter, lineDelay);
        }
    }
    
    // Start typing animation
    setTimeout(typeNextCharacter, 1000);
}

function initializeBinaryRain() {
    const binaryRain = document.getElementById('binaryRain');
    if (!binaryRain) return;
    
    const binaryChars = ['0', '1'];
    const columns = Math.floor(window.innerWidth / 20);
    
    function createBinaryDigit() {
        const digit = document.createElement('div');
        digit.className = 'binary-digit';
        digit.textContent = binaryChars[Math.floor(Math.random() * binaryChars.length)];
        digit.style.left = Math.random() * 100 + '%';
        digit.style.animationDuration = (Math.random() * 3 + 5) + 's';
        digit.style.animationDelay = Math.random() * 2 + 's';
        
        binaryRain.appendChild(digit);
        
        // Remove digit after animation
        setTimeout(() => {
            if (digit.parentNode) {
                digit.parentNode.removeChild(digit);
            }
        }, 8000);
    }
    
    // Create initial digits
    for (let i = 0; i < 15; i++) {
        setTimeout(() => createBinaryDigit(), i * 200);
    }
    
    // Continue creating digits
    setInterval(createBinaryDigit, 800);
}

function initializeTechParticles() {
    const techParticles = document.getElementById('techParticles');
    if (!techParticles) return;
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'tech-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 8 + 4) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        // Random colors
        const colors = ['var(--accent-mint)', 'var(--cta-emerald)', 'var(--primary-sapphire)', 'var(--accent-orange)'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        techParticles.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 12000);
    }
    
    // Create initial particles
    for (let i = 0; i < 8; i++) {
        setTimeout(() => createParticle(), i * 500);
    }
    
    // Continue creating particles
    setInterval(createParticle, 2000);
}

function initializeInteractiveElements() {
    // Mouse follower effect
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Update floating elements based on mouse position
        const floatingIcons = document.querySelectorAll('.floating-icon');
        floatingIcons.forEach((icon, index) => {
            const rect = icon.getBoundingClientRect();
            const iconX = rect.left + rect.width / 2;
            const iconY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(Math.pow(mouseX - iconX, 2) + Math.pow(mouseY - iconY, 2));
            const maxDistance = 200;
            
            if (distance < maxDistance) {
                const force = (maxDistance - distance) / maxDistance;
                const moveX = (mouseX - iconX) * force * 0.1;
                const moveY = (mouseY - iconY) * force * 0.1;
                
                icon.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + force * 0.2})`;
                icon.style.opacity = 0.3 + force * 0.5;
            } else {
                icon.style.transform = '';
                icon.style.opacity = '';
            }
        });
    });
    
    // Interactive code snippets
    const codeSnippets = document.querySelectorAll('.code-snippet');
    codeSnippets.forEach(snippet => {
        snippet.addEventListener('mouseenter', () => {
            snippet.style.transform = 'scale(1.1) translateY(-5px)';
            snippet.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
        });
        
        snippet.addEventListener('mouseleave', () => {
            snippet.style.transform = '';
            snippet.style.boxShadow = '';
        });
    });
    
    // Circuit node interactions
    const circuitNodes = document.querySelectorAll('.circuit-node');
    circuitNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            node.style.r = '8';
            node.style.opacity = '1';
        });
        
        node.addEventListener('mouseleave', () => {
            node.style.r = '';
            node.style.opacity = '';
        });
    });
}

function initializeCodeEditor() {
    const tabs = document.querySelectorAll('.tab');
    const codeArea = document.querySelector('.code-area');
    
    if (!tabs.length || !codeArea) return;
    
    const codeExamples = {
        'index.html': [
            '<span class="syntax-tag">&lt;html&gt;</span>',
            '<span class="syntax-tag">&lt;head&gt;</span>',
            '<span class="syntax-tag">&lt;title&gt;</span><span class="syntax-string">Shalabiverse</span><span class="syntax-tag">&lt;/title&gt;</span>',
            '<span class="syntax-tag">&lt;/head&gt;</span>',
            '<span class="syntax-tag">&lt;body&gt;</span>',
            '<span class="syntax-tag">&lt;h1&gt;</span><span class="syntax-string">مرحبا بالعالم!</span><span class="syntax-tag">&lt;/h1&gt;</span>',
            '<span class="syntax-tag">&lt;/body&gt;</span>',
            '<span class="syntax-tag">&lt;/html&gt;</span>'
        ],
        'style.css': [
            '<span class="syntax-tag">.hero</span> {',
            '  <span class="syntax-property">background</span>: <span class="syntax-string">linear-gradient(135deg, #4A90E2, #7ED321)</span>;',
            '  <span class="syntax-property">min-height</span>: <span class="syntax-string">100vh</span>;',
            '  <span class="syntax-property">display</span>: <span class="syntax-string">flex</span>;',
            '  <span class="syntax-property">align-items</span>: <span class="syntax-string">center</span>;',
            '}',
            '',
            '<span class="syntax-tag">.floating-icon</span> {'
        ],
        'script.js': [
            '<span class="syntax-keyword">function</span> <span class="syntax-function">initializeApp</span>() {',
            '  <span class="syntax-function">console.log</span>(<span class="syntax-string">\"مرحبا بشلبي فيرس!\"</span>);',
            '  <span class="syntax-keyword">const</span> <span class="syntax-variable">hero</span> = <span class="syntax-function">document.querySelector</span>(<span class="syntax-string">\'.hero\'</span>);',
            '  <span class="syntax-variable">hero</span>.<span class="syntax-property">addEventListener</span>(<span class="syntax-string">\"click\"></span>, () => {',
            '    <span class="syntax-function">alert</span>(<span class="syntax-string">\"تعلم البرمجة ممتع!\"</span>);',
            '  });',
            '}',
            ''
        ]
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Update code content
            const tabName = tab.textContent.trim();
            const code = codeExamples[tabName] || codeExamples['index.html'];
            
            // Clear current content
            codeArea.innerHTML = '';
            
            // Add new content with animation
            code.forEach((line, index) => {
                setTimeout(() => {
                    const lineElement = document.createElement('div');
                    lineElement.className = 'code-line';
                    lineElement.innerHTML = line;
                    codeArea.appendChild(lineElement);
                }, index * 200);
            });
        });
    });
}

// IT Concepts Animation System
function initializeITConceptAnimations() {
    // Initialize data flow animation
    initializeDataFlow();
    
    // Initialize network topology
    initializeNetworkTopology();
    
    // Initialize security visualization
    initializeSecurityVisualization();
    
    // Initialize database operations
    initializeDatabaseOperations();
    
    // Initialize cloud services
    initializeCloudServices();
    
    console.log('IT concept animations initialized');
}

function initializeDataFlow() {
    const dataFlowContainer = document.querySelector('.data-flow-container');
    if (!dataFlowContainer) return;
    
    const dataPackets = dataFlowContainer.querySelector('.data-packets');
    if (!dataPackets) return;
    
    // Create animated data packets
    function createDataPacket() {
        const packet = document.createElement('div');
        packet.className = 'data-packet';
        
        // Random starting position around server
        const angle = Math.random() * 2 * Math.PI;
        const radius = 30;
        const serverX = 150; // Center of container
        const serverY = 60;
        
        packet.style.left = (serverX + Math.cos(angle) * radius) + 'px';
        packet.style.top = (serverY + Math.sin(angle) * radius) + 'px';
        
        // Random client destination
        const clients = [20, 150, 280]; // Client positions
        const targetX = clients[Math.floor(Math.random() * clients.length)];
        const targetY = 160;
        
        packet.style.setProperty('--target-x', targetX + 'px');
        packet.style.setProperty('--target-y', targetY + 'px');
        
        dataPackets.appendChild(packet);
        
        // Remove packet after animation
        setTimeout(() => {
            if (packet.parentNode) {
                packet.parentNode.removeChild(packet);
            }
        }, 2000);
    }
    
    // Create packets at intervals
    setInterval(createDataPacket, 800);
}

function initializeNetworkTopology() {
    const networkTopology = document.querySelector('.network-topology');
    if (!networkTopology) return;
    
    const svg = networkTopology.querySelector('.topology-svg');
    if (!svg) return;
    
    // Add interactive hover effects to network nodes
    const networkNodes = svg.querySelectorAll('.network-node');
    networkNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            // Highlight connected lines
            const nodeId = node.getAttribute('data-node-id');
            const connectedLines = svg.querySelectorAll(`[data-connects*="${nodeId}"]`);
            connectedLines.forEach(line => {
                line.style.stroke = 'var(--cta-emerald)';
                line.style.strokeWidth = '3';
            });
        });
        
        node.addEventListener('mouseleave', () => {
            // Reset line styles
            const lines = svg.querySelectorAll('.connection-line');
            lines.forEach(line => {
                line.style.stroke = '';
                line.style.strokeWidth = '';
            });
        });
    });
}

function initializeSecurityVisualization() {
    const securityViz = document.querySelector('.security-visualization');
    if (!securityViz) return;
    
    const threatIndicators = securityViz.querySelector('.threat-indicators');
    if (!threatIndicators) return;
    
    const threats = [
        { icon: 'fas fa-bug', text: 'Malware Blocked' },
        { icon: 'fas fa-user-secret', text: 'Intrusion Detected' },
        { icon: 'fas fa-lock', text: 'Data Encrypted' },
        { icon: 'fas fa-shield-alt', text: 'Firewall Active' }
    ];
    
    let currentThreat = 0;
    
    function showNextThreat() {
        threatIndicators.innerHTML = '';
        
        const threat = threats[currentThreat];
        const threatElement = document.createElement('div');
        threatElement.className = 'threat';
        threatElement.innerHTML = `
            <i class="${threat.icon}"></i>
            <span>${threat.text}</span>
        `;
        
        threatIndicators.appendChild(threatElement);
        
        currentThreat = (currentThreat + 1) % threats.length;
    }
    
    // Show threats at intervals
    setInterval(showNextThreat, 3000);
    showNextThreat(); // Show first threat immediately
}

function initializeDatabaseOperations() {
    const dbViz = document.querySelector('.database-visualization');
    if (!dbViz) return;
    
    const operations = dbViz.querySelectorAll('.db-operation');
    
    // Add click interactions to database operations
    operations.forEach(operation => {
        operation.addEventListener('click', () => {
            // Highlight the operation
            operation.style.background = 'var(--cta-emerald)';
            operation.style.color = 'white';
            operation.style.transform = 'scale(1.1)';
            
            // Reset after animation
            setTimeout(() => {
                operation.style.background = '';
                operation.style.color = '';
                operation.style.transform = '';
            }, 1000);
        });
    });
}

function initializeCloudServices() {
    const cloudViz = document.querySelector('.cloud-visualization');
    if (!cloudViz) return;
    
    const serviceNodes = cloudViz.querySelectorAll('.service-node');
    
    // Add hover effects to service nodes
    serviceNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'translateY(-10px) scale(1.2)';
            node.style.color = 'var(--cta-emerald)';
            
            // Add glow effect
            node.style.textShadow = '0 0 15px var(--cta-emerald)';
        });
        
        node.addEventListener('mouseleave', () => {
            node.style.transform = '';
            node.style.color = '';
            node.style.textShadow = '';
        });
    });
    
    // Simulate cloud data sync
    function simulateDataSync() {
        serviceNodes.forEach((node, index) => {
            setTimeout(() => {
                node.style.color = 'var(--vivid-emerald)';
                node.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    node.style.color = '';
                    node.style.transform = '';
                }, 500);
            }, index * 200);
        });
    }
    
    // Run sync animation every 8 seconds
    setInterval(simulateDataSync, 8000);
}

function initializeTypingAnimation() {
    const codeLines = document.querySelectorAll('.code-line');
    
    codeLines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.5}s`;
    });
}

function initializeParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-icon');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
        });
    });
}

// Testimonials System
function initializeTestimonials() {
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.testimonial-btn.prev');
    const nextBtn = document.querySelector('.testimonial-btn.next');
    const dots = document.querySelectorAll('.dot');
    
    if (testimonialCards.length === 0) return;
    
    testimonials = Array.from(testimonialCards);
    
    // Show first testimonial
    showTestimonial(0);
    
    // Previous button
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (!isAnimating) {
                previousTestimonial();
            }
        });
    }
    
    // Next button
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (!isAnimating) {
                nextTestimonial();
            }
        });
    }
    
    // Dots navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isAnimating && index !== currentTestimonial) {
                showTestimonial(index);
            }
        });
    });
    
    // Auto-slide every 5 seconds
    setInterval(() => {
        if (!isAnimating) {
            nextTestimonial();
        }
    }, 5000);
    
    // Touch/swipe support
    initializeTestimonialSwipe();
}

function showTestimonial(index) {
    if (isAnimating) return;
    
    isAnimating = true;
    
    // Hide current testimonial
    testimonials[currentTestimonial].classList.remove('active');
    
    // Update current index
    currentTestimonial = index;
    
    // Show new testimonial
    setTimeout(() => {
        testimonials[currentTestimonial].classList.add('active');
        updateTestimonialDots();
        isAnimating = false;
    }, 300);
}

function nextTestimonial() {
    const nextIndex = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(nextIndex);
}

function previousTestimonial() {
    const prevIndex = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    showTestimonial(prevIndex);
}

function updateTestimonialDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentTestimonial);
    });
}

function initializeTestimonialSwipe() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;
    
    let startX = 0;
    let endX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    slider.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                nextTestimonial();
            } else {
                previousTestimonial();
            }
        }
    }
}

// FAQ System
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Contact Form System
function initializeContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;
    
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    const submitBtn = contactForm.querySelector('.submit-btn');
    
    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
    
    // Form submission
    contactForm.addEventListener('submit', handleFormSubmission);
    
    // Service selection updates
    const serviceSelect = contactForm.querySelector('select[name="service"]');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', updateServiceDescription);
    }
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous errors
    clearFieldError(field);
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = currentLanguage === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    }
    
    // Email validation
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = currentLanguage === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address';
        }
    }
    
    // Phone validation
    if (fieldName === 'phone' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = currentLanguage === 'ar' ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number';
        }
    }
    
    // Show error if validation failed
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function handleFormSubmission(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input, select, textarea');
    const submitBtn = form.querySelector('.submit-btn');
    
    let isFormValid = true;
    
    // Validate all fields
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = currentLanguage === 'ar' ? 
        '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...' : 
        '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Simulate form submission
    setTimeout(() => {
        // Show success message
        showFormSuccess();
        
        // Reset form
        form.reset();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }, 2000);
}

function showFormSuccess() {
    const message = currentLanguage === 'ar' ? 
        'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 
        'Your message has been sent successfully! We will contact you soon.';
    
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--cta-emerald);
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function updateServiceDescription(e) {
    const selectedService = e.target.value;
    const descriptions = {
        ar: {
            'web-development': 'تطوير مواقع ويب وتطبيقات جوال احترافية',
            'it-infrastructure': 'حلول البنية التحتية وأمان المعلومات',
            'coding-training': 'دورات البرمجة والذكاء الاصطناعي',
            'workshops': 'ورش عملية للأطفال والكبار'
        },
        en: {
            'web-development': 'Professional website and mobile app development',
            'it-infrastructure': 'IT infrastructure and security solutions',
            'coding-training': 'Coding and AI training courses',
            'workshops': 'Practical workshops for kids and adults'
        }
    };
    
    // Update service description if element exists
    const descElement = document.querySelector('.service-description');
    if (descElement && descriptions[currentLanguage][selectedService]) {
        descElement.textContent = descriptions[currentLanguage][selectedService];
    }
}

// Scroll Effects
function initializeScrollEffects() {
    // Smooth scroll for all anchor links
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
    
    // Scroll to top button
    createScrollToTopButton();
}

function createScrollToTopButton() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollBtn.setAttribute('aria-label', 'Scroll to top');
    
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: var(--primary-sapphire);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: var(--transition);
        z-index: 1000;
        box-shadow: var(--shadow);
    `;
    
    document.body.appendChild(scrollBtn);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.style.opacity = '1';
            scrollBtn.style.visibility = 'visible';
        } else {
            scrollBtn.style.opacity = '0';
            scrollBtn.style.visibility = 'hidden';
        }
    });
    
    // Scroll to top functionality
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Counter Animation
function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Accessibility Features
function initializeAccessibility() {
    // Keyboard navigation
    initializeKeyboardNavigation();
    
    // Focus management
    initializeFocusManagement();
    
    // Screen reader announcements
    initializeScreenReaderSupport();
    
    // High contrast mode detection
    detectHighContrastMode();
}

function initializeKeyboardNavigation() {
    // Tab navigation for custom elements
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target;
            
            // Handle FAQ items
            if (target.classList.contains('faq-question')) {
                e.preventDefault();
                target.click();
            }
            
            // Handle testimonial controls
            if (target.classList.contains('dot')) {
                e.preventDefault();
                target.click();
            }
        }
        
        // Escape key to close mobile menu
        if (e.key === 'Escape') {
            const navMenu = document.querySelector('.nav-menu');
            const navToggle = document.querySelector('.nav-toggle');
            
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.focus();
            }
        }
    });
}

function initializeFocusManagement() {
    // Trap focus in mobile menu when open
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            setTimeout(() => {
                if (navMenu.classList.contains('active')) {
                    const firstLink = navMenu.querySelector('.nav-link');
                    if (firstLink) firstLink.focus();
                }
            }, 100);
        });
    }
}

function initializeScreenReaderSupport() {
    // Add ARIA labels and descriptions
    const langBtn = document.querySelector('.lang-btn');
    if (langBtn) {
        langBtn.setAttribute('aria-label', 'Toggle language');
    }
    
    // Update ARIA labels based on language
    document.addEventListener('languageChanged', (e) => {
        updateAriaLabels(e.detail.language);
    });
}

function updateAriaLabels(lang) {
    const labels = {
        ar: {
            menu: 'القائمة الرئيسية',
            close: 'إغلاق',
            next: 'التالي',
            previous: 'السابق',
            submit: 'إرسال'
        },
        en: {
            menu: 'Main menu',
            close: 'Close',
            next: 'Next',
            previous: 'Previous',
            submit: 'Submit'
        }
    };
    
    const l = labels[lang];
    
    // Update navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.setAttribute('aria-label', l.menu);
    }
    
    // Update testimonial controls
    const prevBtn = document.querySelector('.testimonial-btn.prev');
    const nextBtn = document.querySelector('.testimonial-btn.next');
    
    if (prevBtn) prevBtn.setAttribute('aria-label', l.previous);
    if (nextBtn) nextBtn.setAttribute('aria-label', l.next);
}

function detectHighContrastMode() {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
    }
}

// Utility Functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance optimization
const debouncedResize = debounce(() => {
    // Handle resize events
    updateLayout();
}, 250);

const throttledScroll = throttle(() => {
    // Handle scroll events
    updateScrollEffects();
}, 16);

window.addEventListener('resize', debouncedResize);
window.addEventListener('scroll', throttledScroll);

function updateLayout() {
    // Update layout calculations on resize
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile', isMobile);
}

function updateScrollEffects() {
    // Update scroll-based effects
    const scrolled = window.pageYOffset;
    document.documentElement.style.setProperty('--scroll-y', scrolled + 'px');
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('Shalabiverse Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setLanguage,
        validateField,
        animateCounter
    };
}