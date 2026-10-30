import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, Star, Clock, Users, CheckCircle, Heart,
  Instagram, ExternalLink, Store, Eye, Edit, Globe, Plus, Trash2, Loader2, ImagePlus, GripVertical,
  ShieldCheck, AlertCircle, XCircle, MessageSquare, Send, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import VendorBottomNav from '@/components/VendorBottomNav';
import StackedPhotoGrid from '@/components/ui/stacked-photo-grid';
import { Reorder } from 'framer-motion';
import MeetTheHost from '@/components/MeetTheHost';
import { VendorLocationMap } from '@/components/VendorLocationMap';
import { VettedBadge } from '@/components/listing/VettedBadge';
import { RefundPolicy } from '@/components/listing/RefundPolicy';
import { GoogleRating } from '@/components/GoogleRating';
import { resolveGoogleRating } from '@/lib/googleRating';
import { GoogleReviewsPreview } from '@/components/GoogleReviewsPreview';
import { VendorReviews } from '@/components/VendorReviews';

// PriceTier interface
interface PriceTier {
  name: string;
  price: number;
}

type VerificationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'changes_requested';

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  about_experience: string | null;
  instagram_url: string | null;
  photos: string[] | null;
  menu_url: string | null;
  price_per_person: number | null;
  price_tiers: PriceTier[] | null;
  duration: string | null;
  max_guests: number | null;
  included_items: string[] | null;
  google_rating: number | null;
  google_reviews_url: string | null;
  is_published: boolean | null;
  listing_type: string | null;
  commission_percentage: number | null;
  verification_status: VerificationStatus | null;
  verification_notes: string | null;
  stripe_onboarding_complete: boolean | null;
  host_bio: string | null;
  host_avatar_url: string | null;
  meeting_point_description: string | null;
  google_place_id: string | null;
  city: string | null;
  cancellation_hours: number | null;
  verified_at: string | null;
}

