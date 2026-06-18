import { create } from 'zustand';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface AppointmentState {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
  getAppointments: (userId: string, role: 'patient' | 'doctor') => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'John Doe',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-20',
      time: '10:00 AM',
      reason: 'Regular checkup',
      status: 'scheduled',
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Jane Smith',
      doctorId: 'd1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-21',
      time: '02:00 PM',
      reason: 'Follow-up consultation',
      status: 'scheduled',
    },
  ],
  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),
  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      ),
    })),
  cancelAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, status: 'cancelled' } : apt
      ),
    })),
  getAppointments: (userId, role) => {
    const state = get();
    if (role === 'patient') {
      return state.appointments.filter((apt) => apt.patientId === userId);
    } else {
      return state.appointments.filter((apt) => apt.doctorId === userId);
    }
  },
}));
