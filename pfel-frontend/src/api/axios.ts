// File: src/api/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
});

const AUTH_PUBLIC_PATHS = ['/login', '/register'];

api.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  const isAuthEndpoint = AUTH_PUBLIC_PATHS.some((path) => requestUrl.endsWith(path));

  if (!isAuthEndpoint) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
