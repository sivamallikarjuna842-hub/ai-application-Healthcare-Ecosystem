# Full Stack Setup - AI Healthcare Ecosystem

## 🚀 Complete Full-Stack Implementation Guide

This guide covers the complete setup of the AI Healthcare Ecosystem with both frontend and backend components.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React/TypeScript)            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pages: 8 modules                               │   │
│  │  State: Zustand stores                          │   │
│  │  Styling: Tailwind CSS                          │   │
│  │  Build: Vite                                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
                      HTTP/REST API
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Python/Flask)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API: RESTful endpoints                          │   │
│  │  Auth: JWT tokens                               │   │
│  │  Database: PostgreSQL                           │   │
│  │  AI: Symptom & Report analysis                 │   │
│  │  Storage: S3/GCS/Azure/Local                   │   │
│  │  Cache: Redis                                   │   │
│  │  Tasks: Celery async processing                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL | Redis | Celery | Cloud Storage   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 5GB for development
- **Internet**: Required for dependencies and cloud services

### Software Requirements

- **Node.js**: 16.0.0+ (for frontend)
- **Python**: 3.11.0+ (for backend)
- **PostgreSQL**: 12.0+ (or Docker)
- **Redis**: 6.0+ (or Docker)
- **Docker & Docker Compose**: Latest (optional but recommended)
- **Git**: For version control

### Installation Steps

#### Node.js (Frontend)

**macOS:**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from https://nodejs.org/

#### Python (Backend)

**macOS:**
```bash
brew install python@3.11
```

**Ubuntu/Debian:**
```bash
sudo apt-get install python3.11 python3.11-venv python3.11-dev
```

**Windows:**
Download from https://www.python.org/

#### PostgreSQL

**Using Docker (Recommended):**
```bash
docker run -d \
  --name healthcare_postgres \
  -e POSTGRES_DB=healthcare_db \
  -e POSTGRES_USER=healthcare_user \
  -e POSTGRES_PASSWORD=healthcare_password \
  -p 5432:5432 \
  postgres:15-alpine
```

**Or Local Installation:**
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql`
- Windows: Download installer from postgresql.org

#### Redis

**Using Docker:**
```bash
docker run -d \
  --name healthcare_redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Or Local Installation:**
- macOS: `brew install redis`
- Ubuntu: `sudo apt-get install redis-server`
- Windows: Use WSL2 or Docker

---

## Full-Stack Setup

### Method 1: Docker Compose (Recommended)

#### Step 1: Clone and Setup

```bash
# Clone repository
git clone <repo-url> healthcare-ecosystem
cd healthcare-ecosystem

# Setup frontend
cd src
npm install
cd ..

# Setup backend
cd backend
cp .env.example .env
cd ..
```

#### Step 2: Start Services

```bash
# From root directory, start all services
docker-compose up -d

# Verify services
docker-compose ps
```

#### Step 3: Initialize Data

```bash
# Create database and seed data
docker-compose exec api python init_db.py

# (Optional) Create admin user
docker-compose exec api python create_admin.py
```

#### Step 4: Access Applications

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Method 2: Manual Setup

#### Frontend Setup

```bash
# Navigate to frontend directory
cd src

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local if needed
nano .env.local

# Start development server
npm run dev

# Application available at http://localhost:5173
```

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python3.11 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Configure environment
nano .env
```

#### Database Setup

```bash
# Create database and user
createdb healthcare_db
createuser healthcare_user
psql healthcare_db -c "ALTER USER healthcare_user WITH PASSWORD 'healthcare_password';"
psql healthcare_db -c "GRANT ALL PRIVILEGES ON DATABASE healthcare_db TO healthcare_user;"

# Or initialize from Python
python init_db.py
```

#### Start Services

```bash
# In one terminal - Backend API
cd backend
python -m flask run

# In another terminal - Celery Worker
cd backend
celery -A celery_app worker --loglevel=info

# In another terminal - Celery Beat
cd backend
celery -A celery_app beat --loglevel=info

# In another terminal - Frontend
cd src
npm run dev
```

---

## Configuration

### Frontend (.env.local)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Healthcare Ecosystem
```

### Backend (.env)

```env
# Flask
FLASK_ENV=development
DEBUG=True

# Database
DATABASE_URL=postgresql://healthcare_user:healthcare_password@localhost:5432/healthcare_db

# JWT
JWT_SECRET_KEY=your-secret-key-change-in-production

# Redis
REDIS_URL=redis://localhost:6379/0

# File Storage
STORAGE_PROVIDER=local
UPLOAD_FOLDER=./uploads

# Email (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

---

## Testing the Full Stack

### Demo Credentials

**Frontend Login:**
```
Patient Email:    patient@example.com
Patient Password: demo

Doctor Email:     doctor@example.com
Doctor Password:  demo
```

**Backend Demo Users:**
```
Patient Email:    demo_patient@example.com
Patient Password: demo123

Doctor Email:     demo_doctor@example.com
Doctor Password:  demo123
```

### Testing Workflow

1. **Frontend Patient Flow**
   ```
   Login → Symptom Checker → Book Appointment → View Reports → Check Prescriptions
   ```

2. **Frontend Doctor Flow**
   ```
   Login → View Patients → Manage Appointments → Upload Reports → Create Prescriptions
   ```

3. **Backend API Testing**
   ```bash
   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo_patient@example.com","password":"demo123"}'
   
   # Get current user (use token from login)
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer <token>"
   ```

---

## Development Workflow

### Frontend Development

```bash
cd src

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if added)
npm run test
```

### Backend Development

```bash
cd backend

