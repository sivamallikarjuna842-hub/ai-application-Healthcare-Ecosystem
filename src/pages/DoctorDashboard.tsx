import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useMedicalStore } from '../store/medicalStore';
import {
  Users,
  Calendar,
  Activity,
  FileText,
  Pill,
  LogOut,
  Clock,
  Plus,
} from 'lucide-react';

export const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState<'appointments' | 'reports'>('appointments');

  const allAppointments = useAppointmentStore((state) =>
    state.getAppointments(user?.id || '', 'doctor')
  );
  const refreshAppointments = useAppointmentStore((state) => state.refresh);

  // Fetch data from backend on mount
  useEffect(() => {
    refreshAppointments('doctor');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const upcomingAppointments = allAppointments.filter(
    (apt) => apt.status === 'scheduled'
  );

  const completedAppointments = allAppointments.filter(
    (apt) => apt.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.specialty}</p>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/medical-reports')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <FileText className="w-8 h-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Upload Report</h3>
            <p className="text-sm text-gray-600">Add patient medical reports</p>
          </button>

          <button
            onClick={() => navigate('/prescriptions')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <Pill className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Prescriptions</h3>
            <p className="text-sm text-gray-600">Manage prescriptions</p>
          </button>

          <button
            onClick={() => navigate('/report-summarization')}
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
          >
            <Activity className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800">AI Summarizer</h3>
            <p className="text-sm text-gray-600">Auto-summarize reports</p>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-800">{allAppointments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600">{upcomingAppointments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedAppointments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Unique Patients</p>
            <p className="text-3xl font-bold text-orange-600">
              {new Set(allAppointments.map((a) => a.patientId)).size}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setSelectedTab('appointments')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'appointments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Appointments
              </button>
              <button
                onClick={() => setSelectedTab('reports')}
                className={`py-4 px-2 border-b-2 font-medium transition ${
                  selectedTab === 'reports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Reports
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {selectedTab === 'appointments' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Upcoming Appointments</h2>

                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming appointments
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{apt.patientName}</h3>
                            <p className="text-sm text-gray-600 mt-1">{apt.reason}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                              <Clock className="w-4 h-4" />
                              {apt.date} at {apt.time}
                            </div>
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Scheduled
                          </span>
                        </div>
                        {apt.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {apt.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'reports' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Patient Reports</h2>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No reports uploaded yet</p>
                  <button
                    onClick={() => navigate('/medical-reports')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
