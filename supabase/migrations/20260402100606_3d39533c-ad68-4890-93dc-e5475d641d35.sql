
-- Add scope columns to coupons
ALTER TABLE public.coupons
  ADD COLUMN applies_to text NOT NULL DEFAULT 'all',
  ADD COLUMN product_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN categories text[] NOT NULL DEFAULT '{}';

-- Update validate_coupon to support scoped coupons
-- Now accepts cart items as JSONB array: [{"product_id": "...", "category": "...", "line_total": 1000}, ...]
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_total numeric, _cart_items jsonb DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _coupon record;
  _discount numeric;
  _eligible_total numeric;
  _item record;
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

  -- Calculate eligible total based on scope
  IF _coupon.applies_to = 'all' OR _cart_items IS NULL THEN
    _eligible_total := _order_total;
  ELSE
    _eligible_total := 0;
    FOR _item IN SELECT * FROM jsonb_array_elements(_cart_items) AS elem
    LOOP
      IF _coupon.applies_to = 'product' AND (_item.elem->>'product_id')::uuid = ANY(_coupon.product_ids) THEN
        _eligible_total := _eligible_total + (_item.elem->>'line_total')::numeric;
      ELSIF _coupon.applies_to = 'category' AND (_item.elem->>'category')::text = ANY(_coupon.categories) THEN
        _eligible_total := _eligible_total + (_item.elem->>'line_total')::numeric;
      END IF;
    END LOOP;
  END IF;

  IF _eligible_total <= 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'No eligible items for this coupon');
  END IF;

  IF _coupon.discount_type = 'percentage' THEN
    _discount := LEAST(_eligible_total, ROUND(_eligible_total * _coupon.discount_value / 100, 2));
  ELSE
    _discount := LEAST(_eligible_total, _coupon.discount_value);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_type', _coupon.discount_type,
    'discount_value', _coupon.discount_value,
    'discount_amount', _discount,
    'applies_to', _coupon.applies_to
  );
END;
$$;
