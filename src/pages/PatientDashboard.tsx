import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useMedicalStore } from '../store/medicalStore';
import {
  Calendar,
  Activity,
  FileText,
  Pill,
  LogOut,
  Plus,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const appointments = useAppointmentStore((state) =>
    state.getAppointments(user?.id || '', 'patient')
  );
  const reports = useMedicalStore((state) => state.getReports(user?.id || ''));
  const prescriptions = useMedicalStore((state) => state.getPrescriptions(user?.id || ''));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Patient Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => navigate('/symptom-checker')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <Activity className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-800">AI Symptom Checker</h3>
            <p className="text-sm text-gray-600">Check symptoms with AI</p>
          </button>

          <button
            onClick={() => navigate('/appointments')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <Calendar className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Book Appointment</h3>
            <p className="text-sm text-gray-600">Schedule with doctors</p>
          </button>

          <button
            onClick={() => navigate('/medical-reports')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <FileText className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Medical Reports</h3>
            <p className="text-sm text-gray-600">View your reports</p>
          </button>

          <button
            onClick={() => navigate('/prescriptions')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <Pill className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Prescriptions</h3>
            <p className="text-sm text-gray-600">Active prescriptions</p>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Upcoming Appointments
              </h2>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No upcoming appointments</p>
                  <button
                    onClick={() => navigate('/appointments')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-800">{apt.doctorName}</h3>
                          <p className="text-sm text-gray-600">{apt.reason}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {apt.date} at {apt.time}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Total Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Medical Reports</p>
                  <p className="text-3xl font-bold text-gray-800">{reports.length}</p>
                </div>
                <FileText className="w-12 h-12 text-orange-100" />
              </div>
              <button
                onClick={() => navigate('/medical-reports')}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Reports →
              </button>
            </div>

            {/* Active Prescriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Prescriptions</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {prescriptions.filter((p) => p.status === 'active').length}
                  </p>
                </div>
                <Pill className="w-12 h-12 text-red-100" />
              </div>
              <button
                onClick={() => navigate('/prescriptions')}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Prescriptions →
              </button>
            </div>

            {/* Completed Appointments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed Visits</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {appointments.filter((a) => a.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-600" />
              Recent Medical Reports
            </h2>

            <div className="space-y-3">
              {reports.slice(-3).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{report.title}</p>
                    <p className="text-sm text-gray-600">
                      By {report.doctorName} on {report.date}
                    </p>
                  </div>
                  <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                    View
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
