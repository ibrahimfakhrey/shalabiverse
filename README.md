# Shalabiverse - Online Learning Platform

A comprehensive Flask-based learning management system with course management, user authentication, and lesson tracking.

## Features

- User registration and authentication
- Course catalog with detailed information
- Lesson player with video support
- Progress tracking
- Admin panel for content management
- Responsive design

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables (copy `.env.example` to `.env`)
4. Run the application:
   ```bash
   python app.py
   ```

## Deployment to Render

### Prerequisites
- Render account
- PostgreSQL database (Render provides this)

### Environment Variables to Set in Render:
- `FLASK_ENV=production`
- `SECRET_KEY=your-super-secret-key-here`
- `DATABASE_URL=postgresql://...` (Render will provide this)

### Deployment Steps:
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `gunicorn app:app`
5. Add the environment variables listed above
6. Deploy!

## Test Users (Development Only)
- Username: `student1`, Password: `password123`
- Username: `ahmed_test`, Password: `password123`
- Username: `instructor`, Password: `password123`

## Admin Panel
Access the admin panel at `/admin` to manage users, courses, and enrollments.

## Technology Stack
- Flask
- SQLAlchemy
- Flask-WTF
- Flask-Admin
- Bootstrap 5
- SQLite (development) / PostgreSQL (production)