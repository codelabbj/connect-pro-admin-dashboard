// WEBSOCKET CODE COMMENTED OUT
// "use client";

// import React, { useEffect, useState } from "react";
// import { WebSocketProvider } from "@/components/providers/websocket-provider";

// interface Props {
//   children: React.ReactNode;
// }

// export const WebSocketProviderWrapper = ({ children }: Props) => {
//   const [token, setToken] = useState<string | null>(null);

//   useEffect(() => {
//     // Replace 'access_token' with your actual token key if different
//     const storedToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//     setToken(storedToken);
//   }, []);

//   if (!token) {
//     // Optionally render children without WebSocket if no token
//     return <>{children}</>;
//   }

//   return <WebSocketProvider token={token}>{children}</WebSocketProvider>;
// };

// Mock implementation to prevent errors
export const WebSocketProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
