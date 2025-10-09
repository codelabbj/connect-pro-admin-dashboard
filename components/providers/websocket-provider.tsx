// WEBSOCKET CODE COMMENTED OUT
// "use client";

// import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

// interface WebSocketContextType {
//   socket: WebSocket | null;
//   connected: boolean;
//   lastMessage: MessageEvent<any> | null;
//   connectionStatus: string;
//   send: (data: object) => void;
//   sendRemoteCommand: (deviceId: string, command: string, parameters?: object, priority?: string) => void;
// }

// const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// interface WebSocketProviderProps {
//   token: string;
//   children: React.ReactNode;
// }

// export const WebSocketProvider = ({ token, children }: WebSocketProviderProps) => {
//   const [connected, setConnected] = useState(false);
//   const [lastMessage, setLastMessage] = useState<MessageEvent<any> | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState("disconnected");
//   const socketRef = useRef<WebSocket | null>(null);
//   const reconnectAttemptsRef = useRef(0);

//   const wsUrl = `wss://connect.yapson.net/ws/payment/?token=${token}&client_type=admin`;

//   const connectWebSocket = useCallback(() => {
//     setConnectionStatus("connecting");
//     const ws = new WebSocket(wsUrl);
//     socketRef.current = ws;

//     ws.onopen = () => {
//       setConnected(true);
//       setConnectionStatus("connected");
//       reconnectAttemptsRef.current = 0;
//     };
//     ws.onclose = () => {
//       setConnected(false);
//       setConnectionStatus("disconnected");
//       attemptReconnect();
//     };
//     ws.onerror = () => {
//       setConnected(false);
//       setConnectionStatus("error");
//     };
//     ws.onmessage = (msg) => {
//       setLastMessage(msg);
//       // Optionally: handle message types here
//     };
//   }, [wsUrl]);

//   const attemptReconnect = useCallback(() => {
//     if (reconnectAttemptsRef.current < 5) {
//       reconnectAttemptsRef.current += 1;
//       setTimeout(() => {
//         connectWebSocket();
//       }, 2000 * reconnectAttemptsRef.current);
//     }
//   }, [connectWebSocket]);

//   useEffect(() => {
//     if (!token) return;
//     connectWebSocket();
//     return () => {
//       socketRef.current?.close();
//     };
//   }, [token, connectWebSocket]);

//   const send = useCallback((data: object) => {
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify(data));
//     }
//   }, []);

//   const sendRemoteCommand = useCallback(
//     (deviceId: string, command: string, parameters: object = {}, priority: string = "normal") => {
//       send({
//         type: "remote_command",
//         device_id: deviceId,
//         command,
//         parameters,
//         priority,
//       });
//     },
//     [send]
//   );

//   return (
//     <WebSocketContext.Provider
//       value={{
//         socket: socketRef.current,
//         connected,
//         lastMessage,
//         connectionStatus,
//         send,
//         sendRemoteCommand,
//       }}
//     >
//       {children}
//     </WebSocketContext.Provider>
//   );
// };

// export const useWebSocket = () => {
//   const ctx = useContext(WebSocketContext);
//   if (!ctx) throw new Error("useWebSocket must be used within a WebSocketProvider");
//   return ctx;
// };

// Mock implementations to prevent errors
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useWebSocket = () => {
  return {
    socket: null,
    connected: false,
    lastMessage: null,
    connectionStatus: "disconnected",
    send: () => {},
    sendRemoteCommand: () => {},
  };
};
