import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for cookies (JWT)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor for handling global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // You can trigger a global logout event here if needed
      console.warn("Unauthorized access - Redirect to login may be required");
    }
    return Promise.reject(error);
  }
);

export default api;
