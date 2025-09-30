from datetime import datetime, timedelta
import secrets
import os
import re
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from security_utils import rate_limit, SessionManager, init_security_headers, log_security_event

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Flask app configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)  # Session timeout
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

db = SQLAlchemy(app)

# Initialize security headers
init_security_headers(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expires = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_reset_token(self):
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        return self.reset_token
    
    def verify_reset_token(self, token):
        return (self.reset_token == token and 
                self.reset_token_expires and 
                self.reset_token_expires > datetime.utcnow())
    
    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expires = None
    
    def __repr__(self):
        return f'<User {self.username}>'

# Custom Validators
def validate_password_strength(form, field):
    password = field.data
    if len(password) < 8:
        raise ValidationError('Password must be at least 8 characters long.')
    if not re.search(r'[A-Z]', password):
        raise ValidationError('Password must contain at least one uppercase letter.')
    if not re.search(r'[a-z]', password):
        raise ValidationError('Password must contain at least one lowercase letter.')
    if not re.search(r'[0-9]', password):
        raise ValidationError('Password must contain at least one number.')

def validate_username_format(form, field):
    username = field.data
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError('Username can only contain letters, numbers, and underscores.')

# Forms
class RegistrationForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[
        DataRequired(message='اسم المستخدم مطلوب.'),
        Length(min=4, max=20, message='اسم المستخدم يجب أن يكون بين 4 و 20 حرف.'),
        validate_username_format
    ])
    email = StringField('البريد الإلكتروني', validators=[
        DataRequired(message='البريد الإلكتروني مطلوب.'),
        Email(message='يرجى إدخال بريد إلكتروني صحيح.')
    ])
    password = PasswordField('كلمة المرور', validators=[
        DataRequired(message='كلمة المرور مطلوبة.'),
        validate_password_strength
    ])
    password2 = PasswordField('تأكيد كلمة المرور', validators=[
        DataRequired(message='يرجى تأكيد كلمة المرور.'),
        EqualTo('password', message='كلمات المرور يجب أن تتطابق.')
    ])
    submit = SubmitField('إنشاء حساب')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already exists. Please choose a different one.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email address already registered. Please use a different email.')

class LoginForm(FlaskForm):
    username = StringField('اسم المستخدم أو البريد الإلكتروني', validators=[
        DataRequired(message='اسم المستخدم أو البريد الإلكتروني مطلوب.')
    ])
    password = PasswordField('كلمة المرور', validators=[
        DataRequired(message='كلمة المرور مطلوبة.')
    ])
    remember_me = BooleanField('تذكرني')
    submit = SubmitField('تسجيل الدخول')

class ForgotPasswordForm(FlaskForm):
    email = StringField('البريد الإلكتروني', validators=[
        DataRequired(message='البريد الإلكتروني مطلوب.'),
        Email(message='يرجى إدخال بريد إلكتروني صحيح.')
    ])
    submit = SubmitField('إرسال رابط إعادة التعيين')

class ResetPasswordForm(FlaskForm):
    password = PasswordField('كلمة المرور الجديدة', validators=[
        DataRequired(message='كلمة المرور مطلوبة.'),
        validate_password_strength
    ])
    password2 = PasswordField('تأكيد كلمة المرور الجديدة', validators=[
        DataRequired(message='يرجى تأكيد كلمة المرور.'),
        EqualTo('password', message='كلمات المرور يجب أن تتطابق.')
    ])
    submit = SubmitField('إعادة تعيين كلمة المرور')

# Helper Functions
def get_user_by_username_or_email(username_or_email):
    """Get user by username or email"""
    return User.query.filter(
        (User.username == username_or_email) | (User.email == username_or_email)
    ).first()

def get_user_stats(user):
    """Get user statistics for dashboard"""
    return {
        'courses_enrolled': 5,  # Mock data - replace with actual queries
        'achievements': 12,
        'study_hours': 48,
        'points': 2450
    }

