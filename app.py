from datetime import datetime, timedelta
import secrets
import os
import re
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from security_utils import rate_limit, SessionManager, init_security_headers, log_security_event
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

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
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'  # Enable in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Production-specific configurations
if os.environ.get('FLASK_ENV') == 'production':
    app.config['DEBUG'] = False
    app.config['TESTING'] = False
else:
    app.config['DEBUG'] = True

db = SQLAlchemy(app)

# Initialize security headers
init_security_headers(app)

# Initialize Flask-Admin
admin = Admin(app, name='Shalabiverse Admin', template_mode='bootstrap3')

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
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    
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

# Course Models
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title_ar = db.Column(db.String(200), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    description_ar = db.Column(db.Text, nullable=False)
    description_en = db.Column(db.Text, nullable=False)
    what_you_learn_ar = db.Column(db.Text, nullable=False)
    what_you_learn_en = db.Column(db.Text, nullable=False)
    target_audience_ar = db.Column(db.Text, nullable=False)
    target_audience_en = db.Column(db.Text, nullable=False)
    requirements_ar = db.Column(db.Text, nullable=False)
    requirements_en = db.Column(db.Text, nullable=False)
    instructor_name_ar = db.Column(db.String(100), nullable=False)
    instructor_name_en = db.Column(db.String(100), nullable=False)
    instructor_bio_ar = db.Column(db.Text, nullable=False)
    instructor_bio_en = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)
    duration_hours = db.Column(db.Integer, nullable=False)
    level = db.Column(db.String(20), nullable=False)  # beginner, intermediate, advanced
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    modules = db.relationship('Module', backref='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True)

class Module(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    title_ar = db.Column(db.String(200), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    description_ar = db.Column(db.Text)
    description_en = db.Column(db.Text)
    order_index = db.Column(db.Integer, nullable=False)
    
    # Relationships
    lessons = db.relationship('Lesson', backref='module', lazy=True, cascade='all, delete-orphan')

class Lesson(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('module.id'), nullable=False)
    title_ar = db.Column(db.String(200), nullable=False)
    title_en = db.Column(db.String(200), nullable=False)
    content_ar = db.Column(db.Text)
    content_en = db.Column(db.Text)
    video_url = db.Column(db.String(300))
    duration_minutes = db.Column(db.Integer, nullable=False, default=0)
    order_index = db.Column(db.Integer, nullable=False)
    is_free = db.Column(db.Boolean, default=False)
    
    # Relationships
    progress = db.relationship('LessonProgress', backref='lesson', lazy=True)

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    progress_percentage = db.Column(db.Float, default=0.0)
    last_accessed = db.Column(db.DateTime)
    
    # Relationships
    lesson_progress = db.relationship('LessonProgress', backref='enrollment', lazy=True)

class LessonProgress(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    enrollment_id = db.Column(db.Integer, db.ForeignKey('enrollment.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    watch_time_seconds = db.Column(db.Integer, default=0)

# Enrollment Request Model (for simple form submissions)
class EnrollmentRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    message = db.Column(db.Text)
    status = db.Column(db.String(20), default='pending')  # pending, contacted, enrolled, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    course_ref = db.relationship('Course', backref='enrollment_requests')

# Flask-Admin Model Views
admin.add_view(ModelView(User, db.session, name='Users'))
admin.add_view(ModelView(Course, db.session, name='Courses'))
admin.add_view(ModelView(Module, db.session, name='Modules'))
admin.add_view(ModelView(Lesson, db.session, name='Lessons'))
admin.add_view(ModelView(Enrollment, db.session, name='Enrollments'))
admin.add_view(ModelView(LessonProgress, db.session, name='Lesson Progress'))
admin.add_view(ModelView(EnrollmentRequest, db.session, name='Enrollment Requests'))

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
            error_msg = str(e)
            
            # Handle specific database errors
            if 'UNIQUE constraint failed: user.username' in error_msg:
                flash('Username already exists. Please choose a different username.', 'error')
            elif 'UNIQUE constraint failed: user.email' in error_msg:
                flash('Email already exists. Please use a different email address.', 'error')
            else:
                flash('An error occurred during registration. Please try again.', 'error')
                app.logger.error(f'Registration error: {error_msg}')
    
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

@app.route('/courses')
def courses():
    """Course catalog page"""
    current_user = get_current_user()
    courses = Course.query.filter_by(is_active=True).all()
    return render_template('courses.html', courses=courses, current_user=current_user)

@app.route('/course/<int:course_id>')
def course_detail(course_id):
    """Course detail page"""
    current_user = get_current_user()
    course = Course.query.get_or_404(course_id)
    
    # Get course modules with lessons
    modules = Module.query.filter_by(course_id=course_id).order_by(Module.order_index).all()
    
    # Check if user is enrolled
    is_enrolled = False
    if current_user.is_authenticated and current_user.user:
        enrollment = Enrollment.query.filter_by(
            user_id=current_user.user.id, 
            course_id=course_id, 
            is_active=True
        ).first()
        is_enrolled = enrollment is not None
    
    return render_template('course_detail.html', 
                         course=course, 
                         modules=modules, 
                         current_user=current_user,
                         is_enrolled=is_enrolled)

@app.route('/enroll-request', methods=['POST'])
def enroll_request():
    try:
        data = request.get_json()
        
        # Create enrollment request
        enrollment_request = EnrollmentRequest(
            name=data.get('name'),
            phone=data.get('phone'),
            email=data.get('email'),
            message=data.get('message'),
            course_id=int(data.get('course_id'))
        )
        
        db.session.add(enrollment_request)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'تم إرسال طلب التسجيل بنجاح'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء إرسال الطلب'}), 500

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session or not SessionManager.is_session_valid():
        flash('Please log in to access the dashboard.', 'error')
        return redirect(url_for('login'))
    
    current_user = get_current_user()
    
    # Get user enrollments with course details
    enrollments = []
    available_courses = []
    
    if current_user.user:
        enrollments = db.session.query(Enrollment, Course).join(Course).filter(
            Enrollment.user_id == current_user.user.id,
            Enrollment.is_active == True
        ).all()
        
        # Get available courses (not enrolled)
        enrolled_course_ids = [enrollment.course_id for enrollment, _ in enrollments]
        available_courses = Course.query.filter(
            Course.is_active == True,
            ~Course.id.in_(enrolled_course_ids) if enrolled_course_ids else True
        ).limit(6).all()
    
    user_stats = get_user_stats(current_user.user)
    recent_activities = get_recent_activities(current_user.user)
    
    return render_template('dashboard.html', 
                         current_user=current_user,
                         user_stats=user_stats,
                         recent_activities=recent_activities,
                         enrollments=enrollments,
                         available_courses=available_courses)

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
        print("Database tables created successfully!")
        
        # Add fake course data if no courses exist
        if Course.query.count() == 0:
            add_fake_courses()
        
        # Add test users if no users exist
        if User.query.count() == 0:
            add_test_users()

def add_fake_courses():
    """Add fake course data for testing and demonstration"""
    
    # Course 1: Web Development
    course1 = Course(
        title_ar="تطوير المواقع الإلكترونية الشامل",
        title_en="Complete Web Development",
        description_ar="دورة شاملة لتعلم تطوير المواقع الإلكترونية من الصفر حتى الاحتراف باستخدام أحدث التقنيات",
        description_en="A comprehensive course to learn web development from scratch to professional level using the latest technologies",
        what_you_learn_ar="• HTML5 و CSS3 المتقدم\n• JavaScript و ES6+\n• React.js للواجهات التفاعلية\n• Node.js و Express للخادم\n• قواعد البيانات MongoDB\n• نشر المشاريع على الإنترنت",
        what_you_learn_en="• Advanced HTML5 & CSS3\n• JavaScript & ES6+\n• React.js for interactive interfaces\n• Node.js & Express for backend\n• MongoDB databases\n• Project deployment online",
        target_audience_ar="• المبتدئين في البرمجة\n• المطورين الذين يريدون تطوير مهاراتهم\n• الطلاب وخريجي علوم الحاسوب\n• رواد الأعمال الذين يريدون بناء مواقعهم",
        target_audience_en="• Programming beginners\n• Developers wanting to upgrade skills\n• Computer science students and graduates\n• Entrepreneurs wanting to build their websites",
        requirements_ar="• جهاز كمبيوتر أو لابتوب\n• اتصال بالإنترنت\n• لا يتطلب خبرة سابقة في البرمجة\n• الرغبة في التعلم والممارسة",
        requirements_en="• Computer or laptop\n• Internet connection\n• No prior programming experience required\n• Willingness to learn and practice",
        instructor_name_ar="أحمد شلبي",
        instructor_name_en="Ahmed Shalabi",
        instructor_bio_ar="مطور ويب محترف مع أكثر من 8 سنوات خبرة في تطوير المواقع والتطبيقات. عمل مع شركات عالمية ولديه خبرة واسعة في التدريس والتطوير.",
        instructor_bio_en="Professional web developer with over 8 years of experience in web and application development. Worked with global companies and has extensive experience in teaching and development.",
        price=299.99,
        duration_hours=40,
        level="beginner",
        category="web-development",
        image_url="/static/images/courses/web-dev.jpg"
    )
    
    # Course 2: Mobile App Development
    course2 = Course(
        title_ar="تطوير تطبيقات الهاتف المحمول",
        title_en="Mobile App Development",
        description_ar="تعلم تطوير تطبيقات الهاتف المحمول للأندرويد و iOS باستخدام React Native",
        description_en="Learn mobile app development for Android & iOS using React Native",
        what_you_learn_ar="• أساسيات React Native\n• تطوير واجهات المستخدم\n• التعامل مع APIs\n• نشر التطبيقات على المتاجر\n• إدارة الحالة والبيانات",
        what_you_learn_en="• React Native fundamentals\n• User interface development\n• Working with APIs\n• Publishing apps to stores\n• State and data management",
        target_audience_ar="• المطورين الذين يعرفون JavaScript\n• مطوري الويب الذين يريدون دخول عالم الموبايل\n• الطلاب المتقدمين",
        target_audience_en="• Developers who know JavaScript\n• Web developers wanting to enter mobile world\n• Advanced students",
        requirements_ar="• معرفة أساسية بـ JavaScript\n• خبرة في React (مفضلة)\n• جهاز كمبيوتر قوي\n• هاتف ذكي للاختبار",
        requirements_en="• Basic JavaScript knowledge\n• React experience (preferred)\n• Powerful computer\n• Smartphone for testing",
        instructor_name_ar="سارة محمد",
        instructor_name_en="Sara Mohamed",
        instructor_bio_ar="مطورة تطبيقات محمولة متخصصة مع 6 سنوات خبرة. طورت أكثر من 20 تطبيق ناجح ولديها شغف بالتعليم.",
        instructor_bio_en="Specialized mobile app developer with 6 years of experience. Developed over 20 successful apps and has a passion for teaching.",
        price=399.99,
        duration_hours=35,
        level="intermediate",
        category="mobile-development",
        image_url="/static/images/courses/mobile-dev.jpg"
    )
    
    # Course 3: Data Science
    course3 = Course(
        title_ar="علم البيانات والذكاء الاصطناعي",
        title_en="Data Science and AI",
        description_ar="دورة متقدمة في علم البيانات والذكاء الاصطناعي باستخدام Python",
        description_en="Advanced course in data science and artificial intelligence using Python",
        what_you_learn_ar="• Python للبيانات\n• مكتبات pandas و numpy\n• التصور البياني\n• التعلم الآلي\n• الذكاء الاصطناعي\n• مشاريع عملية",
        what_you_learn_en="• Python for data\n• pandas & numpy libraries\n• Data visualization\n• Machine learning\n• Artificial intelligence\n• Practical projects",
        target_audience_ar="• المحللين والإحصائيين\n• المبرمجين المتقدمين\n• الباحثين والأكاديميين\n• المهتمين بالذكاء الاصطناعي",
        target_audience_en="• Analysts and statisticians\n• Advanced programmers\n• Researchers and academics\n• AI enthusiasts",
        requirements_ar="• معرفة متوسطة بـ Python\n• أساسيات الرياضيات والإحصاء\n• جهاز كمبيوتر قوي\n• خبرة في البرمجة",
        requirements_en="• Intermediate Python knowledge\n• Math and statistics basics\n• Powerful computer\n• Programming experience",
        instructor_name_ar="د. محمد علي",
        instructor_name_en="Dr. Mohamed Ali",
        instructor_bio_ar="دكتور في علوم الحاسوب متخصص في الذكاء الاصطناعي. يعمل كباحث وله أكثر من 50 بحث منشور في المجال.",
        instructor_bio_en="PhD in Computer Science specializing in AI. Works as a researcher with over 50 published papers in the field.",
        price=499.99,
        duration_hours=50,
        level="advanced",
        category="data-science",
        image_url="/static/images/courses/data-science.jpg"
    )
    
    db.session.add_all([course1, course2, course3])
    db.session.commit()
    
    # Add modules and lessons for Course 1 (Web Development)
    add_course_modules_lessons(course1.id, "web-development")
    add_course_modules_lessons(course2.id, "mobile-development")
    add_course_modules_lessons(course3.id, "data-science")
    
    print("Fake course data added successfully!")

def add_test_users():
    """Add test users for development and testing"""
    
    # Test User 1: Regular student
    user1 = User(
        username="student1",
        email="student1@test.com"
    )
    user1.set_password("password123")
    
    # Test User 2: Another student
    user2 = User(
        username="ahmed_test",
        email="ahmed@test.com"
    )
    user2.set_password("password123")
    
    # Test User 3: Admin/Instructor
    user3 = User(
        username="instructor",
        email="instructor@test.com"
    )
    user3.set_password("password123")
    
    db.session.add_all([user1, user2, user3])
    db.session.commit()
    
    # Add some test enrollments
    course1 = Course.query.filter_by(category="web-development").first()
    course2 = Course.query.filter_by(category="mobile-development").first()
    
    if course1 and course2:
        # Enroll user1 in web development course
        enrollment1 = Enrollment(
            user_id=user1.id,
            course_id=course1.id,
            progress_percentage=25.0,
            last_accessed=datetime.utcnow()
        )
        
        # Enroll user2 in both courses
        enrollment2 = Enrollment(
            user_id=user2.id,
            course_id=course1.id,
            progress_percentage=60.0,
            last_accessed=datetime.utcnow()
        )
        
        enrollment3 = Enrollment(
            user_id=user2.id,
            course_id=course2.id,
            progress_percentage=10.0,
            last_accessed=datetime.utcnow()
        )
        
        db.session.add_all([enrollment1, enrollment2, enrollment3])
        db.session.commit()
    
    print("Test users created successfully!")
    print("Test Users:")
    print("1. Username: student1, Email: student1@test.com, Password: password123")
    print("2. Username: ahmed_test, Email: ahmed@test.com, Password: password123")
    print("3. Username: instructor, Email: instructor@test.com, Password: password123")

def add_course_modules_lessons(course_id, course_type):
    """Add modules and lessons for a specific course"""
    
    if course_type == "web-development":
        # Module 1: HTML & CSS
        module1 = Module(
            course_id=course_id,
            title_ar="أساسيات HTML و CSS",
            title_en="HTML & CSS Fundamentals",
            description_ar="تعلم أساسيات بناء صفحات الويب",
            description_en="Learn the basics of building web pages",
            order_index=1
        )
        
        # Module 2: JavaScript
        module2 = Module(
            course_id=course_id,
            title_ar="JavaScript المتقدم",
            title_en="Advanced JavaScript",
            description_ar="تعلم البرمجة التفاعلية للمواقع",
            description_en="Learn interactive programming for websites",
            order_index=2
        )
        
        # Module 3: React
        module3 = Module(
            course_id=course_id,
            title_ar="React.js للمبتدئين",
            title_en="React.js for Beginners",
            description_ar="بناء واجهات تفاعلية حديثة",
            description_en="Building modern interactive interfaces",
            order_index=3
        )
        
        db.session.add_all([module1, module2, module3])
        db.session.commit()
        
        # Add lessons for Module 1
        lessons_module1 = [
            Lesson(module_id=module1.id, title_ar="مقدمة في HTML", title_en="Introduction to HTML", 
                  content_ar="تعلم أساسيات HTML", content_en="Learn HTML basics",
                  duration_minutes=30, order_index=1, is_free=True),
            Lesson(module_id=module1.id, title_ar="تنسيق النصوص", title_en="Text Formatting", 
                  content_ar="تنسيق النصوص في HTML", content_en="Text formatting in HTML",
                  duration_minutes=25, order_index=2, is_free=False),
            Lesson(module_id=module1.id, title_ar="أساسيات CSS", title_en="CSS Basics", 
                  content_ar="تعلم تنسيق الصفحات", content_en="Learn page styling",
                  duration_minutes=35, order_index=3, is_free=False)
        ]
        
        # Add lessons for Module 2
        lessons_module2 = [
            Lesson(module_id=module2.id, title_ar="متغيرات JavaScript", title_en="JavaScript Variables", 
                  content_ar="تعلم المتغيرات والأنواع", content_en="Learn variables and types",
                  duration_minutes=40, order_index=1, is_free=True),
            Lesson(module_id=module2.id, title_ar="الدوال والكائنات", title_en="Functions and Objects", 
                  content_ar="البرمجة الكائنية في JavaScript", content_en="Object-oriented programming in JavaScript",
                  duration_minutes=45, order_index=2, is_free=False)
        ]
        
        # Add lessons for Module 3
        lessons_module3 = [
            Lesson(module_id=module3.id, title_ar="مقدمة في React", title_en="Introduction to React", 
                  content_ar="أساسيات مكتبة React", content_en="React library fundamentals",
                  duration_minutes=50, order_index=1, is_free=False),
            Lesson(module_id=module3.id, title_ar="المكونات والخصائص", title_en="Components and Props", 
                  content_ar="بناء المكونات القابلة لإعادة الاستخدام", content_en="Building reusable components",
                  duration_minutes=55, order_index=2, is_free=False)
        ]
        
        db.session.add_all(lessons_module1 + lessons_module2 + lessons_module3)
        
    elif course_type == "mobile-development":
        # Add modules for mobile development course
        module1 = Module(
            course_id=course_id,
            title_ar="أساسيات React Native",
            title_en="React Native Fundamentals",
            description_ar="تعلم أساسيات تطوير التطبيقات",
            description_en="Learn app development basics",
            order_index=1
        )
        
        module2 = Module(
            course_id=course_id,
            title_ar="واجهات المستخدم",
            title_en="User Interfaces",
            description_ar="تصميم واجهات جذابة",
            description_en="Design attractive interfaces",
            order_index=2
        )
        
        db.session.add_all([module1, module2])
        db.session.commit()
        
        # Add lessons
        lessons = [
            Lesson(module_id=module1.id, title_ar="إعداد البيئة", title_en="Environment Setup", 
                  content_ar="تحضير بيئة التطوير", content_en="Prepare development environment",
                  duration_minutes=30, order_index=1, is_free=True),
            Lesson(module_id=module1.id, title_ar="أول تطبيق", title_en="First App", 
                  content_ar="بناء أول تطبيق محمول", content_en="Build first mobile app",
                  duration_minutes=45, order_index=2, is_free=False),
            Lesson(module_id=module2.id, title_ar="التنقل بين الشاشات", title_en="Screen Navigation", 
                  content_ar="إدارة التنقل في التطبيق", content_en="Manage app navigation",
                  duration_minutes=40, order_index=1, is_free=False)
        ]
        
        db.session.add_all(lessons)
        
    elif course_type == "data-science":
        # Add modules for data science course
        module1 = Module(
            course_id=course_id,
            title_ar="Python للبيانات",
            title_en="Python for Data",
            description_ar="استخدام Python في تحليل البيانات",
            description_en="Using Python for data analysis",
            order_index=1
        )
        
        module2 = Module(
            course_id=course_id,
            title_ar="التعلم الآلي",
            title_en="Machine Learning",
            description_ar="خوارزميات التعلم الآلي",
            description_en="Machine learning algorithms",
            order_index=2
        )
        
        db.session.add_all([module1, module2])
        db.session.commit()
        
        # Add lessons
        lessons = [
            Lesson(module_id=module1.id, title_ar="مكتبة Pandas", title_en="Pandas Library", 
                  content_ar="تحليل البيانات باستخدام Pandas", content_en="Data analysis using Pandas",
                  duration_minutes=60, order_index=1, is_free=True),
            Lesson(module_id=module1.id, title_ar="التصور البياني", title_en="Data Visualization", 
                  content_ar="رسم البيانات والمخططات", content_en="Data plotting and charts",
                  duration_minutes=50, order_index=2, is_free=False),
            Lesson(module_id=module2.id, title_ar="الشبكات العصبية", title_en="Neural Networks", 
                  content_ar="مقدمة في الشبكات العصبية", content_en="Introduction to neural networks",
                  duration_minutes=70, order_index=1, is_free=False)
        ]
        
        db.session.add_all(lessons)
    
    db.session.commit()

@app.route('/lesson/<int:lesson_id>')
def lesson_player(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    course = Course.query.get_or_404(lesson.module.course_id)
    
    # Check if user is logged in
    if 'user_id' not in session or not SessionManager.is_session_valid():
        # Allow free preview for free lessons only
        if not lesson.is_free:
            flash('يجب تسجيل الدخول لمشاهدة هذا الدرس.', 'error')
            return redirect(url_for('login'))
        user_enrolled = False
        current_user = None
    else:
        current_user = get_current_user()
        # Check if user is enrolled in the course
        user_enrolled = False
        if current_user.user:
            enrollment = Enrollment.query.filter_by(
                user_id=current_user.user.id,
                course_id=course.id,
                is_active=True
            ).first()
            user_enrolled = enrollment is not None
    
    # Determine if user can access this lesson
    can_access = lesson.is_free or user_enrolled
    
    if not can_access:
        flash('يجب التسجيل في الدورة لمشاهدة هذا الدرس.', 'error')
        return redirect(url_for('course_detail', course_id=course.id))
    
    # Get all lessons in the module for navigation
    module_lessons = Lesson.query.filter_by(module_id=lesson.module_id).order_by(Lesson.order_index).all()
    
    # Get user's progress for this lesson if enrolled
    lesson_progress = None
    if user_enrolled and current_user and current_user.user:
        enrollment = Enrollment.query.filter_by(
            user_id=current_user.user.id,
            course_id=course.id,
            is_active=True
        ).first()
        if enrollment:
            lesson_progress = LessonProgress.query.filter_by(
                enrollment_id=enrollment.id,
                lesson_id=lesson_id
            ).first()
    
    return render_template('lesson_player.html',
                         lesson=lesson,
                         course=course,
                         module_lessons=module_lessons,
                         user_enrolled=user_enrolled,
                         current_user=current_user,
                         lesson_progress=lesson_progress,
                         can_access=can_access)

@app.route('/lesson/<int:lesson_id>/complete', methods=['POST'])
def complete_lesson(lesson_id):
    if 'user_id' not in session or not SessionManager.is_session_valid():
        return jsonify({'success': False, 'message': 'يجب تسجيل الدخول أولاً'})
    
    current_user = get_current_user()
    if not current_user.user:
        return jsonify({'success': False, 'message': 'خطأ في المصادقة'})
    
    lesson = Lesson.query.get_or_404(lesson_id)
    course = Course.query.get_or_404(lesson.module.course_id)
    
    # Check if user is enrolled
    enrollment = Enrollment.query.filter_by(
        user_id=current_user.user.id,
        course_id=course.id,
        is_active=True
    ).first()
    
    if not enrollment:
        return jsonify({'success': False, 'message': 'يجب التسجيل في الدورة أولاً'})
    
    # Create or update lesson progress
    lesson_progress = LessonProgress.query.filter_by(
        enrollment_id=enrollment.id,
        lesson_id=lesson_id
    ).first()
    
    if not lesson_progress:
        lesson_progress = LessonProgress(
            enrollment_id=enrollment.id,
            lesson_id=lesson_id,
            is_completed=True,
            completed_at=datetime.utcnow()
        )
        db.session.add(lesson_progress)
    else:
        lesson_progress.is_completed = True
        lesson_progress.completed_at = datetime.utcnow()
    
    # Update enrollment progress
    total_lessons = db.session.query(Lesson).join(Module).filter(Module.course_id == course.id).count()
    completed_lessons = db.session.query(LessonProgress).join(Lesson).join(Module).filter(
        Module.course_id == course.id,
        LessonProgress.enrollment_id == enrollment.id,
        LessonProgress.is_completed == True
    ).count()
    
    enrollment.progress_percentage = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
    
    try:
        db.session.commit()
        return jsonify({
            'success': True, 
            'message': 'تم إكمال الدرس بنجاح!',
            'progress': enrollment.progress_percentage
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء حفظ التقدم'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)