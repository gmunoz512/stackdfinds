
-- =============================================
-- Phase 2: Messaging, Fraud Detection, Refunds
-- =============================================

-- 1. Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid NOT NULL,
  host_user_id uuid NOT NULL,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = guest_user_id OR auth.uid() = host_user_id);

-- Participants can create conversations for their bookings
CREATE POLICY "Participants can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = guest_user_id
    AND EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = conversations.booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update conversations (flagging)
CREATE POLICY "Admins can update conversations"
  ON public.conversations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.guest_user_id = auth.uid() OR c.host_user_id = auth.uid())
    )
  );

-- Participants can send messages in their conversations
CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.guest_user_id = auth.uid() OR c.host_user_id = auth.uid())
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Message fraud detection trigger
CREATE OR REPLACE FUNCTION public.check_message_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_pattern text;
  matched boolean := false;
  reason text := '';
BEGIN
  -- Check for off-platform payment/contact patterns
  IF NEW.content ~* '(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})' THEN
    matched := true;
    reason := 'Phone number detected';
  ELSIF NEW.content ~* '\b(whatsapp|telegram|signal|venmo|paypal|cashapp|cash\s*app|zelle|wire\s*transfer|pay\s*me\s*directly|western\s*union|crypto|bitcoin|eth|usdt)\b' THEN
    matched := true;
    reason := 'Off-platform payment/contact method detected: ' || substring(NEW.content from '\b(whatsapp|telegram|signal|venmo|paypal|cashapp|zelle|wire\s*transfer)\b');
  END IF;

  IF matched THEN
    NEW.is_flagged := true;
    NEW.flag_reason := reason;
    -- Also flag the conversation
    UPDATE conversations SET is_flagged = true, flag_reason = reason WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_message_content
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_content();

-- 4. Fraud alerts table
CREATE TABLE public.fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  target_user_id uuid NOT NULL,
  target_listing_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud alerts"
  ON public.fraud_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fraud alerts"
  ON public.fraud_alerts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Fraud detection trigger on vendor_profiles
CREATE OR REPLACE FUNCTION public.check_vendor_fraud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  listing_count integer;
BEGIN
  -- Check for too many listings
  SELECT COUNT(*) INTO listing_count
  FROM vendor_profiles WHERE user_id = NEW.user_id;

  IF listing_count >= 3 THEN
    INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
    VALUES ('multiple_listings', NEW.user_id, NEW.id, 
      jsonb_build_object('listing_count', listing_count + 1, 'listing_name', NEW.name));
  END IF;

  -- Check for suspicious pricing
  IF NEW.price_per_person IS NOT NULL AND NEW.price_per_person < 5 THEN
    INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
    VALUES ('suspicious_pricing', NEW.user_id, NEW.id,
      jsonb_build_object('price', NEW.price_per_person, 'listing_name', NEW.name));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_vendor_fraud
  AFTER INSERT ON public.vendor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vendor_fraud();

-- 6. Refund requests table
CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view own refund requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can create refund requests for their bookings
CREATE POLICY "Users can create refund requests"
  ON public.refund_requests FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = refund_requests.booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update refund requests
CREATE POLICY "Admins can update refund requests"
  ON public.refund_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. Refund evidence storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('refund-evidence', 'refund-evidence', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload refund evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'refund-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own refund evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'refund-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all refund evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'refund-evidence' AND has_role(auth.uid(), 'admin'));
