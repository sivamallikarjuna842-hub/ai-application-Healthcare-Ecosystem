import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { api } from '../utils/api';
import { Calendar, Clock, ArrowLeft, Plus } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  email: string;
  role: string;
  doctor_profile?: {
    specialty: string;
    consultation_fee: number;
    rating: number;
    experience_years: number;
  };
}

export const AppointmentBooking = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const createAppointment = useAppointmentStore((state) => state.createAppointment);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [formData, setFormData] = useState({
    selectedDoctor: null as Doctor | null,
    date: '',
    time: '',
    reason: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch doctors from backend API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        const data = res.data;
        setDoctors(data?.data || []);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleDoctorSelect = (doctor: Doctor) => {
    setFormData((prev) => ({
      ...prev,
      selectedDoctor: doctor,
      time: '',
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedDoctor || !formData.date || !formData.time || !formData.reason) {
      return;
    }

    await createAppointment({
      doctor_id: formData.selectedDoctor.id,
      appointment_date: formData.date,
      appointment_time: formData.time,
      reason: formData.reason,
    });

    setSuccessMessage(`Appointment booked successfully with ${formData.selectedDoctor.name}!`);

    setFormData({
      selectedDoctor: null,
      date: '',
      time: '',
      reason: '',
    });

    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Get maximum date (30 days from today)
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Book an Appointment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Select a Doctor</h2>

              {loadingDoctors ? (
                <div className="text-center py-8 text-gray-500">Loading doctors...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        formData.selectedDoctor?.id === doctor.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-3xl">👨‍⚕️</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.doctor_profile?.specialty || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        {doctor.doctor_profile?.experience_years || 0}+ years experience
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Appointment Details */}
            {formData.selectedDoctor && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Appointment Details</h2>

                <form onSubmit={handleSubmit}>
                  {/* Doctor Info */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Selected Doctor</p>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">👨‍⚕️</span>
                      {formData.selectedDoctor.name} ({formData.selectedDoctor.doctor_profile?.specialty || 'General'})
                    </p>
                  </div>

                  {/* Date */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={today}
                      max={maxDate}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  {/* Time Slot */}
                  {formData.date && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Preferred Time * <span className="text-gray-400 font-normal">(HH:MM AM/PM)</span>
                      </label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  )}

                  {/* Reason for Visit */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Visit *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Describe your symptoms or reason for the appointment"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!formData.date || !formData.time || !formData.reason}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Confirm Appointment
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar - Appointment Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">📋 Appointment Info</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-600">Duration</p>
                  <p>30 minutes</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Consultation Type</p>
                  <p>Online Video Call</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Cost</p>
                  <p className="text-green-600 font-semibold">Free Consultation</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3">💡 Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Have your medical history ready</li>
                <li>✓ List current medications</li>
                <li>✓ Prepare your symptoms</li>
                <li>✓ Be in a quiet environment</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-800 mb-3">How It Works</h3>
              <ol className="text-sm text-gray-700 space-y-2">
                <li>1. Select a doctor</li>
                <li>2. Choose date & time</li>
                <li>3. Describe your symptoms</li>
                <li>4. Confirm appointment</li>
                <li>5. Receive video link</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
