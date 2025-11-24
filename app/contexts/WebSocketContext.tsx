'use client';

import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';

type SocketType = Socket;

interface WebSocketContextType {
  socket: SocketType | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get WebSocket URL from environment or use same host as app
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    // If NEXT_PUBLIC_WS_URL is not set, use same host as app (Vercel)
    if (!wsUrl && typeof window !== 'undefined') {
      wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host;
    }

    // Fallback to localhost for development
    if (!wsUrl) {
      wsUrl = 'ws://localhost:8080';
    }

    // Skip connection if URL points to Railway but doesn't use wss:// (likely not configured)
    // This prevents connection errors when Railway server is not set up
    if (wsUrl.includes('railway.app') && !wsUrl.startsWith('wss://')) {
      console.warn('⚠️ WebSocket URL points to Railway but may not be configured correctly. Skipping WebSocket connection.');
      console.info('💡 To enable WebSocket: Deploy Socket.io server on Railway and set NEXT_PUBLIC_WS_URL to wss://your-railway-url.up.railway.app');
      return;
    }

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    // Initialize socket connection with Android support
    const socketInstance = io(wsUrl, {
      transports: ['websocket', 'polling'], // Fallback to polling for Android
      upgrade: true,
      rememberUpgrade: true,
      secure: wsUrl.startsWith('wss://') || wsUrl.startsWith('https://'),
      // Android specific settings
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5, // Limit reconnection attempts to avoid spam
      timeout: 10000, // Reduce timeout to fail faster
      forceNew: false,
      // Android WebView compatibility
      autoConnect: true,
      // Better error handling for Android
      rejectUnauthorized: false
    });

    const onConnect = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    };

    const onError = (error: Error) => {
      console.error('❌ WebSocket error:', error);
      setIsConnected(false);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.close();
    };
  }, []);

  const value = {
    socket,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
