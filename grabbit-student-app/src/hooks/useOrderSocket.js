import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useOrderSocket = (userId, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_user_room', userId);
    });

    socketRef.current.on('order_status_update', (data) => {
      if (onStatusUpdate) onStatusUpdate(data);
    });

    return () => socketRef.current?.disconnect();
  }, [userId]); // eslint-disable-line
};
