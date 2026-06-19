# AI Healthcare Ecosystem — Frontend (React + TypeScript)

This frontend is the patient/doctor web UI for the **AI Healthcare Ecosystem**. It is built with **React**, **TypeScript**, and **Vite**, and styled with **Tailwind CSS**.

> This README covers frontend-only setup and usage. For full-stack setup, see the repository root **README.md** and **FULL_STACK_SETUP.md**.

---

## Features (Frontend)

- **Role-based landing/dashboard** for Patient and Doctor
- Authentication UI (login)
- Patient flows:
  - Symptom Checker
  - Appointment booking
  - Medical reports browsing
  - Prescription viewing
- Doctor flows:
  - Doctor dashboard
  - Appointment management (via existing pages/stores)
  - Medical report management/upload (via existing pages)
  - Prescription management
  - AI report summarization

---

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Axios (API client)

---

## Prerequisites

- Node.js **16+**
- npm (or yarn)

---

## Setup (Frontend only)

From the repository root:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open:
- http://localhost:5173

---

## Configuration

The frontend reads the backend base URL from Vite env vars:

- `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`)

Create/edit the environment file at the repo root:

```bash
# create if needed
copy .env.local.example .env.local
```

Then set:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> Note: In this repository, `src/utils/api.ts` uses `import.meta.env.VITE_API_BASE_URL`.

---

## Authentication

- The app uses a JWT token stored by the `authStore`.
- API requests attach the token as:

```http
Authorization: Bearer <token>
```

Use demo credentials (also documented in the root README):
- patient@example.com / demo
- doctor@example.com / demo

---

## Key Frontend Files

- `src/App.tsx` — Routing and role-based dashboard selection
- `src/pages/*` — UI pages
- `src/store/*` — Zustand stores
- `src/utils/api.ts` — Axios API client and baseURL configuration
- `src/utils/auth.ts` — Auth helpers/token utilities

---

## Development Commands

```bash
npm run dev
npm run build
npm run preview
```

---

## Troubleshooting

### Port already in use

```bash
npm run dev -- --port 3000
```

### Backend connection fails

- Ensure the backend is running at the URL in `VITE_API_BASE_URL`.
- Confirm CORS is enabled in the backend for the frontend origin.

---

## License

See the root repository LICENSE (if present) or project documentation files.

