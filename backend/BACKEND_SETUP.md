# AI Healthcare Ecosystem - Backend Setup Guide

## Overview

This is a comprehensive Python/Flask backend for the AI Healthcare Ecosystem application, featuring:

- **RESTful API** - Flask with JWT authentication
- **Database** - PostgreSQL for data storage
- **AI Services** - Symptom analysis and report summarization
- **Cloud Storage** - Support for S3, GCS, Azure, or local storage
- **Caching** - Redis for performance optimization
- **Task Queue** - Celery for async tasks
- **Security** - JWT tokens, password hashing, CORS

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
cd backend

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Initialize database
docker exec healthcare_api flask db upgrade

# Create admin user (optional)
docker exec healthcare_api python create_admin.py

# API is available at http://localhost:5000
```

### Option 2: Manual Setup

#### 1. Install Python Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Database Setup

```bash
# Create PostgreSQL database
createdb healthcare_db
createuser healthcare_user
psql healthcare_db -c "ALTER USER healthcare_user WITH PASSWORD 'healthcare_password';"
psql healthcare_db -c "GRANT ALL PRIVILEGES ON DATABASE healthcare_db TO healthcare_user;"

# Or using Docker
docker run -d \
  --name healthcare_postgres \
  -e POSTGRES_DB=healthcare_db \
  -e POSTGRES_USER=healthcare_user \
  -e POSTGRES_PASSWORD=healthcare_password \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 3. Redis Setup

```bash
# Install Redis locally
# Or run in Docker
docker run -d \
  --name healthcare_redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 4. Environment Configuration

```bash
# Copy and configure environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

#### 5. Initialize Database

```bash
# Create tables
python init_db.py

# Or manually
flask db upgrade
```

#### 6. Run Backend

```bash
# Start Flask development server
flask run

# Or with gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()

# In another terminal, start Celery worker
celery -A celery_app worker --loglevel=info

# And Celery Beat (scheduler)
celery -A celery_app beat --loglevel=info
```

---

## Project Structure

```
backend/
├── app.py                      # Flask application factory
├── config.py                   # Configuration management
├── models.py                   # SQLAlchemy models
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── routes/                    # API route handlers
│   ├── auth_routes.py        # Authentication endpoints
│   ├── user_routes.py        # User management endpoints
│   ├── appointment_routes.py # Appointment endpoints
│   ├── report_routes.py      # Medical report endpoints
│   ├── prescription_routes.py# Prescription endpoints
│   ├── ai_routes.py          # AI service endpoints
│   └── dashboard_routes.py   # Dashboard endpoints
├── services/                  # Business logic services
│   ├── ai_service.py         # AI analysis services
│   ├── storage_service.py    # Cloud storage abstraction
│   └── email_service.py      # Email notifications
└── migrations/               # Database migrations
```

---

## API Endpoints

### Authentication

```http
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # Login user
POST   /api/auth/refresh            # Refresh JWT token
GET    /api/auth/me                 # Get current user
POST   /api/auth/change-password    # Change password
POST   /api/auth/logout             # Logout user
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password with token
```

### Users

```http
GET    /api/users/<user_id>         # Get user profile
GET    /api/users/me                # Get current user profile
PUT    /api/users/me                # Update current user
GET    /api/patients                # Get all patients (doctor only)
GET    /api/patients/<patient_id>   # Get patient details
GET    /api/doctors                 # Get all doctors
GET    /api/doctors/<doctor_id>     # Get doctor details
POST   /api/doctors                 # Create doctor profile
PUT    /api/doctors/me              # Update doctor profile
GET    /api/doctors/search          # Search doctors
```

### Appointments

```http
GET    /api/appointments            # Get user's appointments
GET    /api/appointments/<id>       # Get appointment details
POST   /api/appointments            # Create appointment
PUT    /api/appointments/<id>       # Update appointment
DELETE /api/appointments/<id>       # Cancel appointment
GET    /api/appointments/doctor/<id>/availability  # Get doctor availability
GET    /api/appointments/stats      # Get appointment statistics
```

### Medical Reports

```http
GET    /api/reports                 # Get medical reports
GET    /api/reports/<id>            # Get report details
POST   /api/reports                 # Upload report
PUT    /api/reports/<id>            # Update report
DELETE /api/reports/<id>            # Delete report
GET    /api/reports/<id>/download   # Get download link
GET    /api/reports/stats           # Get report statistics
```

