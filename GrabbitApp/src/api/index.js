import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's LAN IP when testing on a physical device
const API_BASE = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_BASE = 'http://localhost:5000/api'; // iOS simulator

const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('grabbit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['grabbit_token', 'grabbit_user']);
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
  getAll: () => api.get('/cafes'),
  getMenu: (id) => api.get(`/cafes/${id}/menu`),
};

export const orderAPI = {
  place: (data) => api.post('/orders', data),
  getUserOrders: (userId) => api.get(`/orders/user/${userId}`),
  getOrder: (id) => api.get(`/orders/${id}`),
};

export const paymentAPI = {
  create: (orderId) => api.post('/payment/create', { orderId }),
  verify: (data) => api.post('/payment/verify', data),
};

export default api;
