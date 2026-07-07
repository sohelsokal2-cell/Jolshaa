import axios from 'axios';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies with every request
});

// Attach CSRF token header for state-changing requests
API.interceptors.request.use((config) => {
  if (!['get', 'head', 'options'].includes(config.method)) {
    const csrfToken = getCookie('_csrf');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password') || url.includes('/auth/me') || url.includes('/auth/socket-token');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
