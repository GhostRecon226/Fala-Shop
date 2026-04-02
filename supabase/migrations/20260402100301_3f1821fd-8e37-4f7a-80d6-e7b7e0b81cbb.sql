
-- 1. Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 4. Add coupon columns to orders
ALTER TABLE public.orders
  ADD COLUMN coupon_code text DEFAULT NULL,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;

-- 5. Validate coupon RPC
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_total numeric)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coupon record;
  _discount numeric;
BEGIN
  SELECT * INTO _coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(_code);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon not found');
  END IF;

  IF NOT _coupon.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon is inactive');
  END IF;

  IF _coupon.expires_at IS NOT NULL AND _coupon.expires_at <= now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;

  IF _coupon.max_uses IS NOT NULL AND _coupon.times_used >= _coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;

  IF _order_total < _coupon.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'error',
      'Minimum order amount is ' || _coupon.min_order_amount);
  END IF;

  IF _coupon.discount_type = 'percentage' THEN
    _discount := LEAST(_order_total, ROUND(_order_total * _coupon.discount_value / 100, 2));
  ELSE
    _discount := LEAST(_order_total, _coupon.discount_value);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_type', _coupon.discount_type,
    'discount_value', _coupon.discount_value,
    'discount_amount', _discount
  );
END;
$$;

-- 6. Trigger to increment coupon usage on order insert
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.coupon_code IS NOT NULL THEN
    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE UPPER(code) = UPPER(NEW.coupon_code);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_coupon_usage
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage();
