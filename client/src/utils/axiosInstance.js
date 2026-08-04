import axios from 'axios';
import { store } from '../redux/store';
import { logout, setCredentials } from '../redux/authSlice';
import NProgress from 'nprogress';

let activeRequests = 0;

const startLoader = () => {
  if (activeRequests === 0) {
    NProgress.start();
  }
  activeRequests++;
};

const stopLoader = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) {
    NProgress.done();
  }
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    startLoader();
    return config;
  },
  (error) => {
    stopLoader();
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    stopLoader();
    return response;
  },
  async (error) => {
    stopLoader();
    const originalRequest = error.config;
    // Avoid retrying on login or refresh routes to prevent loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login') && !originalRequest.url.includes('/auth/refresh-token')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh-token`, {}, { withCredentials: true });
        
        isRefreshing = false;
        processQueue(null, true);
        
        // Retry the original request (cookies will be automatically included)
        return axiosInstance(originalRequest);
      } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
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
