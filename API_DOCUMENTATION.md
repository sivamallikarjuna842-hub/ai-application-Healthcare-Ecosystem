# API Documentation - AI Healthcare Ecosystem

## Overview

This document describes the API integration points and data structures used in the AI Healthcare Ecosystem application.

---

## Authentication API

### Login Endpoint

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "demo",
  "role": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "p1",
    "name": "John Doe",
    "email": "patient@example.com",
    "role": "patient",
    "avatar": "👨‍💼"
  },
  "token": "jwt_token_here"
}
```

### Logout Endpoint

```http
POST /api/auth/logout
```

---

## Appointment API

### Get All Appointments

```http
GET /api/appointments?userId={userId}&role={role}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "patientId": "p1",
      "patientName": "John Doe",
      "doctorId": "d1",
      "doctorName": "Dr. Sarah Johnson",
      "date": "2024-01-20",
      "time": "10:00 AM",
      "reason": "Regular checkup",
      "status": "scheduled",
      "notes": ""
    }
  ]
}
```

### Create Appointment

```http
POST /api/appointments
```

**Request Body:**
```json
{
  "patientId": "p1",
  "patientName": "John Doe",
  "doctorId": "d1",
  "doctorName": "Dr. Sarah Johnson",
  "date": "2024-01-20",
  "time": "10:00 AM",
  "reason": "Regular checkup"
}
```

**Response:**
```json
{
  "success": true,
  "appointment": {
    "id": "new_id",
    "status": "scheduled",
    "confirmationNumber": "APT-2024-001"
  }
}
```

### Update Appointment

```http
PUT /api/appointments/{appointmentId}
```

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Patient in good health"
}
```

### Cancel Appointment

```http
DELETE /api/appointments/{appointmentId}
```

---

## Medical Reports API

### Upload Medical Report

```http
POST /api/reports/upload
```

**Request (Form Data):**
```
file: [file]
title: "Complete Blood Count"
description: "Routine blood work"
type: "blood_test"
patientId: "p1"
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "r1",
    "title": "Complete Blood Count",
    "fileUrl": "https://storage.example.com/reports/r1.pdf",
    "uploadedAt": "2024-01-15"
  }
}
```

### Get Patient Reports

```http
GET /api/reports?patientId={patientId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "patientId": "p1",
      "title": "Complete Blood Count",
      "type": "blood_test",
      "date": "2024-01-10",
      "fileUrl": "https://storage.example.com/reports/r1.pdf",
      "summary": "CBC results show all values within normal range"
    }
  ]
}
```

### Get Report Details

```http
GET /api/reports/{reportId}
```

### Delete Report

```http
DELETE /api/reports/{reportId}
```

---

## AI Symptom Checker API

### Analyze Symptoms

```http
POST /api/ai/symptom-check
```

**Request Body:**
```json
{
  "symptoms": ["Fever", "Cough", "Sore Throat"],
  "duration": "3 days",
  "age": 35,
  "medicalHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "possibleConditions": [
      {
        "name": "Common Cold",
        "probability": 0.85,
        "severity": "Low to Moderate"
      },
      {
        "name": "Flu",
        "probability": 0.65,
        "severity": "Moderate"
      }
    ],
    "urgency": "Not urgent",
    "recommendations": [
      "Rest and stay hydrated",
      "Use over-the-counter medications",
      "See a doctor if symptoms persist beyond 2 weeks"
    ],
    "disclaimer": "This is not medical advice..."
  }
}
```

---

## Report Summarization API

### Generate AI Summary

```http
POST /api/ai/summarize-report
```

