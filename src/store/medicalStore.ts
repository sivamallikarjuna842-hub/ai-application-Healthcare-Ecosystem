import { create } from 'zustand';
import { api } from '../utils/api';

export interface MedicalReport {
  id: string;
  patient_id: string;
  patientName?: string;
  doctor_id: string;
  doctorName?: string;
  date?: string;
  report_type: string;
  title: string;
  description: string;
  file_url?: string;
  summary?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  prescribed_date?: string;
  status: 'active' | 'expired' | 'completed' | string;
  instructions?: string;
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
}

type LoadingState = {
  loadingReports: boolean;
  loadingPrescriptions: boolean;
};

interface MedicalState extends LoadingState {
  reports: MedicalReport[];
  prescriptions: Prescription[];

  refreshReports: (args?: { patient_id?: string }) => Promise<void>;
  refreshPrescriptions: () => Promise<void>;

  uploadReport: (payload: {
    patient_id: string;
    report_type: string;
    title: string;
    description: string;
    file: File;
    tags?: string;
  }) => Promise<void>;

  summarizeReport: (report_id: string, content?: string) => Promise<void>;

  deleteReport: (report_id: string) => Promise<void>;
  deletePrescription: (prescription_id: string) => Promise<void>;

  // Backward-compatible methods used by pages (will map to API refresh)
  addReport: (report: MedicalReport) => void;
  addPrescription: (prescription: Prescription) => void;
  getReports: (patientId: string) => MedicalReport[];
  getPrescriptions: (patientId: string) => Prescription[];
  updateReport: (id: string, updates: Partial<MedicalReport>) => void;
}

export const useMedicalStore = create<MedicalState>((set, get) => ({
  loadingReports: false,
  loadingPrescriptions: false,

  reports: [],
  prescriptions: [],

  refreshReports: async (args) => {
    set({ loadingReports: true });
    try {
      const res = await api.get('/reports', {
        params: args?.patient_id ? { patient_id: args.patient_id } : undefined,
      });
      const list = res.data?.data || [];
      set({ reports: list });
    } finally {
      set({ loadingReports: false });
    }
  },

  refreshPrescriptions: async () => {
    set({ loadingPrescriptions: true });
    try {
      const res = await api.get('/prescriptions');
      const list = res.data?.data || [];
      set({ prescriptions: list });
    } finally {
      set({ loadingPrescriptions: false });
    }
  },

  uploadReport: async (payload) => {
    set({ loadingReports: true });
    try {
      const form = new FormData();
      form.append('file', payload.file);
      form.append('patient_id', payload.patient_id);
      form.append('report_type', payload.report_type);
      form.append('title', payload.title);
      form.append('description', payload.description);
      if (payload.tags) form.append('tags', payload.tags);

      await api.post('/reports', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await get().refreshReports({ patient_id: payload.patient_id });
    } finally {
      set({ loadingReports: false });
    }
  },

  summarizeReport: async (report_id, content) => {
    set({ loadingReports: true });
    try {
      await api.post('/ai/summarize-report', {
        report_id,
        content,
      });
      await get().refreshReports();
    } finally {
      set({ loadingReports: false });
    }
  },

  deleteReport: async (report_id) => {
    set({ loadingReports: true });
    try {
      await api.delete(`/reports/${report_id}`);
      set({ reports: get().reports.filter((r) => r.id !== report_id) });
    } finally {
      set({ loadingReports: false });
    }
  },

  deletePrescription: async (prescription_id) => {
    set({ loadingPrescriptions: true });
    try {
      await api.delete(`/prescriptions/${prescription_id}`);
      set({
        prescriptions: get().prescriptions.filter((p) => p.id !== prescription_id),
      });
    } finally {
      set({ loadingPrescriptions: false });
    }
  },

  // Compatibility layer (keeps current pages compiling)
  addReport: (report) => set((s) => ({ reports: [...s.reports, report] })),
  addPrescription: (prescription) =>
    set((s) => ({ prescriptions: [...s.prescriptions, prescription] })),
  getReports: (patientId) => get().reports.filter((r) => r.patient_id === patientId),
  getPrescriptions: (patientId) => get().prescriptions.filter((p) => p.patient_id === patientId),
  updateReport: (id, updates) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
}));

