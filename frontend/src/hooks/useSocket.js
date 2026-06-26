import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket(token, onBearUpdate, onClanUpdate) {
  const handlersRef = useRef({ onBearUpdate, onClanUpdate });
  handlersRef.current = { onBearUpdate, onClanUpdate };

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
    });

    socketInstance.on('bear:update', (bear) => {
      handlersRef.current.onBearUpdate?.(bear);
    });

    socketInstance.on('clan:update', () => {
      handlersRef.current.onClanUpdate?.();
    });

    return () => {
      // Don't disconnect on unmount — keep the socket alive globally
    };
  }, [token]);
}