def get_recent_activities(user):
    """Get recent user activities"""
    # Mock data - replace with actual activity tracking
    return [
        {
            'icon': 'fa-book-open',
            'description': 'Completed Python Fundamentals course',
            'timestamp': '2 hours ago'
        },
        {
            'icon': 'fa-trophy',
            'description': 'Earned "Quick Learner" badge',
            'timestamp': '1 day ago'
        },
        {
            'icon': 'fa-code',
            'description': 'Submitted first coding project',
            'timestamp': '3 days ago'
        }
    ]

# Session Management
class CurrentUser:
    def __init__(self, user_id=None):
        self.user_id = user_id
        self._user = None
    
    @property
    def is_authenticated(self):
        return self.user_id is not None
    
    @property
    def user(self):
        if self.user_id and not self._user:
            self._user = User.query.get(self.user_id)
        return self._user
    
    @property
    def username(self):
        return self.user.username if self.user else None
    
    @property
    def email(self):
        return self.user.email if self.user else None
    
    @property
    def created_at(self):
        return self.user.created_at if self.user else None

def get_current_user():
    user_id = session.get('user_id')
    return CurrentUser(user_id)

# Routes
@app.route('/')
def index():
    if 'user_id' in session and SessionManager.is_session_valid():
        return redirect(url_for('dashboard'))
    return render_template("./index.html")

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        try:
            user = User(
                username=form.username.data,
                email=form.email.data.lower() if form.email.data else ''
            )
            user.set_password(form.password.data)
            
            db.session.add(user)
            db.session.commit()
            
            flash('Registration successful! You can now sign in.', 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            db.session.rollback()
            flash('An error occurred during registration. Please try again.', 'error')
            app.logger.error(f'Registration error: {str(e)}')
    
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = get_user_by_username_or_email(form.username.data)
        
        if user and user.check_password(form.password.data):
            if user.is_active:
                SessionManager.create_session(user.id, form.remember_me.data)
                user.last_login = datetime.utcnow()
                db.session.commit()
                
                flash('Login successful!', 'success')
                next_page = request.args.get('next')
                return redirect(next_page) if next_page else redirect(url_for('dashboard'))
            else:
                flash('Your account has been deactivated. Please contact support.', 'error')
        else:
            log_security_event('failed_login_attempt', f'Failed login for username: {form.username.data}')
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html', form=form)

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session or not SessionManager.is_session_valid():
        flash('Please log in to access the dashboard.', 'error')
        return redirect(url_for('login'))
    
    current_user = get_current_user()
    
    user_stats = get_user_stats(current_user.user)
    recent_activities = get_recent_activities(current_user.user)
    
    return render_template('dashboard.html', 
                         current_user=current_user,
                         user_stats=user_stats,
                         recent_activities=recent_activities)

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.lower() if form.email.data else '').first()
        
        if user:
            token = user.generate_reset_token()
            db.session.commit()
            
            # In production, send email with reset link
            # For now, just show success message
            flash('Password reset instructions have been sent to your email.', 'info')
            app.logger.info(f'Password reset token for {user.email}: {token}')
        else:
            # Don't reveal if email exists or not for security
            flash('If that email address is in our system, you will receive reset instructions.', 'info')
        
        return redirect(url_for('login'))
    
    return render_template('forgot_password.html', form=form)

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or not user.verify_reset_token(token):
        flash('Invalid or expired reset token.', 'error')
        return redirect(url_for('forgot_password'))
    
    form = ResetPasswordForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        user.clear_reset_token()
        db.session.commit()
        
        flash('Your password has been reset successfully. You can now sign in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('reset_password.html', form=form)

@app.route('/logout')
def logout():
    if 'user_id' in session:
        SessionManager.destroy_session()
        flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

# Database initialization
def init_db():
    """Initialize database tables"""
    with app.app_context():
        db.create_all()

if __name__ == '__main__':
    init_db()
    app.run(debug=True)