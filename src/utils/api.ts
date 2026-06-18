import axios from 'axios';

const API_BASE_URL =
  // Vite injects env vars at build time
  (import.meta as any).env?.VITE_API_BASE_URL?.toString?.() || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export function setAuthToken(token: string | null | undefined) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

