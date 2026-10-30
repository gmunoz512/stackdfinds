import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuthContext } from '@/contexts/AuthContext';
import { vendorProfileSchema, CATEGORIES } from './create-profile/schema';
import type { PriceTier, AirbnbReview, ExistingProfile, VendorProfileFormData } from './create-profile/schema';
import { CreateProfileProvider } from './create-profile/form-context';
import { CreateProfileForm } from './create-profile/CreateProfileForm';

const CreateVendorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  // Existing profile state
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Instagram scraping state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedPhotos, setScrapedPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  
  // Menu upload state
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);
  const [menuUrl, setMenuUrl] = useState<string | null>(null);
  
  // Included items state
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  
  // Price tiers state
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  
  // AI generation state
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // Airbnb reviews state
  const [airbnbUrl, setAirbnbUrl] = useState('');
  const [isScrapingAirbnb, setIsScrapingAirbnb] = useState(false);
  const [airbnbReviews, setAirbnbReviews] = useState<AirbnbReview[]>([]);
  
  // Meet the host state
  const [hostBio, setHostBio] = useState('');
  const [hostAvatarUrl, setHostAvatarUrl] = useState<string | null>(null);
  const [meetingPointDescription, setMeetingPointDescription] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Ownership Evidence state
  const [ownershipEvidenceUrls, setOwnershipEvidenceUrls] = useState<string[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<VendorProfileFormData>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      pricePerPerson: 0,
      maxGuests: 10,
      ageRestriction: 'family_friendly',
    }
  });

  const watchedValues = watch();

  // Check for existing profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Parse price_tiers from JSON safely
          let priceTiersData: PriceTier[] = [];
          if (Array.isArray(data.price_tiers)) {
            priceTiersData = data.price_tiers.map((tier: unknown) => {
              const t = tier as { name?: string; price?: number };
              return {
                name: t.name || '',
                price: t.price || 0,
              };
            });
          }
          
          // Parse airbnb_reviews from JSON safely
          let airbnbReviewsData: AirbnbReview[] = [];
          if (Array.isArray(data.airbnb_reviews)) {
            airbnbReviewsData = data.airbnb_reviews.map((review: unknown) => {
              const r = review as { reviewerName?: string; date?: string; comment?: string };
              return {
                reviewerName: r.reviewerName || '',
                date: r.date || '',
                comment: r.comment || '',
              };
            });
          }
          
          setExistingProfile({
            ...data,
            price_tiers: priceTiersData,
            airbnb_reviews: airbnbReviewsData,
            host_bio: data.host_bio || null,
            host_avatar_url: data.host_avatar_url || null,
            meeting_point_description: data.meeting_point_description || null,
          } as ExistingProfile);
          
          // Pre-populate form with existing data
          reset({
            name: data.name,
            listingType: data.listing_type as 'restaurant' | 'experience',
            category: data.category,
            ageRestriction: (data.age_restriction as 'family_friendly' | 'adults_only') || 'family_friendly',
            description: data.description || '',
            aboutExperience: data.about_experience || '',
            instagramUrl: data.instagram_url || '',
            pricePerPerson: data.price_per_person || 0,
            duration: data.duration || '',
            maxGuests: data.max_guests || 10,
            googlePlaceId: data.google_place_id || '',
            googleRating: data.google_rating || undefined,
            googleReviewsUrl: data.google_reviews_url || '',
            commissionPercentage: data.commission_percentage || undefined,
            websiteUrl: data.website_url || '',
            linkedinUrl: data.linkedin_url || '',
            businessRegistrationUrl: data.business_registration_url || '',
          });
          setSelectedPhotos(data.photos || []);
          setScrapedPhotos(data.photos || []);
          setIncludedItems(data.included_items || []);
          setMenuUrl(data.menu_url || null);
          setPriceTiers(priceTiersData);
          setAirbnbUrl(data.airbnb_experience_url || '');
          setAirbnbReviews(airbnbReviewsData);
          setHostBio(data.host_bio || '');
          setHostAvatarUrl(data.host_avatar_url || null);
          setMeetingPointDescription(data.meeting_point_description || '');
          setOwnershipEvidenceUrls(data.ownership_evidence_urls || []);
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    checkExistingProfile();
  }, [user, reset]);

  // Load pre-selected photos from sessionStorage (from Instagram scrape page)
  useEffect(() => {
    const storedPhotos = sessionStorage.getItem('vendorScrapedPhotos');
    const storedInstagramUrl = sessionStorage.getItem('vendorInstagramUrl');
    
    if (storedPhotos) {
      try {
        const photos = JSON.parse(storedPhotos);
        setSelectedPhotos(prev => [...new Set([...prev, ...photos])]);
        setScrapedPhotos(prev => [...new Set([...prev, ...photos])]);
        sessionStorage.removeItem('vendorScrapedPhotos');
      } catch (e) {
        console.error('Error parsing stored photos:', e);
      }
    }
    
    if (storedInstagramUrl) {
      setValue('instagramUrl', storedInstagramUrl);
      sessionStorage.removeItem('vendorInstagramUrl');
    }
  }, [setValue]);

  // Scrape Instagram photos
  const handleScrapeInstagram = async () => {
    const instagramUrl = watchedValues.instagramUrl;
    if (!instagramUrl?.trim()) {
      toast.error('Please enter an Instagram URL');
      return;
    }

    setIsScraping(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-instagram', {
        body: { instagramUrl }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to scrape Instagram');

      const newPhotos = data.data.photos || [];
      setScrapedPhotos(prev => [...new Set([...prev, ...newPhotos])]);
      toast.success(`Found ${newPhotos.length} photos!`);
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scrape Instagram');
    } finally {
      setIsScraping(false);
    }
  };

  // Toggle photo selection
  const togglePhotoSelection = (photo: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photo) 
        ? prev.filter(p => p !== photo)
        : prev.length < 6 
          ? [...prev, photo]
          : prev
    );
  };

  // Handle menu file upload
  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      toast.error('Please upload a PDF or image file');
      return;
    }

    setMenuFile(file);
    setIsUploadingMenu(true);

    try {
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('vendor-menus')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('vendor-menus')
        .getPublicUrl(data.path);

      setMenuUrl(urlData.publicUrl);
      toast.success('Menu uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload menu');
      setMenuFile(null);
    } finally {
      setIsUploadingMenu(false);
    }
  };

  // Add included item
  const addIncludedItem = () => {
    if (newItem.trim() && !includedItems.includes(newItem.trim())) {
      setIncludedItems(prev => [...prev, newItem.trim()]);
      setNewItem('');
    }
  };

  // Remove included item
  const removeIncludedItem = (item: string) => {
    setIncludedItems(prev => prev.filter(i => i !== item));
  };

  // Add price tier
  const addPriceTier = () => {
    if (newTierName.trim() && newTierPrice) {
      const price = parseFloat(newTierPrice);
      if (price > 0) {
        setPriceTiers(prev => [...prev, { name: newTierName.trim(), price }]);
        setNewTierName('');
        setNewTierPrice('');
      }
    }
  };

  // Remove price tier
  const removePriceTier = (index: number) => {
    setPriceTiers(prev => prev.filter((_, i) => i !== index));
  };

  // Update price tier
  const updatePriceTier = (index: number, field: 'name' | 'price', value: string) => {
    setPriceTiers(prev => prev.map((tier, i) => {
      if (i === index) {
        return field === 'price' 
          ? { ...tier, price: parseFloat(value) || 0 }
          : { ...tier, name: value };
      }
      return tier;
    }));
  };

  // Generate AI description
  const handleGenerateDescription = async () => {
    if (!watchedValues.name || !watchedValues.category) {
      toast.error('Please enter a name and category first');
      return;
    }

    setIsGeneratingDescription(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-vendor-description', {
        body: {
          name: watchedValues.name,
          category: watchedValues.category,
          pricePerPerson: watchedValues.pricePerPerson,
          duration: watchedValues.duration,
          maxGuests: watchedValues.maxGuests,
          includedItems,
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to generate description');

      setValue('aboutExperience', data.description);
      toast.success('Description generated!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate description');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Scrape Airbnb reviews
  const handleScrapeAirbnb = async () => {
    if (!airbnbUrl.trim()) {
      toast.error('Please enter an Airbnb experience URL');
      return;
    }

    setIsScrapingAirbnb(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-airbnb-reviews', {
        body: { airbnbUrl }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to scrape Airbnb reviews');

      const reviews = data.data.reviews || [];
      setAirbnbReviews(reviews);
      
      // If we got a rating, update the Google rating field too
      if (data.data.rating) {
        setValue('googleRating', data.data.rating);
      }
      
      toast.success(`Found ${reviews.length} reviews!`);
    } catch (error) {
      console.error('Airbnb scrape error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scrape Airbnb reviews');
    } finally {
      setIsScrapingAirbnb(false);
    }
  };

  // Upload ownership evidence
  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingEvidence(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/evidence-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('vendor-evidence').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('vendor-evidence').getPublicUrl(filePath);
      setOwnershipEvidenceUrls(prev => [...prev, publicUrl]);
      toast.success('Evidence uploaded!');
    } catch (err) {
      console.error('Evidence upload error:', err);
      toast.error('Failed to upload evidence');
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  // Submit form
  const onSubmit = async (formData: VendorProfileFormData) => {
    if (!user) {
      toast.error('Please sign in to create a profile');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate starting price from tiers if available
      const startingPrice = priceTiers.length > 0 
        ? Math.min(...priceTiers.map(t => t.price))
        : formData.pricePerPerson || null;

      const profileData = {
        user_id: user.id,
        name: formData.name,
        listing_type: formData.listingType,
        category: formData.category,
        age_restriction: formData.ageRestriction,
        description: formData.description,
        about_experience: formData.aboutExperience,
        instagram_url: formData.instagramUrl,
        photos: selectedPhotos,
        menu_url: menuUrl,
        price_per_person: startingPrice,
        price_tiers: priceTiers.map(t => ({ name: t.name, price: t.price })) as Json,
        duration: formData.duration,
        max_guests: formData.maxGuests,
        included_items: includedItems,
        google_place_id: formData.googlePlaceId,
        google_rating: formData.googleRating || null,
        google_reviews_url: formData.googleReviewsUrl,
        commission_percentage: formData.commissionPercentage || null,
        airbnb_experience_url: airbnbUrl || null,
        airbnb_reviews: airbnbReviews.map(r => ({ reviewerName: r.reviewerName, date: r.date, comment: r.comment })) as Json,
        host_bio: hostBio || null,
        host_avatar_url: hostAvatarUrl || null,
        meeting_point_description: meetingPointDescription || null,
        website_url: formData.websiteUrl || null,
        linkedin_url: formData.linkedinUrl || null,
        business_registration_url: formData.businessRegistrationUrl || null,
        ownership_evidence_urls: ownershipEvidenceUrls,
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('vendor_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);

        if (error) throw error;
        toast.success('Vendor profile updated!');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('vendor_profiles')
          .insert({
            ...profileData,
            is_published: false,
          });

        if (error) throw error;
        toast.success('Vendor profile created!');
      }

      navigate('/vendor/preview');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUpdateMode = !!existingProfile;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <CreateProfileProvider value={{
      navigate,
      user,
      isScraping,
      scrapedPhotos,
      selectedPhotos,
      menuFile,
      isUploadingMenu,
      menuUrl,
      includedItems,
      newItem,
      setNewItem,
      priceTiers,
      newTierName,
      setNewTierName,
      newTierPrice,
      setNewTierPrice,
      isGeneratingDescription,
      airbnbUrl,
      setAirbnbUrl,
      isScrapingAirbnb,
      airbnbReviews,
      setAirbnbReviews,
      hostBio,
      setHostBio,
      hostAvatarUrl,
      setHostAvatarUrl,
      setIsUploadingAvatar,
      meetingPointDescription,
      setMeetingPointDescription,
      isUploadingAvatar,
      ownershipEvidenceUrls,
      setOwnershipEvidenceUrls,
      isUploadingEvidence,
      isSubmitting,
      register,
      handleSubmit,
      setValue,
      errors,
      watchedValues,
      handleScrapeInstagram,
      togglePhotoSelection,
      handleMenuUpload,
      addIncludedItem,
      removeIncludedItem,
      addPriceTier,
      removePriceTier,
      updatePriceTier,
      handleGenerateDescription,
      handleScrapeAirbnb,
      handleEvidenceUpload,
      onSubmit,
      isUpdateMode,
      CATEGORIES
    }}>
      <CreateProfileForm />
    </CreateProfileProvider>
  );
};

export default CreateVendorProfile;