# Development server (auto-reload)
python -m flask run --reload

# Interactive shell
python -m flask shell

# Run tests (if added)
python -m pytest

# Format code
black .
```

### Database Migrations

```bash
cd backend

# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade

# Downgrade migration
flask db downgrade
```

---

## Deployment

### Production Checklist

- [ ] Frontend built with `npm run build`
- [ ] Backend environment configured
- [ ] Database backed up
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] Environment variables set
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] Backups automated
- [ ] Tests passing

### Frontend Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd src
vercel
```

#### Netlify

```bash
# Build
npm run build

# Deploy dist folder to Netlify
```

#### AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Backend Deployment

#### Railway.app (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway up
```

#### Heroku

```bash
# Create app
heroku create healthcare-ecosystem

# Set config
heroku config:set FLASK_ENV=production

# Deploy
git push heroku main
```

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Create and deploy
eb init
eb create healthcare-ecosystem
eb deploy
```

#### Docker Deployment

```bash
# Build images
docker build -t healthcare-api ./backend
docker build -t healthcare-web ./src

# Push to registry
docker tag healthcare-api your-registry/healthcare-api
docker push your-registry/healthcare-api

# Deploy with docker-compose
docker-compose up -d
```

---

## Monitoring & Maintenance

### Logs

```bash
# Frontend logs (browser console)
# Open DevTools: F12

# Backend logs
tail -f backend/logs/app.log

# Docker logs
docker logs -f healthcare_api
docker logs -f healthcare_postgres

# System logs
journalctl -u healthcare-api -f
```

### Health Checks

```bash
# Frontend health
curl http://localhost:5173

# Backend health
curl http://localhost:5000/health

# Database
psql -U healthcare_user -d healthcare_db -c "SELECT 1"

# Redis
redis-cli ping
```

### Performance Monitoring

```bash
# Frontend bundle analysis
npm run build -- --analyze

# Backend profiling
python -m cProfile -s cumulative app.py

# Database query analysis
EXPLAIN ANALYZE <query>
```

### Backup & Recovery

```bash
# Backup database
pg_dump healthcare_db > backup.sql

# Restore database
psql healthcare_db < backup.sql

# Backup Redis
redis-cli BGSAVE

# Backup uploads
tar -czf uploads_backup.tar.gz uploads/
```

---

## Troubleshooting

### Frontend Issues

**Port 5173 already in use:**
```bash
# Change port
npm run dev -- --port 3001
```

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Styles not loading:**
```bash
# Rebuild Tailwind
npm run dev

# Clear browser cache
Ctrl+Shift+Delete
```

### Backend Issues

**Database connection failed:**
```bash
# Check PostgreSQL status
pg_isready -h localhost -U healthcare_user

# Check connection string
echo $DATABASE_URL
```

**Port 5000 already in use:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Import errors:**
```bash
# Verify Python path
python -c "import sys; print(sys.path)"

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker logs <container_name>

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

**Port conflicts:**
```bash
# Check port usage
docker ps
lsof -i :<port>

# Change ports in docker-compose.yml
```

---

## Development Best Practices

### Frontend

- Use TypeScript for type safety
- Follow component composition patterns
- Use custom hooks for logic reuse
- Implement proper error boundaries
- Test user interactions
- Monitor bundle size
- Use React DevTools

### Backend

- Write unit tests for business logic
- Use database migrations
- Implement proper error handling
- Follow REST conventions
- Validate all inputs
- Use environment variables
- Monitor API performance

### General

- Use version control
- Write clear commit messages
- Document API changes
- Keep dependencies updated
- Review code before merging
- Monitor application metrics
- Maintain security standards

---

## Performance Optimization

### Frontend

- Lazy load routes
- Code splitting
- Image optimization
- Minify CSS/JS
- Enable compression
- Cache optimization
- Monitor Core Web Vitals

### Backend

- Database query optimization
- Implement caching
- Use connection pooling
- Compress responses
- Enable gzip compression
- Use CDN for static files
- Monitor API response times

---

## Security Hardening

### Frontend

- Use HTTPS only
- Implement CSP headers
- Sanitize user inputs
- Prevent XSS attacks
- Secure local storage
- Use secure cookies
- Regular dependency updates

### Backend

- Use strong passwords
- Implement rate limiting
- Use parameterized queries
- Validate inputs
- Use CORS properly
- Enable CSRF protection
- Keep dependencies updated
- Use security headers

---

## Support & Resources

### Documentation

- [Frontend README](./README.md)
- [Backend Setup](./backend/BACKEND_SETUP.md)
- [API Documentation](./backend/API_DOCUMENTATION.md)
- [Features Guide](./FEATURES.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)

### External Resources

- React: https://react.dev
- Flask: https://flask.palletsprojects.com/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Docker: https://docs.docker.com/

---

## Quick Reference

### Start Everything (Docker)

```bash
docker-compose up -d
npm install && npm run dev  # In another terminal
```

### Stop Everything

```bash
docker-compose down
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec api python init_db.py
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | patient@example.com / demo |
| Backend | http://localhost:5000 | N/A (JWT tokens) |
| PostgreSQL | localhost:5432 | healthcare_user / healthcare_password |
| Redis | localhost:6379 | N/A |
| pgAdmin | http://localhost:5050 | admin@example.com / admin |

---

## Conclusion

You now have a fully functional AI Healthcare Ecosystem with:

✅ Production-ready frontend
✅ Scalable backend API
✅ Database with multiple tables
✅ AI-powered services
✅ Cloud storage support
✅ Async task processing
✅ Comprehensive documentation

Start building and customizing for your use case!

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
