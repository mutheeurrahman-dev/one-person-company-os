import { useEffect, useRef, useState } from 'react';
import { wsUrl } from '../lib/api';
import type { AgentExecutionResponse } from '../types';

export type ConnectionState = 'connecting' | 'open' | 'closed';

/**
 * Subscribes to /ws/activity and accumulates live AgentExecution events.
 * Auto-reconnects with backoff if the connection drops.
 */
export function useAgentActivityFeed(enabled: boolean, maxEvents = 200) {
  const [events, setEvents] = useState<AgentExecutionResponse[]>([]);
  const [state, setState] = useState<ConnectionState>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      setState('connecting');
      const ws = new WebSocket(wsUrl('/ws/activity'));
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        retryRef.current = 0;
        setState('open');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AgentExecutionResponse & { type?: string };
          // The backend also broadcasts "workflow_update" frames on this same
          // socket (used elsewhere to know when to refresh dashboard stats).
          // Those don't have agent/message fields, so only accumulate real
          // agent_execution events here or downstream rendering will crash.
          if (data.type && data.type !== 'agent_execution') return;
          setEvents((prev) => [...prev.slice(-(maxEvents - 1)), data]);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setState('closed');
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        retryRef.current += 1;
        timeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      wsRef.current?.close();
    };
  }, [enabled, maxEvents]);

  return { events, state, clear: () => setEvents([]) };
}
