# Development Guide - AI Healthcare Ecosystem

## Table of Contents

1. [Project Setup](#project-setup)
2. [Architecture Overview](#architecture-overview)
3. [Component Guide](#component-guide)
4. [State Management](#state-management)
5. [Adding Features](#adding-features)
6. [Integration Steps](#integration-steps)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Project Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd ai-healthcare-ecosystem

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Environment Variables

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:5000
VITE_STORAGE_BUCKET=medical-reports-bucket
VITE_APP_ENV=development
```

---

## Architecture Overview

### Application Structure

```
AI Healthcare Ecosystem
├── Frontend (React + Vite)
│   ├── Pages (UI Components)
│   ├── Store (State Management)
│   └── Utils (Helpers)
├── Backend (Node.js/Python)
│   ├── Authentication
│   ├── API Routes
│   └── Database
├── AI Services (Python/ML)
│   ├── Symptom Analysis
│   ├── Report Summarization
│   └── Diagnosis Support
└── Cloud Storage
    └── Medical Records
```

### Data Flow

```
User Input
    ↓
React Component
    ↓
Zustand Store
    ↓
API Call
    ↓
Backend Processing
    ↓
Database/AI Service
    ↓
Response
    ↓
Store Update
    ↓
Component Re-render
```

---

## Component Guide

### Page Components

#### LoginPage.tsx
```typescript
// Location: src/pages/LoginPage.tsx
// Purpose: User authentication
// Key Features:
//   - Email/password login
//   - Role selection (patient/doctor)
//   - Demo credentials display
//   - Error handling
```

**Usage:**
```typescript
<LoginPage />
```

#### PatientDashboard.tsx
```typescript
// Purpose: Patient main interface
// Features:
//   - Quick action buttons
//   - Appointment overview
//   - Medical reports summary
//   - Prescription tracking
//   - Health statistics
```

#### DoctorDashboard.tsx
```typescript
// Purpose: Doctor main interface
// Features:
//   - Appointment management
//   - Patient reports
//   - Statistics dashboard
//   - Prescription creation
```

#### SymptomChecker.tsx
```typescript
// Purpose: AI-powered symptom analysis
// Features:
//   - Symptom selection
//   - AI analysis
//   - Severity assessment
//   - Action recommendations
//   - Emergency indicators
```

#### AppointmentBooking.tsx
```typescript
// Purpose: Appointment scheduling
// Features:
//   - Doctor selection
//   - Date/time picker
//   - Appointment form
//   - Booking confirmation
```

#### MedicalReports.tsx
```typescript
// Purpose: Report management
// Features:
//   - Report upload (doctor)
//   - Report viewing (both)
//   - Multiple file types
//   - Report metadata
```

#### Prescriptions.tsx
```typescript
// Purpose: Prescription management
// Features:
//   - Create prescriptions (doctor)
//   - View prescriptions (patient)
//   - Medication tracking
//   - Status management
```

#### ReportSummarization.tsx
```typescript
// Purpose: AI report analysis
// Features:
//   - Report selection
//   - AI summary generation
//   - Key findings extraction
//   - Copy to clipboard
```

---

## State Management

### Using Zustand Stores

#### Authentication Store

```typescript
import { useAuthStore } from '../store/authStore';

// In component:
const { user, isAuthenticated, login, logout } = useAuthStore();

// Usage:
login({
  id: 'p1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'patient'
});

logout();
```

#### Appointment Store

```typescript
import { useAppointmentStore } from '../store/appointmentStore';

// Get appointments:
const appointments = useAppointmentStore(state => 
  state.getAppointments(userId, role)
);

// Add appointment:
const addAppointment = useAppointmentStore(state => state.addAppointment);
addAppointment({
  id: '1',
  patientId: 'p1',
  doctorId: 'd1',
  // ... other fields
});

// Update appointment:
const updateAppointment = useAppointmentStore(state => state.updateAppointment);
updateAppointment(id, { status: 'completed' });
```

#### Medical Store

```typescript
import { useMedicalStore } from '../store/medicalStore';

// Get reports:
const reports = useMedicalStore(state => state.getReports(patientId));

// Add report:
const addReport = useMedicalStore(state => state.addReport);
addReport({
  id: '1',
  patientId: 'p1',
  // ... other fields
});

// Get prescriptions:
const prescriptions = useMedicalStore(state => 
  state.getPrescriptions(patientId)
);

// Add prescription:
const addPrescription = useMedicalStore(state => state.addPrescription);
addPrescription({
  id: '1',
  patientId: 'p1',
  // ... other fields
});
```

---

## Adding Features

### Add a New Page

1. Create component file:
```typescript
// src/pages/NewFeature.tsx
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft } from 'lucide-react';

export const NewFeature = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Your component JSX */}
    </div>
  );
};
```

2. Add route in App.tsx:
```typescript
import { NewFeature } from './pages/NewFeature';

// In Routes:
<Route path="/new-feature" element={<NewFeature />} />
```

3. Add navigation link:
```typescript
<button onClick={() => navigate('/new-feature')}>
  New Feature
</button>
```

### Add New State

1. Create store file:
```typescript
// src/store/featureStore.ts
import { create } from 'zustand';

interface Feature {
  id: string;
  name: string;
}

interface FeatureState {
  features: Feature[];
  addFeature: (feature: Feature) => void;
  getFeatures: () => Feature[];
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  features: [],
  addFeature: (feature) =>
    set((state) => ({
      features: [...state.features, feature],
    })),
  getFeatures: () => get().features,
}));
```

2. Use in component:
```typescript
import { useFeatureStore } from '../store/featureStore';

