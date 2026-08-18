import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

if (!SOCKET_URL) {
  throw new Error('EXPO_PUBLIC_SOCKET_URL is required');
}

export const useOrderSocket = (userId, onStatusUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    let disposed = false;
    const connect = async () => {
      const token = await AsyncStorage.getItem('grabbit_token');
      if (disposed) return;
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: { token },
      });
      socketRef.current.on('connect', () => socketRef.current.emit('join_user_room', userId));
      socketRef.current.on('order_status_update', (data) => {
        if (onStatusUpdate) onStatusUpdate(data);
      });
    };
    connect();

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
    };
  }, [userId]); // eslint-disable-line
};
