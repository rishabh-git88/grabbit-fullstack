import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (cafeId, onNewOrder) => {
  const socketRef = useRef(null);
  const onNewOrderRef = useRef(onNewOrder);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  const stableHandler = useCallback((data) => {
    if (onNewOrderRef.current) onNewOrderRef.current(data.order);
  }, []);

  useEffect(() => {
    if (!cafeId) return;

    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      socketRef.current.emit('join_cafe_room', cafeId);
    });

    socketRef.current.on('new_order', stableHandler);

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [cafeId, stableHandler]);

  return socketRef.current;
};
