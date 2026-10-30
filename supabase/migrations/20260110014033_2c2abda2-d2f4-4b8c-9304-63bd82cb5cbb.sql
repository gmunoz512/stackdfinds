-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active promo codes (for validation)
CREATE POLICY "Anyone can validate promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Create function to validate and apply promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT, p_order_amount NUMERIC)
RETURNS TABLE (
  valid BOOLEAN,
  discount_type TEXT,
  discount_value NUMERIC,
  discount_amount NUMERIC,
  message TEXT
) AS $$
DECLARE
  v_promo RECORD;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo 
  FROM public.promo_codes 
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'This promo code has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check max uses
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;
  
  -- Check minimum order amount
  IF p_order_amount < v_promo.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
      ('Minimum order amount is $' || v_promo.min_order_amount)::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    RETURN QUERY SELECT true, v_promo.discount_type, v_promo.discount_value, 
      ROUND((p_order_amount * v_promo.discount_value / 100)::NUMERIC, 2),
      (v_promo.discount_value || '% discount applied!')::TEXT;
  ELSE
    RETURN QUERY SELECT true, v_promo.discount_type, v_promo.discount_value,
      LEAST(v_promo.discount_value, p_order_amount),
      ('$' || v_promo.discount_value || ' discount applied!')::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert some sample promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, max_uses, expires_at) VALUES
('WELCOME10', 'percentage', 10, 100, now() + interval '1 year'),
('SAVE20', 'fixed', 20, 50, now() + interval '6 months'),
('SUMMER25', 'percentage', 25, NULL, now() + interval '3 months');