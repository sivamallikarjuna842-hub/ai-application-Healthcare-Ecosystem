import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMedicalStore, Prescription } from '../store/medicalStore';
import { api } from '../utils/api';
import { Pill, ArrowLeft, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

export const Prescriptions = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const prescriptions = useMedicalStore((state) => state.getPrescriptions(user?.id || ''));
  const refreshPrescriptions = useMedicalStore((state) => state.refreshPrescriptions);
  const deletePrescription = useMedicalStore((state) => state.deletePrescription);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch prescriptions from backend on mount
  useEffect(() => {
    refreshPrescriptions();
  }, []);

  const isDoctor = user?.role === 'doctor';

  const handleMedicationChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newMeds = [...formData.medications];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setFormData((prev) => ({
      ...prev,
      medications: newMeds,
    }));
  };

  const addMedicationField = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }],
    }));
  };

  const removeMedicationField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMeds = formData.medications.filter((med) => med.name && med.dosage);
    if (validMeds.length === 0) {
      return;
    }

    try {
      setErrorMessage('');
      await api.post('/prescriptions', {
        patient_id: user?.id || '',
        medications: validMeds,
        instructions: formData.instructions,
      });

      setSuccessMessage('Prescription created successfully!');
      setFormData({
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
      });
      setShowForm(false);
      await refreshPrescriptions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || 'Failed to create prescription');
    }
  };

  const handleDelete = async (prescriptionId: string) => {
    try {
      await deletePrescription(prescriptionId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
            </div>
            {isDoctor && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                New Prescription
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Prescription Form */}
        {showForm && isDoctor && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Create Prescription</h2>

            <form onSubmit={handleSubmit}>
              {/* Medications */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Medications</h3>

                {formData.medications.map((med, index) => (
                  <div
                    key={index}
                    className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) =>
                            handleMedicationChange(index, 'name', e.target.value)
                          }
                          placeholder="e.g., Aspirin"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) =>
                            handleMedicationChange(index, 'dosage', e.target.value)
                          }
                          placeholder="e.g., 500mg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequency *
                        </label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) =>
                            handleMedicationChange(index, 'frequency', e.target.value)
                          }
                          placeholder="e.g., Twice daily"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration *
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) =>
                            handleMedicationChange(index, 'duration', e.target.value)
                          }
                          placeholder="e.g., 7 days"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>
                    </div>

                    {formData.medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicationField(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedicationField}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Medication
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  placeholder="e.g., Take with food, avoid alcohol"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Create Prescription
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Prescriptions List */}
        <div className="grid grid-cols-1 gap-6">
          {prescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {isDoctor ? 'No prescriptions created yet' : 'No active prescriptions'}
              </p>
              {isDoctor && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Prescription
                </button>
              )}
            </div>
          ) : (
            prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      Prescription
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                        prescription.status
                      )}`}
                    >
                      {prescription.status === 'active' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Date: {prescription.prescribed_date ? new Date(prescription.prescribed_date).toLocaleDateString() : 'N/A'}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Medications */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Pill className="w-4 h-4 text-red-600" />
                      Medications
                    </h4>
                    <div className="space-y-3">
                      {prescription.medications?.map((med, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{med.name}</p>
                            <div className="grid grid-cols-3 gap-4 mt-1 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Dosage:</span> {med.dosage}
                              </div>
                              <div>
                                <span className="font-medium">Frequency:</span> {med.frequency}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {med.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  {prescription.instructions && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-blue-900">Special Instructions:</span>
                        <span className="text-blue-800"> {prescription.instructions}</span>
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isDoctor && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDelete(prescription.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Prescription Tips */}
        {!isDoctor && prescriptions.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-4">💊 Medication Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Take medications exactly as prescribed</li>
              <li>✓ Set reminders for medication times</li>
              <li>✓ Do not skip doses</li>
              <li>✓ Keep medications in original containers</li>
              <li>✓ Report any side effects to your doctor</li>
              <li>✓ Never share prescriptions with others</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};