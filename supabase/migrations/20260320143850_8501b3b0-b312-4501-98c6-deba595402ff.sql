
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view product images
CREATE POLICY "Product images are viewable by everyone"
  ON public.product_images FOR SELECT TO public
  USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can insert product images"
  ON public.product_images FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
  ON public.product_images FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
  ON public.product_images FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
