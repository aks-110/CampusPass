import axios from 'axios';
import { store } from '../redux/store';
import { logout, setCredentials } from '../redux/authSlice';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});



axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Avoid retrying on login or refresh routes to prevent loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, {}, { withCredentials: true });
        
        // Retry the original request (cookies will be automatically included)
        return axiosInstance(originalRequest);
      } catch (err) {
        store.dispatch(logout());
        // We removed window.location.href = '/login' here to prevent infinite reload loops.
        // React Router (MainLayout) will handle the redirect automatically when Redux state changes.
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
