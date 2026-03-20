
-- First drop the constraint so we can update data
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- Update existing data
UPDATE public.products SET category = 'Clothing' WHERE category = 'Shirts';

-- Re-add constraint with new values
ALTER TABLE public.products ADD CONSTRAINT products_category_check CHECK (category IN ('Solar Fans', 'Clothing', 'Sneakers', 'Bags'));
