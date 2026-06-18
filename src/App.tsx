import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { SymptomChecker } from './pages/SymptomChecker';
import { AppointmentBooking } from './pages/AppointmentBooking';
import { MedicalReports } from './pages/MedicalReports';
import { Prescriptions } from './pages/Prescriptions';
import { ReportSummarization } from './pages/ReportSummarization';

function App() {
  const { user, isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    // Hydrate auth state from persisted JWT (if present)
    void hydrate();
  }, [hydrate]);


  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {isAuthenticated ? (
          <>
            <Route
              path="/"
              element={
                user?.role === 'doctor' ? (
                  <DoctorDashboard />
                ) : (
                  <PatientDashboard />
                )
              }
            />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/appointments" element={<AppointmentBooking />} />
            <Route path="/medical-reports" element={<MedicalReports />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/report-summarization" element={<ReportSummarization />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
