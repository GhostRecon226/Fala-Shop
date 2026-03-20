
-- Function to decrease stock when order items are inserted
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - NEW.quantity, 0)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

-- Trigger on order_items insert
CREATE TRIGGER trg_decrease_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrease_stock_on_order();
