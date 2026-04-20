
-- Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  session_id text NOT NULL,
  path text NOT NULL,
  page_title text NULL,
  referrer text NULL,
  user_agent text NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz NULL,
  duration_seconds integer NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_session ON public.page_views(session_id, viewed_at DESC);
CREATE INDEX idx_page_views_user ON public.page_views(user_id, viewed_at DESC);
CREATE INDEX idx_page_views_last_seen ON public.page_views(last_seen_at DESC);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(viewed_at DESC);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can insert their own page view row
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins+ can read
CREATE POLICY "Admins can view page views"
ON public.page_views
FOR SELECT
TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));

-- Admins can delete (for purge)
CREATE POLICY "Admins can delete page views"
ON public.page_views
FOR DELETE
TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));

-- Helper RPC: update left_at / duration / last_seen_at by id+session_id (no auth required)
CREATE OR REPLACE FUNCTION public.update_page_view(
  _id uuid,
  _session_id text,
  _left_at timestamptz DEFAULT NULL,
  _duration_seconds integer DEFAULT NULL,
  _heartbeat boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.page_views
  SET
    left_at = COALESCE(_left_at, left_at),
    duration_seconds = COALESCE(_duration_seconds, duration_seconds),
    last_seen_at = CASE WHEN _heartbeat THEN now() ELSE last_seen_at END
  WHERE id = _id AND session_id = _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_page_view(uuid, text, timestamptz, integer, boolean) TO anon, authenticated;

-- Purge RPC (admin only)
CREATE OR REPLACE FUNCTION public.purge_old_page_views(_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _deleted integer;
BEGIN
  IF NOT public.has_min_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.page_views WHERE viewed_at < now() - (_days || ' days')::interval;
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_old_page_views(integer) TO authenticated;

-- Realtime
ALTER TABLE public.page_views REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;