const openExternalLink = (url: string) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const VendorProfilePreview = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [id, user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      let query = supabase.from('vendor_profiles').select('*');
      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.eq('user_id', user.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();
      if (error) throw error;
      if (data) {
        let priceTiers: PriceTier[] = [];
        if (Array.isArray(data.price_tiers)) {
          priceTiers = data.price_tiers.map((tier: unknown) => {
            const t = tier as { name?: string; price?: number };
            return { name: t.name || '', price: t.price || 0 };
          });
        }
        setProfile({ ...data, price_tiers: priceTiers } as VendorProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!profile) return;
    if (profile.verification_status !== 'approved') {
      toast.error('Your profile must be approved before publishing. Submit for review first.');
      return;
    }
    if (!profile.stripe_onboarding_complete) {
      toast.error('Complete your payment setup before publishing.');
      navigate('/vendor/payment-settings');
      return;
    }
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ is_published: !profile.is_published })
        .eq('id', profile.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, is_published: !prev.is_published } : null);
      toast.success(profile.is_published ? 'Profile unpublished' : 'Profile published successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsPublishing(false);
    }
  };

  const validateProfileForReview = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!profile) return { valid: false, errors: ['Profile not loaded'] };
    if ((profile.photos?.length ?? 0) < 3) errors.push('Add at least 3 photos');
    if (!profile.about_experience || profile.about_experience.length < 50) errors.push('Add a description (at least 50 characters)');
    if (!profile.price_per_person && (!profile.price_tiers || profile.price_tiers.length === 0)) errors.push('Set your pricing');
    if (!profile.duration) errors.push('Specify the duration');
    return { valid: errors.length === 0, errors };
  };

  const handleSubmitForReview = async () => {
    if (!profile) return;
    const validation = validateProfileForReview();
    if (!validation.valid) {
      toast.error('Complete your profile first: ' + validation.errors.join(', '));
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('vendor-review', {
        body: { action: 'submit', vendorId: profile.id },
      });
      if (error || !data?.success) throw error || new Error(data?.error || 'Submission failed');
      setProfile(prev => prev ? { ...prev, verification_status: 'pending' } : null);
      toast.success('Profile submitted for review!');
      if (data.notificationSent === false) toast.warning('Your submission was saved, but the notification email could not be sent.');
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error('Failed to submit for review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user || !profile) return;
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('vendor-photos').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('vendor-photos').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
      const currentPhotos = profile.photos || [];
      const newPhotos = [...currentPhotos, ...uploadedUrls];
      const { error: updateError } = await supabase
        .from('vendor_profiles')
        .update({ photos: newPhotos })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, photos: newPhotos } : null);
      toast.success(`${uploadedUrls.length} photo(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoUrl: string, index: number) => {
    if (!profile) return;
    try {
      const urlParts = photoUrl.split('/vendor-photos/');
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from('vendor-photos').remove([filePath]);
      }
      const newPhotos = profile.photos?.filter((_, i) => i !== index) || [];
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ photos: newPhotos })
        .eq('id', profile.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, photos: newPhotos } : null);
      toast.success('Photo deleted');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-[375px] mx-auto">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[280px] w-full mt-4" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No profile found</p>
          <Button onClick={() => navigate('/vendor/create-profile')}>
            Create Profile
          </Button>
        </div>
        <VendorBottomNav />
      </div>
    );
  }

  const photos = profile.photos || [];
  const currentPrice = profile.price_tiers && profile.price_tiers.length > 0
    ? profile.price_tiers[0]?.price || 0
    : profile.price_per_person || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="max-w-[375px] mx-auto">
        {/* Preview Banner */}
        <div className="sticky top-0 z-50 bg-warning text-warning-abyss px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview - How Guests See You</span>
          </div>
          <Badge variant={profile.is_published ? "default" : "secondary"} className="text-xs">
            {profile.is_published ? 'Live' : 'Draft'}
          </Badge>
        </div>

        {/* Verification Status Banner */}
        {profile.verification_status && profile.verification_status !== 'approved' && (
          <div className={`px-4 py-3 ${
            profile.verification_status === 'pending' 
              ? 'bg-warning-tint dark:bg-warning-abyss/50 text-warning-dark dark:text-warning-muted' 
              : profile.verification_status === 'rejected' 
              ? 'bg-danger-tint dark:bg-danger-abyss/50 text-danger-dark dark:text-danger-muted'
              : profile.verification_status === 'changes_requested'
              ? 'bg-brand-tint dark:bg-brand-abyss/50 text-brand-dark dark:text-brand-muted'
              : 'bg-neutral-tint dark:bg-neutral-dark text-neutral-dark dark:text-neutral-muted'
          }`}>
            <div className="flex items-start gap-2">
              {profile.verification_status === 'pending' && (
                <>
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pending Review</p>
                    <p className="text-xs opacity-80">Your profile is being reviewed by our team.</p>
                  </div>
                </>
              )}
              {profile.verification_status === 'rejected' && (
                <>
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Profile Rejected</p>
                    <p className="text-xs opacity-80">{profile.verification_notes || 'Please update your profile and resubmit for review.'}</p>
                  </div>
                </>
              )}
              {profile.verification_status === 'changes_requested' && (
                <>
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Changes Requested</p>
                    <p className="text-xs opacity-80">{profile.verification_notes || 'Please make the requested changes and resubmit.'}</p>
                  </div>
                </>
              )}
              {profile.verification_status === 'draft' && (
                <>
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Complete Your Profile</p>
                    <p className="text-xs opacity-80">Submit for review to start accepting bookings.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {profile.verification_status === 'approved' && !profile.is_published && (
          <div className="px-4 py-3 bg-success-tint dark:bg-success-abyss/50 text-success-dark dark:text-success-muted">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Approved! Ready to Publish</p>
                <p className="text-xs opacity-80">Your profile has been verified. Click Publish to go live.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-[40px] z-40 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/vendor/dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Upload photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-9 w-9"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Heart className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Photo Grid */}
        <div className="px-4">
          {photos.length > 0 ? (
            <StackedPhotoGrid photos={photos.slice(0, 3)} alt={profile.name} />
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-[280px] rounded-xl bg-gradient-to-br from-brand to-iris-strong flex flex-col items-center justify-center gap-2 hover:from-brand-strong hover:to-iris-deep transition-colors cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-12 w-12 text-paper animate-spin" />
              ) : (
                <>
                  <ImagePlus className="h-12 w-12 text-paper/80" />
                  <span className="text-paper font-medium">Add Photos</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Content sections */}
        <div className="px-4">

          {/* Section: Title + Rating */}
          <div className="py-6 space-y-2">
            <h1 className="text-2xl font-semibold leading-tight">{profile.name}</h1>
            <p className="text-[15px] text-muted-foreground">{profile.category}</p>

            <div className="pt-1">
              <GoogleRating
                value={resolveGoogleRating({ googleRating: profile.google_rating })}
                className="text-[15px]"
                starClassName="h-4 w-4"
              />
            </div>
          </div>

          <Separator />

          {/* Section: Quick Info */}
          <div className="py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">{profile.duration || 'Varies'}</p>
                  <p className="text-[13px] text-muted-foreground">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">Up to {profile.max_guests || 'N/A'}</p>
                  <p className="text-[13px] text-muted-foreground">Guests</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Pricing */}
          {profile.price_tiers && profile.price_tiers.length > 0 ? (
            <>
              <div className="py-6 space-y-4">
                <h2 className="text-[22px] font-semibold">Pricing options</h2>
                <div className="space-y-2">
                  {profile.price_tiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-[15px]">{tier.name}</span>
                      <span className="text-[15px] font-semibold">${tier.price}/person</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          ) : currentPrice > 0 ? (
            <>
              <div className="py-6 flex items-center justify-between">
                <span className="text-[15px] text-muted-foreground">Price per person</span>
                <span className="text-xl font-semibold">${currentPrice}</span>
              </div>
              <Separator />
            </>
          ) : null}

          {/* Section: Affiliate Commission */}
          <>
            <div className="py-6">
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[15px] font-medium flex items-center gap-2">
                      💰 Affiliate Commission
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Visible to hosts & vendors only
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-warning-strong dark:text-warning-light">
                      {profile.commission_percentage ? `${profile.commission_percentage}%` : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
          </>

          {/* Section: About This Experience */}
          {profile.about_experience && (
            <>
              <div className="py-6 space-y-3">
                <h2 className="text-[22px] font-semibold">About this experience</h2>
                <div className="relative">
                  <p className={`text-[15px] leading-relaxed text-foreground whitespace-pre-wrap ${!descriptionExpanded ? 'line-clamp-4' : ''}`}>
                    {profile.about_experience}
                  </p>
                  {profile.about_experience.length > 200 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-[15px] font-semibold underline underline-offset-4 mt-2 hover:text-foreground/80 transition-colors"
                    >
                      {descriptionExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Section: What's Included */}
          {profile.included_items && profile.included_items.length > 0 && (
            <>
              <div className="py-6 space-y-4">
                <h2 className="text-[22px] font-semibold">What's included</h2>
                <ul className="space-y-3">
                  {profile.included_items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-[15px]">
                      <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </>
          )}

          {/* Section: Where you'll be */}
          <div className="py-6 space-y-4">
            <h2 className="text-[22px] font-semibold">Where you'll meet</h2>
            <div className="rounded-xl overflow-hidden">
              <VendorLocationMap
                vendorName={profile.name}
                placeId={profile.google_place_id || undefined}
                mode="pin"
              />
            </div>
            {profile.meeting_point_description && (
              <div className="flex items-start gap-2 pt-1">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[15px] text-foreground">{profile.meeting_point_description}</p>
              </div>
            )}
            {profile.city && (
              <p className="text-[14px] text-muted-foreground">{profile.city}</p>
            )}
          </div>
          <Separator />

          {/* Section: Meet your host */}
          <div className="py-6">
            <MeetTheHost
              name={profile.name}
              category={profile.category}
              bio={profile.host_bio}
              avatarUrl={profile.host_avatar_url}
              googleRating={profile.google_rating}
            />
          </div>
          <Separator />

          {/* Section: Google Reviews Preview */}
          {profile.google_place_id && (
            <>
              <div className="py-6">
                <GoogleReviewsPreview googlePlaceId={profile.google_place_id} emptyLabel="No Google reviews yet." />
              </div>
              <Separator />
            </>
          )}

          <div className="py-6 space-y-4">
            <h2 className="text-[22px] font-semibold">Reviews</h2>
            <VendorReviews vendorProfileId={profile.id} />
          </div>
          <Separator />
          <VettedBadge
            verificationStatus={profile.verification_status}
            verifiedAt={profile.verified_at}
            category={profile.category}
          />
          <Separator />
          <RefundPolicy cancellationHours={profile.cancellation_hours} />
          <Separator />

          {/* Section: External Links */}
          {(profile.instagram_url || profile.menu_url || profile.google_reviews_url || profile.google_place_id) && (
            <>
              <div className="py-6 flex flex-wrap gap-2">
                {profile.instagram_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExternalLink(profile.instagram_url!)}
                    className="gap-2 rounded-full"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Button>
                )}
                {profile.menu_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExternalLink(profile.menu_url!)}
                    className="gap-2 rounded-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Menu
                  </Button>
                )}
                {profile.google_reviews_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExternalLink(profile.google_reviews_url!)}
                    className="gap-2 rounded-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Airbnb Reviews
                  </Button>
                )}
                {profile.google_place_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openExternalLink(`https://www.google.com/maps/place/?q=place_id:${profile.google_place_id}`)}
                    className="gap-2 rounded-full"
                  >
                    <Star className="h-4 w-4" />
                    Google Reviews
                  </Button>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Section: Manage Photos */}
          {(profile.photos?.length ?? 0) > 0 && (
            <div className="py-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-semibold">Manage Photos</h2>
                <span className="text-[13px] text-muted-foreground">Drag to reorder</span>
              </div>
              <Reorder.Group
                axis="x"
                values={profile.photos || []}
                onReorder={async (newOrder) => {
                  setProfile(prev => prev ? { ...prev, photos: newOrder } : null);
                  try {
                    const { error } = await supabase
                      .from('vendor_profiles')
                      .update({ photos: newOrder })
                      .eq('id', profile.id);
                    if (error) throw error;
                  } catch (error) {
                    console.error('Error reordering photos:', error);
                    toast.error('Failed to save photo order');
                  }
                }}
                className="grid grid-cols-3 gap-2"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {profile.photos?.map((photo, idx) => (
                  <Reorder.Item
                    key={photo}
                    value={photo}
                    className="aspect-square rounded-lg overflow-hidden relative group/photo cursor-grab active:cursor-grabbing"
                    whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                  >
                    <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-ink/0 group-hover/photo:bg-ink/20 transition-colors" />
                    <div className="absolute top-1 left-1 p-1 bg-ink/50 rounded opacity-0 group-hover/photo:opacity-100 transition-opacity">
                      <GripVertical className="h-3 w-3 text-paper" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo, idx);
                      }}
                      className="absolute top-1 right-1 p-1.5 bg-danger/90 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-paper" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-1 left-1">
                        <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 bg-ink/60 text-paper">
                          Main
                        </Badge>
                      </div>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Add</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-30">
          <div className="max-w-[375px] mx-auto flex items-center gap-3">
            <Button 
              variant="outline"
              className="flex-1 gap-2 rounded-full"
              onClick={() => navigate('/vendor/create-profile')}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
            
            {profile.verification_status === 'approved' ? (
              <Button 
                className="flex-1 gap-2 rounded-full bg-gradient-to-r from-brand to-hot hover:from-brand-strong hover:to-hot-strong text-paper font-semibold"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <Globe className="h-4 w-4" />
                {isPublishing ? 'Updating...' : profile.is_published ? 'Unpublish' : 'Publish'}
              </Button>
            ) : profile.verification_status === 'pending' ? (
              <Button 
                className="flex-1 gap-2 rounded-full"
                disabled
                variant="secondary"
              >
                <Clock className="h-4 w-4" />
                Awaiting Review
              </Button>
            ) : (
              <Button 
                className="flex-1 gap-2 rounded-full bg-gradient-to-r from-mint to-lagoon hover:from-mint-strong hover:to-lagoon-strong text-paper font-semibold"
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorProfilePreview;
