import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://grabbit-fullstack.onrender.com';

export const useSocket = (cafeId, onNewOrder, onOrderUpdate) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!cafeId) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.emit('join_cafe', cafeId);

    socketRef.current.on('new_order', onNewOrder);
    socketRef.current.on('order_updated', onOrderUpdate);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [cafeId]);
};

export default useSocket;
