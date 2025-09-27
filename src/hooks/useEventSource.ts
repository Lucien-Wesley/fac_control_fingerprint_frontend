import { useEffect, useRef } from 'react';

type EventCallback = (data: any, event?: MessageEvent) => void;

interface Options {
  withCredentials?: boolean;
  reconnectInterval?: number;
}

export function useEventSource(url: string, onMessage: EventCallback, options?: Options) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    let closedByHook = false;

    const connect = () => {
      try {
        const es = new EventSource(url, { withCredentials: options?.withCredentials ?? false } as any);
        esRef.current = es;

        es.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            onMessage(parsed, ev);
          } catch (e) {
            onMessage(ev.data, ev);
          }
        };

        es.onerror = () => {
          // try reconnect
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
          }
          if (!closedByHook) {
            const interval = options?.reconnectInterval ?? 3000;
            reconnectTimer.current = window.setTimeout(connect, interval);
          }
        };
      } catch (err) {
        const interval = options?.reconnectInterval ?? 3000;
        reconnectTimer.current = window.setTimeout(connect, interval);
      }
    };

    connect();

    return () => {
      closedByHook = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
}

export default useEventSource;