### Prescriptions

```http
GET    /api/prescriptions           # Get prescriptions
GET    /api/prescriptions/<id>      # Get prescription details
POST   /api/prescriptions           # Create prescription
PUT    /api/prescriptions/<id>      # Update prescription
DELETE /api/prescriptions/<id>      # Delete prescription
GET    /api/prescriptions/<id>/medications  # Get medications
POST   /api/prescriptions/<id>/medications  # Add medication
DELETE /api/prescriptions/medications/<id>  # Delete medication
GET    /api/prescriptions/stats     # Get statistics
```

### AI Services

```http
POST   /api/ai/symptom-check        # Analyze symptoms
GET    /api/ai/symptom-history      # Get analysis history
GET    /api/ai/symptom-analysis/<id># Get specific analysis
POST   /api/ai/summarize-report     # Summarize report
POST   /api/ai/summarize-bulk       # Summarize multiple reports
GET    /api/ai/health               # Check AI service health
GET    /api/ai/models/info          # Get model information
POST   /api/ai/drug-interaction-check  # Check drug interactions
```

### Dashboard

```http
GET    /api/dashboard/patient       # Get patient dashboard
GET    /api/dashboard/doctor        # Get doctor dashboard
GET    /api/dashboard/admin         # Get admin dashboard
GET    /api/dashboard/analytics/appointments  # Appointment analytics
GET    /api/dashboard/analytics/reports      # Report analytics
```

---

## Authentication

### JWT Tokens

All protected endpoints require JWT tokens in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle

1. **Login** - Get access and refresh tokens
2. **Access Token** - Valid for 1 hour
3. **Refresh Token** - Valid for 30 days
4. **Refresh Endpoint** - Get new access token with refresh token

### Example Authentication Flow

```python
import requests

# 1. Register
register_response = requests.post('http://localhost:5000/api/auth/register', json={
    'email': 'user@example.com',
    'password': 'password123',
    'first_name': 'John',
    'last_name': 'Doe',
    'role': 'patient'
})

# 2. Login
login_response = requests.post('http://localhost:5000/api/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})

tokens = login_response.json()
access_token = tokens['access_token']

# 3. Make authenticated request
headers = {'Authorization': f'Bearer {access_token}'}
me_response = requests.get('http://localhost:5000/api/auth/me', headers=headers)

# 4. Refresh token
refresh_response = requests.post('http://localhost:5000/api/auth/refresh',
    headers={'Authorization': f'Bearer {refresh_token}'})

new_access_token = refresh_response.json()['access_token']
```

---

## Database Models

### User

```python
- id: UUID (primary key)
- email: String (unique)
- password_hash: String
- first_name: String
- last_name: String
- phone: String
- date_of_birth: Date
- gender: String
- role: String (patient, doctor, admin)
- is_active: Boolean
- email_verified: Boolean
- created_at: DateTime
- updated_at: DateTime
```

### DoctorProfile

```python
- id: UUID (primary key)
- user_id: UUID (foreign key)
- license_number: String (unique)
- specialty: String
- bio: Text
- experience_years: Integer
- consultation_fee: Float
- rating: Float
- is_verified: Boolean
- created_at: DateTime
```

### Appointment

```python
- id: UUID (primary key)
- patient_id: UUID (foreign key)
- doctor_id: UUID (foreign key)
- appointment_date: Date
- appointment_time: Time
- reason: Text
- status: String (scheduled, completed, cancelled)
- notes: Text
- created_at: DateTime
```

### MedicalReport

```python
- id: UUID (primary key)
- patient_id: UUID (foreign key)
- doctor_id: UUID (foreign key)
- report_type: String
- title: String
- description: Text
- file_url: String
- ai_summary: Text
- is_summarized: Boolean
- created_at: DateTime
```

### Prescription

```python
- id: UUID (primary key)
- patient_id: UUID (foreign key)
- doctor_id: UUID (foreign key)
- prescribed_date: Date
- expiry_date: Date
- status: String (active, expired, completed)
- instructions: Text
- created_at: DateTime
```

---

## Cloud Storage Configuration

### Local Storage (Default)

```env
STORAGE_PROVIDER=local
UPLOAD_FOLDER=./uploads
```

