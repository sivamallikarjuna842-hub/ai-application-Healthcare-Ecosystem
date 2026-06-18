import { create } from 'zustand';

export interface MedicalReport {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  type: 'lab_test' | 'x_ray' | 'ultrasound' | 'mri' | 'ct_scan' | 'blood_test' | 'other';
  title: string;
  description: string;
  fileUrl: string;
  summary?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  instructions?: string;
  status: 'active' | 'expired' | 'completed';
}

interface MedicalState {
  reports: MedicalReport[];
  prescriptions: Prescription[];
  addReport: (report: MedicalReport) => void;
  addPrescription: (prescription: Prescription) => void;
  getReports: (patientId: string) => MedicalReport[];
  getPrescriptions: (patientId: string) => Prescription[];
  updateReport: (id: string, updates: Partial<MedicalReport>) => void;
  deletePrescription: (id: string) => void;
}

export const useMedicalStore = create<MedicalState>((set, get) => ({
  reports: [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'John Doe',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-10',
      type: 'blood_test',
      title: 'Complete Blood Count',
      description: 'Routine blood work showing normal levels',
      fileUrl: '/reports/cbc-2024-01-10.pdf',
      summary: 'CBC results show all values within normal range. WBC: 7.2, RBC: 4.8, HGB: 13.5',
    },
  ],
  prescriptions: [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'John Doe',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: '30 days',
        },
        {
          name: 'Aspirin',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '30 days',
        },
      ],
      instructions: 'Take with food. Avoid alcohol.',
      status: 'active',
    },
  ],
  addReport: (report) =>
    set((state) => ({
      reports: [...state.reports, report],
    })),
  addPrescription: (prescription) =>
    set((state) => ({
      prescriptions: [...state.prescriptions, prescription],
    })),
  getReports: (patientId) => {
    return get().reports.filter((r) => r.patientId === patientId);
  },
  getPrescriptions: (patientId) => {
    return get().prescriptions.filter((p) => p.patientId === patientId);
  },
  updateReport: (id, updates) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  deletePrescription: (id) =>
    set((state) => ({
      prescriptions: state.prescriptions.filter((p) => p.id !== id),
    })),
}));
