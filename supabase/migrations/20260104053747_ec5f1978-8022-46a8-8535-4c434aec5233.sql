-- Remove the existing INSERT policy that allows users to self-assign any role
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create a restrictive policy that prevents all direct client-side role inserts
-- Role assignment will only be possible through the service role via edge function
CREATE POLICY "Block direct role inserts"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);

-- Add a policy that allows the service role to insert roles (implicit with service role key)