### AWS S3

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
```

### Google Cloud Storage

```env
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your_project
GCS_BUCKET_NAME=your-bucket
GCS_CREDENTIALS_PATH=./google-credentials.json
```

### Azure Blob Storage

```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_CONTAINER_NAME=your-container
```

---

## AI Services

### Symptom Analysis

```python
from services.ai_service import SymptomAnalyzer

analyzer = SymptomAnalyzer()
result = analyzer.analyze(
    symptoms=['Fever', 'Cough', 'Sore Throat'],
    duration='3 days',
    age=35,
    medical_history=[]
)

# Returns:
{
    'symptoms': [...],
    'possible_conditions': [...],
    'urgency': 'Not urgent',
    'severity': 'Moderate',
    'recommendations': [...]
}
```

### Report Summarization

```python
from services.ai_service import ReportSummarizer

summarizer = ReportSummarizer()
result = summarizer.summarize(
    report_type='blood_test',
    content='Lab results...',
    title='Complete Blood Count'
)

# Returns:
{
    'summary': '...',
    'key_findings': [...],
    'recommendations': [...],
    'confidence': 0.95
}
```

---

## Deployment

### Production Checklist

- [ ] Change all default secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up email service
- [ ] Configure storage properly
- [ ] Enable rate limiting
- [ ] Setup CI/CD pipeline
- [ ] Configure health checks

### Gunicorn Production Setup

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -b 0.0.0.0:5000 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile - \
  app:create_app()
```

### Nginx Configuration

```nginx
upstream flask_app {
    server 127.0.0.1:5000;
}

server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://flask_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Systemd Service

```ini
[Unit]
Description=Healthcare API
After=network.target postgresql.service redis.service

[Service]
User=www-data
WorkingDirectory=/var/www/healthcare-api
Environment="PATH=/var/www/healthcare-api/venv/bin"
ExecStart=/var/www/healthcare-api/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()

[Install]
WantedBy=multi-user.target
```

---

## Monitoring & Logging

### Logs Location

```
logs/
├── app.log          # Application logs
├── access.log       # HTTP access logs
└── error.log        # Error logs
```

### View Logs

```bash
# Flask logs
tail -f logs/app.log

# Docker logs
docker logs -f healthcare_api
docker logs -f healthcare_celery
```

---

## Testing

### Unit Tests

```bash
# Run tests
python -m pytest tests/

# With coverage
python -m pytest --cov=. tests/
```

### API Testing

```bash
# Install test dependencies
pip install pytest pytest-flask pytest-cov

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py
```

---

## Troubleshooting

### Database Connection Issues

```python
# Test database connection
from app import create_app, db

app = create_app()
with app.app_context():
    db.create_all()
    print("Database connected successfully")
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis status
redis-cli info
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

---

## Advanced Configuration

### Custom Email Service

```python
from services.email_service import EmailService

email_service = EmailService(app.config)
email_service.send_appointment_reminder(appointment_id)
```

### Custom AI Models

Place trained models in `models/` directory and configure in `.env`:

```env
SYMPTOM_CHECKER_MODEL=your_model.pkl
REPORT_SUMMARIZER_MODEL=your_model.pkl
```

### Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/resource')
@limiter.limit("10 per minute")
def limited_resource():
    return {'data': 'resource'}
```

---

## Performance Tips

1. **Database Indexing** - Add indexes to frequently queried columns
2. **Caching** - Use Redis for session and query caching
3. **Query Optimization** - Use joins instead of N+1 queries
4. **Async Tasks** - Use Celery for long-running operations
5. **Connection Pooling** - Configure database connection pooling

---

## Security Best Practices

1. **Secrets Management** - Use environment variables
2. **Password Hashing** - Using bcrypt
3. **SQL Injection Prevention** - Using ORM/parameterized queries
4. **CORS Configuration** - Whitelist specific origins
5. **Rate Limiting** - Prevent brute force attacks
6. **HTTPS** - Always use in production
7. **Input Validation** - Validate all user inputs
8. **Output Encoding** - Prevent XSS attacks

---

## Support & Resources

- Flask Documentation: https://flask.palletsprojects.com/
- SQLAlchemy: https://www.sqlalchemy.org/
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io/
- Redis: https://redis.io/documentation
- Celery: https://docs.celeryproject.org/

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
