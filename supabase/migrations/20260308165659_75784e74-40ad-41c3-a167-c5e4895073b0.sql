
-- Fix 1: host_vendor_links privilege escalation
-- Restrict INSERT to users with 'host' role only
DROP POLICY IF EXISTS "Hosts can add vendors" ON public.host_vendor_links;
CREATE POLICY "Hosts can add vendors"
  ON public.host_vendor_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = host_user_id
    AND public.has_role(auth.uid(), 'host')
  );

-- Fix 2: Promo codes publicly enumerable
-- Remove broad SELECT policy; the validate_promo_code security definer function still works
DROP POLICY IF EXISTS "Anyone can validate promo codes" ON public.promo_codes;

-- Fix 3: Itinerary items data leak
-- Remove overly broad policy that leaks all items when any shared itinerary is public
DROP POLICY IF EXISTS "Anyone can view items from public itineraries" ON public.itinerary_items;
