import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('grabbit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('grabbit_token');
      localStorage.removeItem('grabbit_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const cafeAPI = {
  get: (id) => api.get(`/cafes/${id}`),
  updateStatus: (id, isOpen) => api.put(`/cafes/${id}/status`, { isOpen }),
  getMenu: (id) => api.get(`/cafes/${id}/menu`),
};

export const menuAPI = {
  getVendorMenu: () => api.get('/menu/vendor'),
  add: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const orderAPI = {
  getCafeOrders: (cafeId, params) => api.get(`/orders/cafe/${cafeId}`, { params }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

export default api;
