import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request:', config.method?.toUpperCase(), config.url); // Debug log
    console.log('Token present:', !!token); // Debug log
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error); // Debug log
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url); // Debug log
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data); // Debug log
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Let the AuthContext handle the redirect instead of forcing a page reload
      // window.location.href = '/signin';
    }
    
    // Create a more detailed error object
    const enhancedError = {
      ...error,
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data
    };
    
    return Promise.reject(enhancedError);
  }
);

export default apiClient;