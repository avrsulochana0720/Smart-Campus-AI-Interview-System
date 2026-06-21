import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type WebSocketContextType = {
  lastMessage: any | null;
  sendMessage: (message: any) => void;
};

const WebSocketContext = createContext<WebSocketContextType>({ lastMessage: null, sendMessage: () => {} });

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const location = useLocation();

  const getUserIdFromToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      // In python auth.py we usually encode 'sub' with user_id
      return payload.sub;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let wsUrl = '';
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');

    if (adminToken) {
      const adminId = getUserIdFromToken(adminToken) || 'admin';
      wsUrl = `ws://localhost:8000/ws/${encodeURIComponent(adminId)}/admin`;
    } else if (userToken) {
      const userId = getUserIdFromToken(userToken);
      if (userId) {
        wsUrl = `ws://localhost:8000/ws/${encodeURIComponent(userId)}/student`;
      }
    }

    // Only connect if the URL changed to prevent reconnect loops on same token
    if (wsUrl && (!ws.current || ws.current.url !== wsUrl || ws.current.readyState === WebSocket.CLOSED)) {
      if (ws.current) {
        ws.current.close();
      }
      
      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket received:", data);
          setLastMessage(data);
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }

    return () => {
      // We don't automatically close on unmount here if we want persistent connection, 
      // but standard cleanup is good. Let's just let it persist until explicitly logged out, 
      // or clean up only when the component actually unmounts.
      // We will skip aggressive cleanup to allow persistent WS across route changes.
    };
  }, [location.pathname]); // Re-run when navigation happens (e.g. login -> dashboard)

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return (
    <WebSocketContext.Provider value={{ lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
