ALTER TABLE public.orders ADD COLUMN payment_reference text;
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';