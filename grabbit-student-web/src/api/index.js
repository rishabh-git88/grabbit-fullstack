import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;

if (!API_BASE) {
  throw new Error('REACT_APP_API_URL is required');
}

const api = axios.create({ baseURL: API_BASE });

// Start a Render instance while the visitor is choosing a Google account.
// This request is deliberately not awaited, so it never blocks the UI.
let warmUpRequest;
export const warmUpAPI = () => {
  if (!warmUpRequest) {
    warmUpRequest = api.get('/health').catch(() => {}).finally(() => {
      warmUpRequest = undefined;
    });
  }
  return warmUpRequest;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('grabbit_student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('grabbit_student_token');
      localStorage.removeItem('grabbit_student_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  firebaseLogin: (data) => api.post('/auth/firebase-login', data),
};

export const cafeAPI = {
  getAll: () => api.get('/cafes'),
  get: (id) => api.get(`/cafes/${id}`),
  getMenu: (id) => api.get(`/cafes/${id}/menu`),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  get: (id) => api.get(`/orders/${id}`),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
};

export const paymentAPI = {
  create: (data) => api.post('/payment/create', data),
  verify: (data) => api.post('/payment/verify', data),
};

export default api;
