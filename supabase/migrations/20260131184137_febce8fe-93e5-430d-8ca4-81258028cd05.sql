-- STEP 1: Create helper functions FIRST (these bypass RLS)

CREATE OR REPLACE FUNCTION public.is_itinerary_collaborator(
  _itinerary_id uuid,
  _permission text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM itinerary_collaborators ic
    WHERE ic.itinerary_id = _itinerary_id
      AND (ic.user_id = auth.uid() OR ic.email = auth.email())
      AND (_permission IS NULL OR ic.permission = _permission)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_itinerary_owner(_itinerary_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM itineraries i
    WHERE i.id = _itinerary_id
      AND i.user_id = auth.uid()
  );
END;
$$;

-- STEP 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Collaborators can view shared itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Editors can update shared itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Owners can manage collaborators" ON public.itinerary_collaborators;

-- STEP 3: Recreate policies using the helper functions
CREATE POLICY "Collaborators can view shared itineraries"
ON public.itineraries FOR SELECT
USING (public.is_itinerary_collaborator(id));

CREATE POLICY "Editors can update shared itineraries"
ON public.itineraries FOR UPDATE
USING (public.is_itinerary_collaborator(id, 'editor'));

CREATE POLICY "Owners can manage collaborators"
ON public.itinerary_collaborators FOR ALL
USING (public.is_itinerary_owner(itinerary_id))
WITH CHECK (public.is_itinerary_owner(itinerary_id));