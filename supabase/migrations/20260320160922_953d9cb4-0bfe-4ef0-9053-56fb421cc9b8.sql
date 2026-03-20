ALTER TABLE public.products ADD COLUMN available_colors text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN available_sizes text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.cart_items ADD COLUMN color text;