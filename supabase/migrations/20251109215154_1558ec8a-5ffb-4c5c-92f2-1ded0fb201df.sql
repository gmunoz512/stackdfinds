-- Trigger type regeneration by adding a comment to the vendors table
COMMENT ON TABLE public.vendors IS 'Stores vendor partnerships for hosts';

-- Ensure the index exists
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON public.vendors(created_at DESC);