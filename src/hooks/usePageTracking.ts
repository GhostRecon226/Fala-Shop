import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SESSION_KEY = 'fp_session_id';
const HEARTBEAT_MS = 30_000;

const getSessionId = (): string => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const usePageTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const currentRowRef = useRef<{ id: string; startedAt: number } | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip admin & auth pages from tracking
    if (location.pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    const path = location.pathname;
    const startedAt = Date.now();
    let cancelled = false;
    const previous = currentRowRef.current;

    // Close out previous page view
    if (previous) {
      const duration = Math.max(1, Math.round((startedAt - previous.startedAt) / 1000));
      supabase.rpc('update_page_view', {
        _id: previous.id,
        _session_id: sessionId,
        _left_at: new Date().toISOString(),
        _duration_seconds: duration,
        _heartbeat: false,
      });
    }

    // Insert new row
    (async () => {
      const { data, error } = await supabase
        .from('page_views')
        .insert({
          user_id: user?.id ?? null,
          session_id: sessionId,
          path,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
        })
        .select('id')
        .single();

      if (error || cancelled || !data) return;
      currentRowRef.current = { id: data.id, startedAt };

      // Heartbeat
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = window.setInterval(() => {
        const row = currentRowRef.current;
        if (!row) return;
        if (document.visibilityState !== 'visible') return;
        supabase.rpc('update_page_view', {
          _id: row.id,
          _session_id: sessionId,
          _left_at: null,
          _duration_seconds: null,
          _heartbeat: true,
        });
      }, HEARTBEAT_MS);
    })();

    const handleUnload = () => {
      const row = currentRowRef.current;
      if (!row) return;
      const duration = Math.max(1, Math.round((Date.now() - row.startedAt) / 1000));
      // Best-effort fire-and-forget
      supabase.rpc('update_page_view', {
        _id: row.id,
        _session_id: sessionId,
        _left_at: new Date().toISOString(),
        _duration_seconds: duration,
        _heartbeat: false,
      });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      cancelled = true;
      window.removeEventListener('beforeunload', handleUnload);
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user?.id]);
};
