import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
serve(async (req) => {
  const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'POST required' });
  const token = req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return reply(401, { error: 'Sign in required' });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user || user.is_anonymous) return reply(401, { error: 'Sign in required' });
    let body;
    try { body = await req.json(); } catch { return reply(400, { error: 'Invalid JSON' }); }
    if (!body || typeof body !== 'object') return reply(400, { error: 'Invalid request' });
    const { action, vendorId, status, notes } = body;
    if (!['submit', 'review'].includes(action) || typeof vendorId !== 'string' ||
        !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(vendorId) ||
        (notes !== undefined && (typeof notes !== 'string' || notes.length > 4000))) {
      return reply(400, { error: 'Invalid review request' });
    }
    if (action === 'review') {
      const { data: allowed, error } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) throw error;
      if (allowed !== true) return reply(403, { error: 'Administrator access required' });
      if (!['approved', 'rejected', 'changes_requested', 'suspended'].includes(status)) {
        return reply(400, { error: 'Invalid review status' });
      }
    }
    let query = admin.from('vendor_profiles').select('id,user_id,name,verification_status,photos,about_experience,price_per_person,price_tiers,duration').eq('id', vendorId);
    if (action === 'submit') query = query.eq('user_id', user.id);
    const { data: vendor, error: readError } = await query.maybeSingle();
    if (readError) throw readError;
    if (!vendor) return reply(404, { error: 'Vendor not found' });
    if (action === 'submit') {
      if (!['draft', 'rejected', 'changes_requested'].includes(vendor.verification_status)) {
        return reply(409, { error: 'This profile cannot be submitted in its current status' });
      }
      if (!Array.isArray(vendor.photos) || vendor.photos.length < 3 ||
          typeof vendor.about_experience !== 'string' || vendor.about_experience.trim().length < 50 ||
          (!vendor.price_per_person && (!Array.isArray(vendor.price_tiers) || !vendor.price_tiers.length)) || !vendor.duration) {
        return reply(400, { error: 'Complete photos, description, pricing and duration before submitting' });
      }
    }
    const nextStatus = action === 'submit' ? 'pending' : status;
    if (vendor.verification_status === nextStatus) return reply(200, { success: true, notificationSent: null });
    const update = action === 'submit'
      ? { verification_status: 'pending', submitted_for_review_at: new Date().toISOString() }
      : { verification_status: status, verification_notes: notes?.trim() || null,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
          verified_by: status === 'approved' ? user.id : null };
    let mutation = admin.from('vendor_profiles').update(update).eq('id', vendorId).eq('verification_status', vendor.verification_status);
    if (action === 'submit') mutation = mutation.eq('user_id', user.id);
    const { data: changed, error: writeError } = await mutation.select('id').maybeSingle();
    if (writeError) throw writeError;
    if (!changed) return reply(409, { error: 'Profile changed during review. Refresh and try again.' });
    // Resolve recipients and content on the server; never accept an email from the caller.
    let notificationSent: boolean | null = null;
    if (nextStatus !== 'suspended') {
      try {
        let vendorEmail;
        if (action === 'review') {
          const { data, error } = await admin.auth.admin.getUserById(vendor.user_id);
          if (error || !data.user?.email) throw new Error('Recipient unavailable');
          vendorEmail = data.user.email;
        }
        const { data, error } = await admin.functions.invoke('send-admin-notification', {
          body: { type: action === 'submit' ? 'vendor_submitted_for_review' : `vendor_${status}`,
            vendorId: vendor.id, vendorName: vendor.name, vendorEmail, verificationNotes: notes?.trim() || '' },
        });
        notificationSent = !error && data?.success === true;
      } catch { notificationSent = false; }
    }
    return reply(200, { success: true, notificationSent });
  } catch (error) {
    console.error('Vendor review failed', error instanceof Error ? error.name : 'UnknownError');
    return reply(500, { error: 'Unable to save review. Please try again.' });
  }
});
