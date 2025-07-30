"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/config";

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const SOCKET_URL = BACKEND_URL;

    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("✅ Connected to Socket.IO server");
        setIsConnected(true);
        setError(null);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Connection error:", err.message);
        setError(err.message);
        setIsConnected(false);
      });

      socket.on("disconnect", () => {
        console.log("⚠️ Disconnected from Socket.IO server");
        setIsConnected(false);
      });
    }

    return () => {
      if (socket) {
        console.log("🧹 Cleaning up socket");
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return { socket, isConnected, error };
}
