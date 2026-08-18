import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error('REACT_APP_SOCKET_URL is required');
}

export const useSocket = (cafeId, onNewOrder, onOrderUpdate) => {
  const socketRef = useRef(null);
  const newOrderRef = useRef(onNewOrder);
  const orderUpdateRef = useRef(onOrderUpdate);

  useEffect(() => { newOrderRef.current = onNewOrder; });
  useEffect(() => { orderUpdateRef.current = onOrderUpdate; });

  useEffect(() => {
    if (!cafeId) return;
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('grabbit_token') },
    });
    socketRef.current.on('connect', () => socketRef.current.emit('join_cafe_room', cafeId));
    socketRef.current.on('new_order', (data) => newOrderRef.current(data.order || data));
    socketRef.current.on('order_status_update', (data) => orderUpdateRef.current(data));
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [cafeId]);
};

export default useSocket;
