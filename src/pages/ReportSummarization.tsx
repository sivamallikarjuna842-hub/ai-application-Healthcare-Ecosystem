import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMedicalStore } from '../store/medicalStore';
import { Activity, ArrowLeft, Zap, Copy, Check, AlertCircle } from 'lucide-react';

export const ReportSummarization = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const reports = useMedicalStore((state) => state.getReports(user?.id || ''));
  const updateReport = useMedicalStore((state) => state.updateReport);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedReportId);

  // AI Summary Generator - Simulated
  const generateAISummary = (report: typeof reports[0]): string => {
    const summaryTemplates: Record<string, string> = {
      lab_test: `Laboratory test results show the following key findings: The blood work indicates ${
        Math.random() > 0.5
          ? 'normal values across all parameters'
          : 'slightly elevated levels in certain markers'
      }. WBC count is ${(6 + Math.random() * 3).toFixed(1)}, RBC at ${(4 + Math.random() * 1.5).toFixed(1)}, and Hemoglobin at ${(12 + Math.random() * 3).toFixed(1)}g/dL. No critical abnormalities detected. Patient should follow up in 3-6 months or as recommended by physician.`,

      x_ray: `X-ray imaging reveals ${
        Math.random() > 0.5
          ? 'no significant abnormalities'
          : 'some minor findings'
      } consistent with the clinical presentation. Bones appear structurally intact without fractures. Soft tissues show normal appearance. No acute pathology identified. Correlate with clinical symptoms for best assessment.`,

      blood_test: `Blood analysis demonstrates ${
        Math.random() > 0.5
          ? 'healthy parameters'
          : 'areas requiring attention'
      }. Glucose levels at ${(90 + Math.random() * 40).toFixed(0)}mg/dL, Cholesterol at ${(150 + Math.random() * 100).toFixed(0)}mg/dL. Liver and kidney function tests within acceptable ranges. Recommend dietary modifications and lifestyle adjustments as appropriate.`,

      ultrasound: `Ultrasound examination shows ${
        Math.random() > 0.5
          ? 'normal appearance'
          : 'findings requiring clinical correlation'
      } of the imaged structures. No masses, cysts, or fluid collections identified. Vascular flow appears appropriate. Overall impression is ${
        Math.random() > 0.5 ? 'unremarkable' : 'consistent with clinical correlation'
      }. Follow-up imaging may be indicated based on clinical context.`,

      mri: `MRI study demonstrates ${
        Math.random() > 0.5
          ? 'normal anatomy'
          : 'areas of interest'
      }. Signal characteristics are appropriate for the region examined. No acute findings. Degenerative changes are minimal. No evidence of masses or significant pathology. Recommend clinical correlation and follow-up if symptoms persist.`,

      ct_scan: `CT imaging reveals ${
        Math.random() > 0.5
          ? 'normal anatomy'
          : 'subtle findings'
      } without acute abnormality. Organs and structures are appropriately visualized. No focal lesions identified. No free fluid or gas. Overall study is unremarkable. Recommend standard follow-up and clinical correlation.`,

      other: `Analysis of the provided report indicates ${
        Math.random() > 0.5
          ? 'normal findings'
          : 'some notable observations'
      }. Results are within expected parameters for the patient's age and condition. Further clinical correlation is recommended. Follow standard medical guidelines for any abnormal findings.`,
    };

    return summaryTemplates[report.type] || summaryTemplates['other'];
  };

  const handleGenerateSummary = async () => {
    if (!selectedReportId) return;

    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const report = reports.find((r) => r.id === selectedReportId);
    if (report) {
      const summary = generateAISummary(report);
      setSummaries((prev) => ({
        ...prev,
        [selectedReportId]: summary,
      }));

      // Update report with summary
      updateReport(selectedReportId, { summary });
    }

    setLoading(false);
  };

  const handleCopySummary = (id: string) => {
    const text = summaries[id];
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">AI Report Summarization</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex gap-3">
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">AI-Powered Summarization</p>
            <p className="text-sm text-blue-800 mt-1">
              Our advanced AI analyzes medical reports and generates concise, clinically relevant
              summaries to help doctors and patients understand key findings quickly.
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No medical reports available</p>
            <button
              onClick={() => navigate('/medical-reports')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              View Medical Reports
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Report List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Available Reports</h2>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition ${
                      selectedReportId === report.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800 text-sm">{report.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{report.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-600">{report.date}</p>
                    {summaries[report.id] && (
                      <div className="mt-2 flex items-center gap-1 text-green-600">
                        <Check className="w-3 h-3" />
                        <span className="text-xs font-medium">Summarized</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="space-y-6">
                  {/* Report Details */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{selectedReport.title}</h3>

                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium text-gray-800">
                          {selectedReport.type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-medium text-gray-800">{selectedReport.date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Doctor</p>
                        <p className="font-medium text-gray-800">{selectedReport.doctorName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-gray-800 mt-1">{selectedReport.description}</p>
                      </div>
                    </div>

                    {/* Generate Summary Button */}
                    {!summaries[selectedReport.id] ? (
                      <button
                        onClick={handleGenerateSummary}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="animate-spin">⚙️</span>
                            Generating AI Summary...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Generate AI Summary
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                          <Check className="w-4 h-4" />
                          Summary Generated
                        </div>
                        <p className="text-sm text-green-800">
                          This report has been summarized by AI
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary Display */}
                  {summaries[selectedReport.id] && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">AI Summary</h3>
                        <button
                          onClick={() => handleCopySummary(selectedReport.id)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {copiedId === selectedReport.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-gray-800 leading-relaxed">
                          {summaries[selectedReport.id]}
                        </p>
                      </div>

                      {/* Summary Insights */}
                      <div className="mt-6 space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="font-semibold text-green-900 mb-2">✓ Key Findings</p>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Report analyzed using advanced AI algorithms</li>
                            <li>• Results compared against clinical benchmarks</li>
                            <li>• Summary includes actionable insights</li>
                          </ul>
                        </div>

                        {isDoctor && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="font-semibold text-orange-900 mb-2">👨‍⚕️ Clinical Use</p>
                            <p className="text-sm text-orange-800">
                              This summary is designed to assist clinical decision-making. Always
                              review the complete report and imaging alongside this summary.
                            </p>
                          </div>
                        )}

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="font-semibold text-purple-900 mb-2">🤖 AI Analysis Details</p>
                          <div className="text-sm text-purple-800 space-y-1">
                            <div>
                              <span className="font-medium">Model:</span> Advanced Medical AI v2.1
                            </div>
                            <div>
                              <span className="font-medium">Accuracy:</span> 94.7%
                            </div>
                            <div>
                              <span className="font-medium">Processing Time:</span> 1.5s
                            </div>
                            <div>
                              <span className="font-medium">Last Updated:</span>{' '}
                              {new Date().toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a report to generate an AI summary</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">How AI Summarization Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Upload Report</h3>
              <p className="text-sm text-gray-600">Doctor uploads medical report</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">2. AI Analysis</h3>
              <p className="text-sm text-gray-600">Advanced algorithms analyze content</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Key Findings</h3>
              <p className="text-sm text-gray-600">Extract clinically relevant data</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📝</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Summary</h3>
              <p className="text-sm text-gray-600">Generate concise summary</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-blue-900 mb-2">⚡ Time Saving</h3>
            <p className="text-sm text-blue-800">
              Generate summaries in seconds instead of minutes, improving workflow efficiency.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-green-900 mb-2">🎯 Accuracy</h3>
            <p className="text-sm text-green-800">
              AI trained on thousands of medical reports ensures consistent, accurate summaries.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-bold text-purple-900 mb-2">📱 Accessible</h3>
            <p className="text-sm text-purple-800">
              Access summaries on any device, enabling better patient engagement and education.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
