-- Create itineraries table for persistent storage
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  itinerary_data jsonb NOT NULL DEFAULT '{"days": []}'::jsonb,
  is_confirmed boolean NOT NULL DEFAULT false,
  share_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create itinerary_collaborators table for permission management
CREATE TABLE public.itinerary_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id uuid,
  email text,
  permission text NOT NULL DEFAULT 'viewer' CHECK (permission IN ('viewer', 'editor')),
  invite_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT email_or_user_required CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX idx_itineraries_share_token ON public.itineraries(share_token);
CREATE INDEX idx_collaborators_itinerary_id ON public.itinerary_collaborators(itinerary_id);
CREATE INDEX idx_collaborators_user_id ON public.itinerary_collaborators(user_id);
CREATE INDEX idx_collaborators_email ON public.itinerary_collaborators(email);
CREATE INDEX idx_collaborators_invite_token ON public.itinerary_collaborators(invite_token);

-- Enable RLS on both tables
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itineraries table

-- Owners can do everything with their itineraries
CREATE POLICY "Owners can manage their itineraries"
  ON public.itineraries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view public itineraries via share_token
CREATE POLICY "Anyone can view public itineraries"
  ON public.itineraries
  FOR SELECT
  USING (is_public = true);

-- Collaborators can view itineraries they have access to
CREATE POLICY "Collaborators can view shared itineraries"
  ON public.itineraries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itinerary_collaborators ic
      WHERE ic.itinerary_id = itineraries.id
      AND (ic.user_id = auth.uid() OR ic.email = auth.email())
    )
  );

-- Collaborators with editor permission can update itineraries
CREATE POLICY "Editors can update shared itineraries"
  ON public.itineraries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itinerary_collaborators ic
      WHERE ic.itinerary_id = itineraries.id
      AND (ic.user_id = auth.uid() OR ic.email = auth.email())
      AND ic.permission = 'editor'
    )
  );

-- RLS Policies for itinerary_collaborators table

-- Owners can manage collaborators for their itineraries
CREATE POLICY "Owners can manage collaborators"
  ON public.itinerary_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_collaborators.itinerary_id
      AND i.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_collaborators.itinerary_id
      AND i.user_id = auth.uid()
    )
  );

-- Collaborators can view their own collaborator records
CREATE POLICY "Collaborators can view their access"
  ON public.itinerary_collaborators
  FOR SELECT
  USING (user_id = auth.uid() OR email = auth.email());

-- Create trigger for updated_at on itineraries
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborative updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraries;