"""
Security utilities for Flask authentication system
"""
import time
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify, session, current_app, redirect, url_for
import hashlib
import hmac

class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self):
        self.requests = defaultdict(deque)
        self.blocked_ips = defaultdict(float)
    
    def is_allowed(self, identifier, max_requests=5, window_seconds=300, block_duration=900):
        """
        Check if request is allowed based on rate limiting
        
        Args:
            identifier: IP address or user identifier
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds (default: 5 minutes)
            block_duration: Block duration in seconds (default: 15 minutes)
        """
        current_time = time.time()
        
        # Check if IP is currently blocked
        if identifier in self.blocked_ips:
            if current_time < self.blocked_ips[identifier]:
                return False
            else:
                # Unblock IP
                del self.blocked_ips[identifier]
        
        # Clean old requests
        request_times = self.requests[identifier]
        while request_times and request_times[0] < current_time - window_seconds:
            request_times.popleft()
        
        # Check if limit exceeded
        if len(request_times) >= max_requests:
            # Block IP
            self.blocked_ips[identifier] = current_time + block_duration
            return False
        
        # Add current request
        request_times.append(current_time)
        return True
    
    def get_remaining_requests(self, identifier, max_requests=5, window_seconds=300):
        """Get remaining requests for identifier"""
        current_time = time.time()
        request_times = self.requests[identifier]
        
        # Clean old requests
        while request_times and request_times[0] < current_time - window_seconds:
            request_times.popleft()
        
        return max(0, max_requests - len(request_times))

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(max_requests=5, window_seconds=300, block_duration=900):
    """
    Rate limiting decorator
    
    Args:
        max_requests: Maximum requests allowed in window
        window_seconds: Time window in seconds
        block_duration: Block duration in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Use IP address as identifier
            identifier = get_client_ip()
            
            if not rate_limiter.is_allowed(identifier, max_requests, window_seconds, block_duration):
                return jsonify({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'retry_after': block_duration
                }), 429
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_client_ip():
    """Get client IP address, considering proxies"""
    x_forwarded_for = request.headers.get('X-Forwarded-For')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def generate_csrf_token():
    """Generate CSRF token"""
    if 'csrf_token' not in session:
        session['csrf_token'] = hashlib.sha256(
            f"{session.get('user_id', '')}{time.time()}".encode()
        ).hexdigest()
    return session['csrf_token']

def validate_csrf_token(token):
    """Validate CSRF token"""
    return token and session.get('csrf_token') == token

def secure_compare(a, b):
    """Secure string comparison to prevent timing attacks"""
    if len(a) != len(b):
        return False
    return hmac.compare_digest(a, b)

def log_security_event(event_type, details, user_id=None):
    """Log security events (in production, this would go to a proper logging system)"""
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    ip_address = get_client_ip()
    user_agent = request.headers.get('User-Agent', 'Unknown')
    
    log_entry = {
        'timestamp': timestamp,
        'event_type': event_type,
        'details': details,
        'user_id': user_id,
        'ip_address': ip_address,
        'user_agent': user_agent
    }
    
    # In production, send this to your logging system
    print(f"SECURITY EVENT: {log_entry}")

def check_password_strength(password):
    """
    Check password strength and return score and feedback
    
    Returns:
        dict: {'score': int, 'feedback': list, 'is_strong': bool}
    """
    score = 0
    feedback = []
    
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Password should be at least 8 characters long")
    
    if any(c.isupper() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one uppercase letter")
    
    if any(c.islower() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one lowercase letter")
    
    if any(c.isdigit() for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one number")
    
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        score += 1
    else:
        feedback.append("Password should contain at least one special character")
    
    # Check for common patterns
    common_patterns = ['123', 'abc', 'password', 'admin', 'user']
    if any(pattern in password.lower() for pattern in common_patterns):
        score -= 1
        feedback.append("Password should not contain common patterns")
    
    return {
        'score': max(0, score),
        'feedback': feedback,
        'is_strong': score >= 4
    }

def sanitize_input(input_string, max_length=255):
    """Sanitize user input"""
    if not input_string:
        return ""
    
    # Remove null bytes and control characters
    sanitized = ''.join(char for char in input_string if ord(char) >= 32 or char in '\t\n\r')
    
    # Limit length
    return sanitized[:max_length].strip()

def is_safe_redirect_url(url):
    """Check if redirect URL is safe (prevents open redirect attacks)"""
    if not url:
        return False
    
    # Only allow relative URLs or URLs to the same domain
    if url.startswith('/') and not url.startswith('//'):
        return True
    
    # In production, you might want to check against allowed domains
    return False

class SessionManager:
    """Manage user sessions with security features"""
    
    @staticmethod
    def create_session(user_id, remember_me=False):
        """Create a new user session"""
        session.permanent = remember_me
        session['user_id'] = user_id
        session['login_time'] = time.time()
        session['last_activity'] = time.time()
        
        # Generate session token for additional security
        session['session_token'] = hashlib.sha256(
            f"{user_id}{time.time()}".encode()
        ).hexdigest()
        
        log_security_event('user_login', f'User {user_id} logged in', user_id)
    
    @staticmethod
    def update_activity():
        """Update last activity timestamp"""
        if 'user_id' in session:
            session['last_activity'] = time.time()
    
    @staticmethod
    def is_session_valid():
        """Check if current session is valid"""
        if 'user_id' not in session:
            return False
        
        # Check session timeout
        last_activity = session.get('last_activity', 0)
        timeout = current_app.config.get('PERMANENT_SESSION_LIFETIME', 3600)
        
        if isinstance(timeout, int):
            timeout_seconds = timeout
        else:
            timeout_seconds = timeout.total_seconds()
        
        if time.time() - last_activity > timeout_seconds:
            SessionManager.destroy_session()
            return False
        
        return True
    
    @staticmethod
    def destroy_session():
        """Destroy current session"""
        user_id = session.get('user_id')
        if user_id:
            log_security_event('user_logout', f'User {user_id} logged out', user_id)
        
        session.clear()
    
    @staticmethod
    def require_login(f):
        """Decorator to require valid login"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not SessionManager.is_session_valid():
                return redirect(url_for('login'))
            
            SessionManager.update_activity()
            return f(*args, **kwargs)
        return decorated_function

def init_security_headers(app):
    """Initialize security headers for the Flask app"""
    
    @app.after_request
    def set_security_headers(response):
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (basic)
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "font-src 'self' https://cdnjs.cloudflare.com; "
            "img-src 'self' data:; "
            "connect-src 'self';"
        )
        
        return response