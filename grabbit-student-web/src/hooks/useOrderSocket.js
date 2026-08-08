import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://grabbit-fullstack.onrender.com';

export const useOrderSocket = (userId, onStatusUpdate) => {
  const socketRef = useRef(null);
  const callbackRef = useRef(onStatusUpdate);

  useEffect(() => { callbackRef.current = onStatusUpdate; });

  useEffect(() => {
    if (!userId) return;
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current.emit('join_user_room', userId);
    socketRef.current.on('order_status_update', (data) => callbackRef.current(data));
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [userId]);
};

export default useOrderSocket;
