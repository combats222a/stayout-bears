import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { BearWithKiller, DraugWithKiller } from '../types/entities';

interface ShiningUpdatePayload {
  anchorIso: string;
  anchorRealMs: number;
  locationId: string;
  gameTimeStr: string;
  setAt: string;
  setByNick: string;
}

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket(
  token: string | null | undefined,
  onBearUpdate?: (bear: BearWithKiller) => void,
  onClanUpdate?: () => void,
  onReconnect?: () => void,
  onShiningUpdate?: (data: ShiningUpdatePayload) => void,
  onHeartsUpdate?: () => void,
  onDraugUpdate?: (draug: DraugWithKiller) => void
): void {
  const handlersRef = useRef({ onBearUpdate, onClanUpdate, onReconnect, onShiningUpdate, onHeartsUpdate, onDraugUpdate });
  handlersRef.current = { onBearUpdate, onClanUpdate, onReconnect, onShiningUpdate, onHeartsUpdate, onDraugUpdate };

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

    socketInstance.on('bear:update', (bear: BearWithKiller) => {
      handlersRef.current.onBearUpdate?.(bear);
    });

    socketInstance.on('draug:update', (draug: DraugWithKiller) => {
      handlersRef.current.onDraugUpdate?.(draug);
    });

    socketInstance.on('clan:update', () => {
      handlersRef.current.onClanUpdate?.();
    });

    // Сияние — обновление от другого игрока клана
    socketInstance.on('shining:update', (data: ShiningUpdatePayload) => {
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
