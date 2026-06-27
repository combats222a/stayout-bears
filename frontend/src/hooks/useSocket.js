import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  return socketInstance;
}

export function useSocket(token, onBearUpdate, onClanUpdate, onReconnect, onShiningUpdate, onHeartsUpdate) {
  const handlersRef = useRef({ onBearUpdate, onClanUpdate, onReconnect, onShiningUpdate, onHeartsUpdate });
  handlersRef.current = { onBearUpdate, onClanUpdate, onReconnect, onShiningUpdate, onHeartsUpdate };

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
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    let isFirstConnect = true;
    socketInstance.on('connect', () => {
      if (isFirstConnect) {
        isFirstConnect = false;
        return;
      }
      handlersRef.current.onReconnect?.();
    });

    socketInstance.on('bear:update', (bear) => {
      handlersRef.current.onBearUpdate?.(bear);
    });

    socketInstance.on('clan:update', () => {
      handlersRef.current.onClanUpdate?.();
    });

    // Сияние — обновление от другого игрока клана
    socketInstance.on('shining:update', (data) => {
      handlersRef.current.onShiningUpdate?.(data);
    });

    // Сердца — кто-то добавил или удалил запись
    socketInstance.on('hearts:update', () => {
      handlersRef.current.onHeartsUpdate?.();
    });

    return () => {
      // Keep socket alive globally
    };
  }, [token]);
}
