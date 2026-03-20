
-- Function to list all users with their roles (admin only)
CREATE OR REPLACE FUNCTION public.list_users_with_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id AS user_id,
    u.email::text AS email,
    u.created_at,
    ur.role::text AS role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY u.created_at DESC;
$$;

-- Function to set a user's role (admin only)
CREATE OR REPLACE FUNCTION public.set_user_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Remove existing roles
  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  -- Insert new role (skip if 'user' since that's the default/no-role state)
  IF _role != 'user' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role);
  END IF;
END;
$$;

-- Function to remove a user's role (admin only)
CREATE OR REPLACE FUNCTION public.remove_user_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
END;
$$;
