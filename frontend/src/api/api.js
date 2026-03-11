import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'academy_auth_token';
export const USER_STORAGE_KEY = 'academy_auth_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
