/**
 * useWebSocket - Hook för WebSocket-anslutning
 */
import { useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
}

export const useWebSocket = (
  url: string,
  options: UseWebSocketOptions = {}
): { lastMessage: MessageEvent | null; readyState: number; sendMessage: (message: string) => void } => {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { onOpen, onClose, onError, reconnectInterval = 5000 } = options;

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setReadyState(WebSocket.OPEN);
          onOpen?.();
        };

        ws.onmessage = (event) => {
          setLastMessage(event);
        };

        ws.onerror = (error) => {
          onError?.(error);
        };

        ws.onclose = () => {
          setReadyState(WebSocket.CLOSED);
          onClose?.();

          // Reconnect after interval
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onOpen, onClose, onError, reconnectInterval]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  };

  return { lastMessage, readyState, sendMessage };
};


