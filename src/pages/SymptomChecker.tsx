import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, AlertCircle, Lightbulb } from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Sore Throat',
  'Headache',
  'Fatigue',
  'Body Aches',
  'Congestion',
  'Runny Nose',
  'Nausea',
  'Dizziness',
  'Shortness of Breath',
  'Chest Pain',
];

const SYMPTOM_ANALYSIS = {
  'Fever,Cough,Sore Throat': {
    condition: 'Common Cold/Flu',
    severity: 'Low to Moderate',
    advice:
      'Rest, stay hydrated, and use over-the-counter medications. See a doctor if symptoms persist beyond 2 weeks.',
    urgency: 'Not urgent',
  },
  'Fever,Cough,Shortness of Breath': {
    condition: 'Respiratory Infection',
    severity: 'Moderate to High',
    advice:
      'Seek medical attention. Could be pneumonia or bronchitis. Get professional evaluation.',
    urgency: 'Schedule appointment soon',
  },
  'Chest Pain,Shortness of Breath': {
    condition: 'Potential Cardiac Issue',
    severity: 'High',
    advice: 'Seek emergency medical care immediately. Do not delay.',
    urgency: 'EMERGENCY - Call 911',
  },
  'Headache,Fever': {
    condition: 'Possible Infection',
    severity: 'Moderate',
    advice:
      'Rest and monitor. Use fever-reducing medications. Seek care if symptoms worsen.',
    urgency: 'Schedule appointment',
  },
  'Fatigue,Body Aches,Fever': {
    condition: 'Viral Illness',
    severity: 'Moderate',
    advice:
      'Rest, stay hydrated, and use supportive care. Recovery typically takes 1-2 weeks.',
    urgency: 'Monitor, see doctor if worsens',
  },
};

export const SymptomChecker = () => {
  const navigate = useNavigate();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getAnalysis = () => {
    const key = selectedSymptoms.sort().join(',');
    return (
      SYMPTOM_ANALYSIS[key as keyof typeof SYMPTOM_ANALYSIS] || {
        condition: 'General Symptoms',
        severity: 'Requires Professional Evaluation',
        advice:
          'Based on your symptoms, it is recommended to consult with a healthcare professional for proper diagnosis and treatment.',
        urgency: 'Schedule appointment with doctor',
      }
    );
  };

  const analysis = getAnalysis();

  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0) return;
    if (!disclaimerAccepted) return;
    setShowResults(true);
  };

  const handleBookAppointment = () => {
    navigate('/appointments', { state: { symptoms: selectedSymptoms } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">AI Symptom Checker</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {!showResults ? (
              <>
                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">Important Disclaimer</p>
                      <p className="text-sm text-yellow-800">
                        This AI symptom checker is for informational purposes only. It is not a
                        substitute for professional medical advice, diagnosis, or treatment. Always
                        consult with a qualified healthcare provider for medical concerns.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Symptom Selection */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Select Your Symptoms</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {COMMON_SYMPTOMS.map((symptom) => (
                      <button
                        key={symptom}
                        onClick={() => toggleSymptom(symptom)}
                        className={`p-3 rounded-lg border-2 transition text-left font-medium ${
                          selectedSymptoms.includes(symptom)
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {symptom}
                      </button>
                    ))}
                  </div>

                  {/* Custom Symptom Input */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional symptoms (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., diarrhea, joint pain"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      I understand this is not medical advice and will consult a healthcare
                      professional if needed
                    </span>
                  </label>
                </div>

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={selectedSymptoms.length === 0 || !disclaimerAccepted}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  Analyze Symptoms
                </button>
              </>
            ) : (
              <>
                {/* Results */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Analysis Results</h2>

                  {/* Selected Symptoms */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Your Symptoms:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Severity Badge */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estimated Severity</p>
                    <p className="text-lg font-bold text-orange-900">{analysis.severity}</p>
                  </div>

                  {/* Condition */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Possible Condition</h3>
                    <p className="text-gray-800 text-lg font-medium">{analysis.condition}</p>
                  </div>

                  {/* Urgency */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Recommended Action</p>
                    <p className="text-gray-800 font-semibold">{analysis.urgency}</p>
                  </div>

                  {/* Advice */}
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex gap-3">
                      <Lightbulb className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-green-900 mb-1">Health Recommendations</p>
                        <p className="text-green-800">{analysis.advice}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowResults(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Check Different Symptoms
                    </button>
                    <button
                      onClick={handleBookAppointment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Book Doctor Appointment
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">💡 Health Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Rest and stay hydrated</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Maintain proper hygiene</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Avoid close contact</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Monitor your symptoms</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Seek professional help when needed</span>
                </li>
              </ul>
            </div>

            {/* When to Seek Help */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-bold text-red-900 mb-4">🚨 Seek Emergency Care If:</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Chest pain or difficulty breathing</li>
                <li>• Severe abdominal pain</li>
                <li>• Confusion or loss of consciousness</li>
                <li>• Severe bleeding</li>
                <li>• Signs of stroke or severe injury</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
