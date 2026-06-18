# TODO - AI Hospital ecosystem FE/BE connection

- [x] Update Zustand stores to use backend API instead of mock arrays
  - [x] `src/store/appointmentStore.ts`
  - [x] `src/store/medicalStore.ts`
- [ ] Update pages to use API-backed data and real actions
  - [x] `src/pages/AppointmentBooking.tsx`
  - [ ] `src/pages/MedicalReports.tsx`
  - [ ] `src/pages/Prescriptions.tsx`
  - [ ] `src/pages/SymptomChecker.tsx` (call `/api/ai/symptom-check`)
  - [ ] `src/pages/ReportSummarization.tsx` (call `/api/ai/summarize-report`)
- [x] Persist auth + set token on app load
  - [x] Ensure `useAuthStore` reads token/user and calls `/api/auth/me` on startup
- [ ] Quick manual verification steps
  - [ ] Start backend
  - [ ] Start frontend
  - [ ] Login flow works against backend JWT
  - [ ] Appointments/reports/prescriptions CRUD work

