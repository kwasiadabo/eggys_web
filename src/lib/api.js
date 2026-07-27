import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
// Origin the backend serves /uploads from — e.g. https://eggys-api.onrender.com
const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: apiBaseUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a request that carried a token means the stored session is stale
// (expired, or signed with a since-rotated secret) — drop it instead of
// letting every subsequent request keep failing the same way.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('vx_token')) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

// Product imageUrl values are relative paths like "/uploads/..." returned by the API —
// resolve them against the backend's origin so they work when the frontend is a separate deploy.
export function resolveAssetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url}`;
}

export default api;
