import { create } from 'zustand';
import { api } from '../utils/api';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

type AppointmentRole = 'patient' | 'doctor';

interface AppointmentState {
  loading: boolean;
  appointments: Appointment[];

  refresh: (role: AppointmentRole) => Promise<void>;
  createAppointment: (payload: {
    doctor_id: string;
    appointment_date: string; // date-only (YYYY-MM-DD)
    appointment_time: string; // time string
    reason: string;
    notes?: string;
  }) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  loading: false,
  appointments: [],

  refresh: async (role) => {
    set({ loading: true });
    try {
      // Backend filters by JWT identity, role argument is not needed; keep for future.
      const res = await api.get(`/appointments`, {
        params: role ? { status: undefined } : undefined,
      });

      const data = res.data;
      const list: Appointment[] = data?.data || [];
      set({ appointments: list });
    } finally {
      set({ loading: false });
    }
  },

  createAppointment: async (payload) => {
    set({ loading: true });
    try {
      await api.post(`/appointments`, {
        doctor_id: payload.doctor_id,
        appointment_date: payload.appointment_date,
        appointment_time: payload.appointment_time,
        reason: payload.reason,
        notes: payload.notes,
      });

      // Refresh is handled by the caller or route; do it here for UX.
      // Caller may also navigate away.
      // Note: we don't know patient/doctor role reliably here, so just re-fetch.
      // JWT identity determines role on backend.
      const meRes = await api.get('/dashboard/patient');
      void meRes;
    } finally {
      set({ loading: false });
    }
  },
}));