const MyComponent = () => {
  const features = useFeatureStore(state => state.getFeatures());
  const addFeature = useFeatureStore(state => state.addFeature);
  
  // Component logic
};
```

---

## Integration Steps

### Backend Integration

1. **Replace API URLs:**
```typescript
// Before (demo):
const mockUsers: any = { ... };

// After (real API):
const response = await axios.post(
  `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
  { email, password, role }
);
```

2. **Add Axios Instance:**
```typescript
// src/api/client.ts
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

3. **Use in Components:**
```typescript
import client from '../api/client';

const handleLogin = async (email, password) => {
  const response = await client.post('/auth/login', {
    email,
    password,
    role: 'patient'
  });
  
  login(response.data.user);
};
```

### AI Service Integration

1. **Symptom Analysis:**
```typescript
// src/api/aiService.ts
import axios from 'axios';

export const analyzeSymptoms = async (symptoms: string[]) => {
  const response = await axios.post(
    `${import.meta.env.VITE_AI_SERVICE_URL}/symptoms/analyze`,
    { symptoms }
  );
  return response.data;
};
```

2. **Report Summarization:**
```typescript
export const summarizeReport = async (
  reportId: string,
  reportContent: string
) => {
  const response = await axios.post(
    `${import.meta.env.VITE_AI_SERVICE_URL}/reports/summarize`,
    { reportId, reportContent }
  );
  return response.data;
};
```

### Cloud Storage Integration

```typescript
// src/api/storage.ts
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
  secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
});

export const uploadFile = async (file: File, patientId: string) => {
  const key = `reports/${patientId}/${Date.now()}-${file.name}`;
  
  const params = {
    Bucket: import.meta.env.VITE_STORAGE_BUCKET,
    Key: key,
    Body: file,
    ContentType: file.type,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

export const downloadFile = async (key: string) => {
  const params = {
    Bucket: import.meta.env.VITE_STORAGE_BUCKET,
    Key: key,
  };

  const url = s3.getSignedUrl('getObject', params);
  return url;
};
```

---

## Testing

### Component Testing

```typescript
// Example test with Vitest
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('should login with valid credentials', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'patient@example.com');
    await userEvent.type(passwordInput, 'demo');
    await userEvent.click(submitButton);

    // Add assertions
  });
});
```

### Store Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  it('should login and store user', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login({
        id: 'p1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'patient',
      });
    });

    expect(result.current.user?.name).toBe('John Doe');
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

---

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup for Production

Create `.env.production`:

```env
VITE_API_BASE_URL=https://api.healthcare-ecosystem.com
VITE_AI_SERVICE_URL=https://ai.healthcare-ecosystem.com
VITE_STORAGE_BUCKET=medical-reports-prod
VITE_APP_ENV=production
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const SymptomChecker = lazy(() =>
  import('./pages/SymptomChecker').then(m => ({ 
    default: m.SymptomChecker 
  }))
);

// In Routes:
<Suspense fallback={<Loading />}>
  <SymptomChecker />
</Suspense>
```

### Image Optimization

```typescript
// Use WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.png" alt="description" />
</picture>
```

### Bundle Analysis

```bash
npm install --save-dev vite-plugin-visualizer

// In vite.config.ts:
import { visualizer } from 'vite-plugin-visualizer';

export default {
  plugins: [visualizer()],
};
```

---

## Debugging

### Browser DevTools

1. Open Chrome DevTools: `F12`
2. React DevTools: Install extension
3. Redux DevTools: For state debugging

### Logging

```typescript
// Add logging utility:
// src/utils/logger.ts
export const logger = {
  debug: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${msg}`, data);
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error);
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[WARN] ${msg}`, data);
  },
};
```

---

## Best Practices

1. **Component Design**
   - Keep components small and focused
   - Use custom hooks for logic
   - Props over global state when possible

2. **State Management**
   - Use stores only for global state
   - Keep state normalized
   - Update atomically

3. **Performance**
   - Use React.memo for heavy components
   - Lazy load routes
   - Optimize re-renders

4. **Security**
   - Never store sensitive data in localStorage
   - Use secure HTTP-only cookies
   - Validate all inputs
   - Sanitize outputs

5. **Code Quality**
   - Use TypeScript strictly
   - Write meaningful variable names
   - Add JSDoc comments
   - Keep functions pure

---

## Troubleshooting

### Common Issues

**Issue: Blank page after login**
- Check auth store initialization
- Verify route configuration
- Check browser console for errors

**Issue: API calls failing**
- Verify base URL in environment
- Check CORS configuration
- Ensure token is being sent

**Issue: Styles not applied**
- Rebuild Tailwind: `npm run dev`
- Check class names
- Clear browser cache

---

## Support

For development help:
1. Check TypeScript errors
2. Review component props
3. Check store selectors
4. Review network requests
5. Check browser console

---

**Happy Coding! 🚀**
