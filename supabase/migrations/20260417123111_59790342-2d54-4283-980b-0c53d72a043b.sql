-- ============================================================================
-- 4-TIER ROLE SYSTEM: super_admin > admin > moderator > user
-- ============================================================================

-- 1. Helper: hierarchical role check
CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND CASE ur.role
            WHEN 'super_admin' THEN 4
            WHEN 'admin' THEN 3
            WHEN 'moderator' THEN 2
            ELSE 1
          END
        >=
          CASE _min_role
            WHEN 'super_admin' THEN 4
            WHEN 'admin' THEN 3
            WHEN 'moderator' THEN 2
            ELSE 1
          END
  );
$$;

-- 2. Seed: promote existing admins to super_admin (preserve access)
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'super_admin'::app_role
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT DO NOTHING;

-- Remove the old 'admin' rows for those users (they're now super_admin)
DELETE FROM public.user_roles ur1
WHERE ur1.role = 'admin'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur1.user_id AND ur2.role = 'super_admin'
  );

-- ============================================================================
-- 3. RPC UPDATES
-- ============================================================================

-- set_user_role: only super_admin; cannot assign super_admin via UI
CREATE OR REPLACE FUNCTION public.set_user_role(_target_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _role = 'super_admin' THEN
    RAISE EXCEPTION 'Super Admin role cannot be assigned via the app';
  END IF;

  -- Cannot modify another super_admin's role
  IF public.has_role(_target_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot modify a Super Admin';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;

  IF _role <> 'user' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role);
  END IF;
END;
$$;

-- remove_user_role: super_admin only
CREATE OR REPLACE FUNCTION public.remove_user_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF public.has_role(_target_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot modify a Super Admin';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target_user_id;
END;
$$;

-- delete_user_by_admin: super_admin only; cannot delete super_admins or self
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  IF public.has_role(_target_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot delete a Super Admin';
  END IF;
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$$;

-- ban / unban (create if missing)
CREATE OR REPLACE FUNCTION public.ban_user_by_admin(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot suspend yourself';
  END IF;
  IF public.has_role(_target_user_id, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot suspend a Super Admin';
  END IF;
  UPDATE auth.users SET banned_until = 'infinity'::timestamptz WHERE id = _target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.unban_user_by_admin(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.users SET banned_until = NULL WHERE id = _target_user_id;
END;
$$;

-- list_users_with_roles: super_admin only
CREATE OR REPLACE FUNCTION public.list_users_with_roles()
RETURNS TABLE(user_id uuid, email text, created_at timestamptz, role text, is_banned boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    ur.role::text,
    (u.banned_until IS NOT NULL AND u.banned_until > now()) AS is_banned
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE public.has_role(auth.uid(), 'super_admin'::app_role)
  ORDER BY u.created_at DESC;
$$;

-- log_admin_action: any admin tier (super_admin, admin, moderator)
CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _entity_type text, _entity_id text DEFAULT NULL, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _email text;
BEGIN
  IF NOT public.has_min_role(auth.uid(), 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.admin_activity_log (admin_id, admin_email, action, entity_type, entity_id, details)
  VALUES (auth.uid(), COALESCE(_email, 'unknown'), _action, _entity_type, _entity_id, _details);
END;
$$;

-- ============================================================================
-- 4. RLS POLICY UPDATES
-- ============================================================================

-- user_roles: only super_admin manages; users still see own
DROP POLICY IF EXISTS "Super admins can manage user roles" ON public.user_roles;
CREATE POLICY "Super admins can manage user roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- site_settings: super_admin only for write
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Super admins can insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- admin_activity_log: admin+ can view (super_admin, admin)
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log FOR SELECT TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));

-- products: admin+ manage
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_min_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));

-- product_images: admin+ manage
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can insert product images"
ON public.product_images FOR INSERT TO authenticated
WITH CHECK (public.has_min_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update product images"
ON public.product_images FOR UPDATE TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete product images"
ON public.product_images FOR DELETE TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role));

-- coupons: admin+ manage
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL TO authenticated
USING (public.has_min_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_min_role(auth.uid(), 'admin'::app_role));

-- orders: moderator+ view & update all
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Staff can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_min_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Staff can update all orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_min_role(auth.uid(), 'moderator'::app_role));

-- order_items: moderator+ view all
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Staff can view all order items"
ON public.order_items FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.orders o
          WHERE o.id = order_items.order_id
            AND public.has_min_role(auth.uid(), 'moderator'::app_role))
);

-- contact_messages: moderator+ view
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Staff can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_min_role(auth.uid(), 'moderator'::app_role));