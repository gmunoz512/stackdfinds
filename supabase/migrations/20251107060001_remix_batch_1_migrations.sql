
-- Migration: 20251102222124
-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  commission NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own vendors"
ON public.vendors
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vendors"
ON public.vendors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendors"
ON public.vendors
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendors"
ON public.vendors
FOR DELETE
USING (auth.uid() = user_id);
