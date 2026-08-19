import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error('REACT_APP_SOCKET_URL is required');
}

export const useOrderSocket = (userId, onStatusUpdate) => {
  const socketRef = useRef(null);
  const callbackRef = useRef(onStatusUpdate);

  useEffect(() => { callbackRef.current = onStatusUpdate; });

  useEffect(() => {
    if (!userId) return;
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('grabbit_token') },
    });
    socketRef.current.on('connect', () => socketRef.current.emit('join_user_room', userId));
    socketRef.current.on('order_status_update', (data) => callbackRef.current(data));
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [userId]);
};

export default useOrderSocket;
