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
  date?: string;
  time?: string;
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
  getAppointments: (userId: string, role: AppointmentRole) => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
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
      const list: Appointment[] = (data?.data || []).map((apt: any) => ({
        id: apt.id,
        patientId: apt.patient_id,
        patientName: apt.patient_name,
        doctorId: apt.doctor_id,
        doctorName: apt.doctor_name,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        reason: apt.reason,
        status: apt.status,
        notes: apt.notes,
        // Keep backward compat for dashboards that use date/time fields
        date: apt.appointment_date,
        time: apt.appointment_time,
      }));
      set({ appointments: list });
    } finally {
      set({ loading: false });
    }
  },

  getAppointments: (userId, role) => {
    return get().appointments;
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

      // Refresh appointments after creation
      await get().refresh('patient');
    } finally {
      set({ loading: false });
    }
  },
}));

