import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMedicalStore } from '../store/medicalStore';
import { FileText, ArrowLeft, Download, Upload, Eye, Trash2 } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'x_ray', label: 'X-Ray' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'mri', label: 'MRI' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'other', label: 'Other' },
];

export const MedicalReports = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const reports = useMedicalStore((state) => state.getReports(user?.id || ''));
  const uploadReport = useMedicalStore((state) => state.uploadReport);
  const refreshReports = useMedicalStore((state) => state.refreshReports);
  const deleteReport = useMedicalStore((state) => state.deleteReport);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lab_test',
    title: '',
    description: '',
    file: null as File | null,
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch reports from backend on mount
  useEffect(() => {
    refreshReports({ patient_id: user?.id });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.file) {
      return;
    }

    try {
      await uploadReport({
        patient_id: user?.id || '',
        report_type: formData.type,
        title: formData.title,
        description: formData.description,
        file: formData.file,
      });
      setSuccessMessage('Report uploaded successfully!');
      setFormData({
        type: 'lab_test',
        title: '',
        description: '',
        file: null,
      });
      setShowUploadForm(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await deleteReport(reportId);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const isDoctor = user?.role === 'doctor';

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
              <FileText className="w-8 h-8 text-orange-600" />
              <h1 className="text-2xl font-bold text-gray-800">Medical Reports</h1>
            </div>
            {isDoctor && (
              <button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                Upload Report
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

        {/* Upload Form */}
        {showUploadForm && isDoctor && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Upload Medical Report</h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Complete Blood Count"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add details about the report findings"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File (PDF, Image) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full"
                    required
                  />
                  {formData.file && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {formData.file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Upload Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {isDoctor ? 'Patient Reports' : 'Your Medical Reports'}
          </h2>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {isDoctor ? 'No reports uploaded yet' : 'No medical reports available'}
              </p>
              {isDoctor && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload First Report
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl mt-1">📄</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{report.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Type: <span className="font-medium">{report.report_type?.replace('_', ' ') || 'N/A'}</span>
                            </span>
                            <span>
                              Date: <span className="font-medium">{report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}</span>
                            </span>
                            <span>
                              By: <span className="font-medium">{report.doctorName || 'Doctor'}</span>
                            </span>
                          </div>

                          {report.ai_summary && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm">
                                <span className="font-semibold text-blue-900">AI Summary:</span>
                                <span className="text-blue-800"> {report.ai_summary}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition">
                        <Download className="w-5 h-5" />
                      </button>
                      {isDoctor && (
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report Statistics */}
        {reports.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 text-sm">Total Reports</p>
              <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 text-sm">Latest Report</p>
              <p className="text-lg font-semibold text-gray-800">
                {reports[reports.length - 1]?.title}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 text-sm">Report Types</p>
              <p className="text-3xl font-bold text-green-600">
                {new Set(reports.map((r) => r.report_type)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 text-sm">With AI Summary</p>
              <p className="text-3xl font-bold text-orange-600">
                {reports.filter((r) => r.ai_summary).length}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};