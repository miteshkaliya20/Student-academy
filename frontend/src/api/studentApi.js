import axios from 'axios';
import { API_BASE_URL } from './api';

export const STUDENT_TOKEN_STORAGE_KEY = 'academy_student_auth_token';
export const STUDENT_USER_STORAGE_KEY = 'academy_student_auth_user';

const studentApi = axios.create({
  baseURL: API_BASE_URL,
});

studentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(STUDENT_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default studentApi;
