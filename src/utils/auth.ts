import { api, setAuthToken } from './api';

const ACCESS_TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

export type Role = 'patient' | 'doctor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  specialty?: string;
  licenseNumber?: string;
}

export function loadAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  setAuthToken(token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  setAuthToken(null);
}

export function loadUserFromStorage(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveUserToStorage(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  const data = res.data;
  if (!data?.access_token) throw new Error(data?.error || 'Login failed');
  saveAccessToken(data.access_token);
  const user = data.user as User;
  saveUserToStorage(user);
  return user;
}


export async function fetchMe() {
  const res = await api.get('/auth/me');
  const data = res.data;
  if (!data?.user) throw new Error(data?.error || 'Failed to load user');
  const user = data.user as User;
  saveUserToStorage(user);
  return user;
}

