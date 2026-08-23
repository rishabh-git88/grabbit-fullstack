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
      const portal = window.location.pathname.startsWith('/vendor') ? 'vendor' : 'student';
      window.location.href = `/login?portal=${portal}`;
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  firebaseLogin: (data) => api.post('/auth/firebase-login', data),
  vendorRegister: (data) => api.post('/auth/vendor-register', data),
  confirmVendorRegistration: (data) => api.post('/auth/vendor-register/confirm', data),
};

export const cafeAPI = {
  getAll: () => api.get('/cafes'),
  getManaged: () => api.get('/cafes/vendor'),
  get: (id) => api.get(`/cafes/${id}`),
  updateStatus: (id, isOpen) => api.put(`/cafes/${id}/status`, { isOpen }),
  getMenu: (id) => api.get(`/cafes/${id}/menu`),
};

export const menuAPI = {
  getVendorMenu: (cafeId) => api.get('/menu/vendor', { params: { cafeId } }),
  add: (data) => api.post('/menu', data),
  update: (id, data) => api.put(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  get: (id) => api.get(`/orders/${id}`),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
  getCafeOrders: (cafeId, params) => api.get(`/orders/cafe/${cafeId}`, { params }),
  getCafeAnalytics: (cafeId) => api.get(`/orders/cafe/${cafeId}/analytics`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  collectRemainingPayment: (id) => api.post(`/payment/${id}/collect-remaining`),
};

export const paymentAPI = {
  create: (data) => api.post('/payment/create', data),
  verify: (data) => api.post('/payment/verify', data),
};

export const reviewAPI = {
  save: (data) => api.post('/reviews', data),
};

export default api;
