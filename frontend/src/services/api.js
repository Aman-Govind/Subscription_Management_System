import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Enterprise Axios client instance configured for authenticated REST communication.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor: Automatically injects active JWT Bearer token into headers.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Standardizes error payloads and securely terminates invalidated sessions.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle session invalidation or authorization rejections
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (!originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
        console.warn('[Security] Active session rejected or expired. Purging local credentials.');
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_profile');
        window.dispatchEvent(new CustomEvent('brightloop:session_invalidated'));
      }
    }

    const normalizedError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected network or service error occurred.',
      data: error.response?.data || null,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