**Request Body:**
```json
{
  "reportId": "r1",
  "reportType": "blood_test",
  "reportContent": "WBC: 7.2, RBC: 4.8, HGB: 13.5..."
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "id": "summary_1",
    "reportId": "r1",
    "summary": "Laboratory test results show the following key findings: The blood work indicates normal values...",
    "keyFindings": [
      "WBC within normal range",
      "RBC levels stable",
      "Hemoglobin adequate"
    ],
    "confidence": 0.947,
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Prescription API

### Create Prescription

```http
POST /api/prescriptions
```

**Request Body:**
```json
{
  "patientId": "p1",
  "patientName": "John Doe",
  "doctorId": "d1",
  "doctorName": "Dr. Sarah Johnson",
  "medications": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days"
    },
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "Once daily",
      "duration": "30 days"
    }
  ],
  "instructions": "Take with food. Avoid alcohol."
}
```

**Response:**
```json
{
  "success": true,
  "prescription": {
    "id": "px1",
    "status": "active",
    "createdAt": "2024-01-15"
  }
}
```

### Get Patient Prescriptions

```http
GET /api/prescriptions?patientId={patientId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "px1",
      "patientName": "John Doe",
      "doctorName": "Dr. Sarah Johnson",
      "date": "2024-01-15",
      "medications": [
        {
          "name": "Lisinopril",
          "dosage": "10mg",
          "frequency": "Once daily",
          "duration": "30 days"
        }
      ],
      "instructions": "Take with food",
      "status": "active"
    }
  ]
}
```

### Update Prescription Status

```http
PUT /api/prescriptions/{prescriptionId}
```

**Request Body:**
```json
{
  "status": "completed"
}
```

### Delete Prescription

```http
DELETE /api/prescriptions/{prescriptionId}
```

---

## Doctor API

### Get All Doctors

```http
GET /api/doctors
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "d1",
      "name": "Dr. Sarah Johnson",
      "specialty": "General Medicine",
      "licenseNumber": "MD123456",
      "available": true,
      "availableSlots": ["10:00 AM", "11:00 AM", "02:00 PM"],
      "rating": 4.8,
      "consultationFee": 50
    }
  ]
}
```

### Get Doctor Details

```http
GET /api/doctors/{doctorId}
```

### Get Doctor's Patients

```http
GET /api/doctors/{doctorId}/patients
```

---

## Patient API

### Get Patient Profile

```http
GET /api/patients/{patientId}
```

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": "p1",
    "name": "John Doe",
    "email": "patient@example.com",
    "age": 35,
    "gender": "Male",
    "bloodType": "O+",
    "medicalHistory": ["Hypertension"],
    "allergies": ["Penicillin"],
    "emergencyContact": "Jane Doe"
  }
}
```

### Update Patient Profile

```http
PUT /api/patients/{patientId}
```

**Request Body:**
```json
{
  "age": 36,
  "medicalHistory": ["Hypertension", "Diabetes"],
  "allergies": ["Penicillin", "Aspirin"]
}
```

---

## Dashboard API

### Get Patient Dashboard Data

```http
GET /api/dashboard/patient/{patientId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upcomingAppointments": 2,
    "activePrescrptions": 3,
    "recentReports": 5,
    "completedVisits": 12,
    "nextAppointment": {
      "date": "2024-01-20",
      "doctorName": "Dr. Sarah Johnson"
    }
  }
}
```

### Get Doctor Dashboard Data

```http
GET /api/dashboard/doctor/{doctorId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAppointments": 25,
    "todayAppointments": 4,
    "upcomingAppointments": 8,
    "completedAppointments": 17,
    "totalPatients": 45,
    "newReportsThisWeek": 8
  }
}
```

---

## Error Handling

### Common Error Response

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {}
  }
}
```

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_REQUEST | 400 | Bad request parameters |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## Authentication

All endpoints (except `/api/auth/login`) require Bearer token authentication:

```http
Authorization: Bearer {jwt_token}
```

---

## Rate Limiting

- Rate limit: 1000 requests per hour
- Headers returned:
  - `X-RateLimit-Limit: 1000`
  - `X-RateLimit-Remaining: 999`
  - `X-RateLimit-Reset: 1234567890`

---

## Pagination

List endpoints support pagination:

```http
GET /api/appointments?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Data Types

### Appointment Status
- `scheduled` - Confirmed appointment
- `completed` - Appointment finished
- `cancelled` - Cancelled appointment

### Prescription Status
- `active` - Currently active
- `expired` - Past expiration date
- `completed` - Course completed

### Report Types
- `lab_test` - Laboratory test
- `x_ray` - X-Ray imaging
- `ultrasound` - Ultrasound scan
- `mri` - MRI scan
- `ct_scan` - CT scan
- `blood_test` - Blood test
- `other` - Other types

---

## Integration Guide

### Step 1: Authentication
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role })
});
const { token } = await response.json();
localStorage.setItem('token', token);
```

### Step 2: Make Authenticated Requests
```typescript
const response = await fetch('/api/appointments', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Step 3: Handle Errors
```typescript
if (!response.ok) {
  const error = await response.json();
  console.error(error.message);
}
```

---

## Webhooks (Optional)

Subscribe to events:

```http
POST /api/webhooks/subscribe
```

**Request Body:**
```json
{
  "event": "appointment.created",
  "url": "https://your-server.com/webhook"
}
```

**Events:**
- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `report.uploaded`
- `prescription.created`
- `summary.generated`

---

## Testing

### Test Credentials
- Email: `patient@example.com`
- Password: `demo`

### Test Data Included
- 2 sample appointments
- 1 sample medical report
- 1 sample prescription
- 4 available doctors

---

## Support

For API issues:
1. Check error codes
2. Verify authentication token
3. Review request format
4. Check rate limits
5. Contact support team

---

**Last Updated**: January 2024
**API Version**: 1.0
**Status**: Production Ready ✅
