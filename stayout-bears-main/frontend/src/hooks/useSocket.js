import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket(token, onBearUpdate, onClanUpdate, onReconnect) {
  const handlersRef = useRef({ onBearUpdate, onClanUpdate, onReconnect });
  handlersRef.current = { onBearUpdate, onClanUpdate, onReconnect };

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
      reconnection: true,
      reconnectionAttempts: Infinity, // раньше было 5 — после 5 неудачных попыток сокет
      reconnectionDelay: 1000,        // умирал навсегда и таблица замирала до ручного рефреша
      reconnectionDelayMax: 10000,
    });

    let isFirstConnect = true;
    socketInstance.on('connect', () => {
      if (isFirstConnect) {
        isFirstConnect = false;
        return;
      }
      // Сокет переподключился после разрыва — подтягиваем актуальные данные,
      // чтобы не потерять события, которые пришли пока связи не было.
      handlersRef.current.onReconnect?.();
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
