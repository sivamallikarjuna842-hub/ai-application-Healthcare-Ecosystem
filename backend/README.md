# AI Healthcare Ecosystem — Backend (Flask + JWT + AI)

This backend is a **Flask** REST API for the AI Healthcare Ecosystem. It provides:

- Authentication (JWT)
- Patient/Doctor user management
- Appointments
- Medical report storage (with a storage abstraction)
- Prescription management
- AI endpoints for symptom analysis and medical report summarization

> For backend-agnostic, full-stack setup steps, see the repository root **README.md** and **FULL_STACK_SETUP.md**.

---

## Tech Stack

- Python 3.11+
- Flask
- Flask-JWT-Extended
- Flask-SQLAlchemy
- SQLAlchemy models
- CORS
- (Optional in config) Redis + Celery

---

## Prerequisites

- Python **3.11+**
- (Recommended) PostgreSQL
- Redis (optional, depending on your config)

---

## Setup (Backend only)

From the repo root:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend:

```bash
python app.py
```

API base URL:
- http://localhost:5000

Health check:
- GET http://localhost:5000/health

---

## Configuration

Environment variables are loaded by `backend/config.py` via `os.getenv(...)`.

Common variables:

- `FLASK_ENV` (`development`, `testing`, `production`)
- `DATABASE_URL` (defaults to `sqlite:///healthcare.db`)
- `JWT_SECRET_KEY`
- `REDIS_URL`
- `MAX_FILE_SIZE`
- `ALLOWED_EXTENSIONS`
- `UPLOAD_FOLDER`
- AI model files:
  - `SYMPTOM_CHECKER_MODEL`
  - `REPORT_SUMMARIZER_MODEL`

---

## Demo Data

On app startup, the backend seeds demo users if none exist:

- **Patient**: patient@example.com / demo
- **Doctor**: doctor@example.com / demo

---

## API Authentication

Protected endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

JWT access token lifecycle (from config):
- Access token: 1 hour
- Refresh token: 30 days

---

## API Overview (Routes)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`

### AI
- `POST /api/ai/symptom-check`
- `GET  /api/ai/symptom-history`
- `GET  /api/ai/symptom-analysis/<analysis_id>`
- `POST /api/ai/summarize-report`
- `POST /api/ai/summarize-bulk`

### Medical Reports
- `GET    /api/reports` (list)
- `GET    /api/reports/<report_id>`
- `POST   /api/reports` (upload)
- `PUT    /api/reports/<report_id>`
- `DELETE /api/reports/<report_id>`
- `GET    /api/reports/<report_id>/download`

### Prescriptions
- `GET    /api/prescriptions`
- `GET    /api/prescriptions/<prescription_id>`
- `POST   /api/prescriptions`
- `PUT    /api/prescriptions/<prescription_id>`
- `DELETE /api/prescriptions/<prescription_id>`

### Users / Doctors / Patients
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/patients` (doctor)
- `GET /api/doctors` (public)

---

## Key Backend Files

- `backend/app.py` — Flask app factory + blueprint registration
- `backend/config.py` — config and environment defaults
- `backend/routes/*` — route handlers (auth, users, reports, prescriptions, ai, etc.)
- `backend/services/storage_service.py` — file upload/download abstraction

---

## Development Commands

```bash
# run server
python app.py
```

---

## Troubleshooting

### CORS errors

Ensure frontend origin is allowed in the backend CORS config.

### JWT errors

- Confirm you are sending the access token.
- Ensure the `JWT_SECRET_KEY` matches between runs.

---

## License

See the root repository LICENSE (if present) or project documentation files.

