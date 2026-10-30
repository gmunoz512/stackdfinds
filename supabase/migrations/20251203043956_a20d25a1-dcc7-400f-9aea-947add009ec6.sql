-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlist_items table
CREATE TABLE public.wishlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  experience_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Wishlists policies
CREATE POLICY "Users can view their own wishlists" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wishlists" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists" ON public.wishlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist items policies (based on wishlist ownership)
CREATE POLICY "Users can view their wishlist items" ON public.wishlist_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can add items to their wishlists" ON public.wishlist_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can remove items from their wishlists" ON public.wishlist_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.wishlists WHERE id = wishlist_id AND user_id = auth.uid())
  );

-- Update trigger for wishlists
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();