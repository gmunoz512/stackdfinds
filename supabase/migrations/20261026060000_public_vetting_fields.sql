-- Expose the admin approval fields guests need to render a vetted badge.
-- verified_by stays off this view (it is an internal user id).
DROP VIEW IF EXISTS public.vendor_profiles_public;
CREATE VIEW public.vendor_profiles_public AS
 SELECT vp.id,
    vp.name,
    vp.category,
    vp.description,
    vp.about_experience,
    vp.photos,
    vp.price_per_person,
    vp.price_tiers,
    vp.max_guests,
    vp.duration,
    vp.included_items,
    vp.meeting_point_description,
    vp.age_restriction,
    vp.city,
    vp.listing_type,
    vp.is_published,
    vp.cancellation_hours,
    vp.google_rating,
    vp.google_place_id,
    vp.google_reviews_url,
    vp.airbnb_reviews,
    vp.airbnb_experience_url,
    vp.menu_url,
    vp.instagram_url,
    vp.website_url,
    vp.linkedin_url,
    vp.host_bio,
    vp.host_avatar_url,
    vp.trust_score,
    vp.created_at,
    vp.verification_status,
    vp.verified_at
   FROM public.vendor_profiles vp
  WHERE (vp.is_published = true AND vp.verification_status = 'approved'::vendor_verification_status);

GRANT SELECT ON public.vendor_profiles_public TO anon, authenticated;
