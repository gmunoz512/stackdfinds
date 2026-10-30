import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Instagram, Upload, Sparkles, Check, X, Plus,
  DollarSign, Clock, Users, ChevronLeft, Image as ImageIcon, Star, MessageSquare, MapPin, UserCircle, ShieldCheck
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreateProfileForm } from './form-context';

export function CreateProfileForm() {
  const {
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
  } = useCreateProfileForm();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" aria-label="Back to vendor profile" onClick={() => navigate('/vendor/profile')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isUpdateMode ? 'Update Vendor Profile' : 'Create Vendor Profile'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us about your service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Listing Type Selection */}
            <div className="space-y-2">
              <Label>Where should this appear? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('listingType', 'restaurant')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    watchedValues.listingType === 'restaurant'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-2xl mb-2">🍽️</div>
                  <p className="font-medium">Restaurant</p>
                  <p className="text-xs text-muted-foreground">Appears in "Restaurants Near You"</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('listingType', 'experience')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    watchedValues.listingType === 'experience'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-2xl mb-2">✨</div>
                  <p className="font-medium">Experience</p>
                  <p className="text-xs text-muted-foreground">Appears in "Popular Experiences"</p>
                </button>
              </div>
              {errors.listingType && <p className="text-sm text-destructive">{errors.listingType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Chef Maria's Kitchen"
                {...register('name')}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={watchedValues.category} 
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            {/* Age Restriction Selection */}
            <div className="space-y-2">
              <Label>Who is this for? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('ageRestriction', 'family_friendly')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    watchedValues.ageRestriction === 'family_friendly'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                  <p className="font-medium">Family Friendly</p>
                  <p className="text-xs text-muted-foreground">Suitable for all ages</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('ageRestriction', 'adults_only')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    watchedValues.ageRestriction === 'adults_only'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="text-2xl mb-2">🍷</div>
                  <p className="font-medium">Adults Only</p>
                  <p className="text-xs text-muted-foreground">21+ or contains mature content</p>
                </button>
              </div>
              {errors.ageRestriction && <p className="text-sm text-destructive">{errors.ageRestriction.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                placeholder="Brief tagline or summary..."
                {...register('description')}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instagram Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Photos from Instagram
            </CardTitle>
            <CardDescription>Scrape high-quality photos from your Instagram profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://instagram.com/yourusername"
                {...register('instagramUrl')}
                className="flex-1"
              />
              <Button type="button" onClick={handleScrapeInstagram} disabled={isScraping}>
                {isScraping ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scrape'}
              </Button>
            </div>

            {scrapedPhotos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Select up to 6 photos ({selectedPhotos.length}/6 selected)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {scrapedPhotos.map((photo, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPhotos.includes(photo) 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                      onClick={() => togglePhotoSelection(photo)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {selectedPhotos.includes(photo) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-primary-foreground bg-primary rounded-full p-1" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPhotos.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Selected Photos Preview</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                      <img src={photo} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => togglePhotoSelection(photo)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Menu / Service List
            </CardTitle>
            <CardDescription>Upload a PDF or image of your menu or service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleMenuUpload}
                  disabled={isUploadingMenu}
                  className="flex-1"
                />
                {isUploadingMenu && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
              
              {menuUrl && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">{menuFile?.name || 'Menu uploaded'}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(menuUrl, '_blank')}
                  >
                    View
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Details */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Details</CardTitle>
            <CardDescription>Set your pricing tiers and service parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Tiers */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Pricing Tiers
              </Label>
              <p className="text-xs text-muted-foreground">
                Add pricing tiers for your service (e.g., Tier 1, Tier 2, Tier 3)
              </p>
              
              {/* Existing tiers */}
              {priceTiers.length > 0 && (
                <div className="space-y-2">
                  {priceTiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground w-14">Tier {index + 1}</span>
                      <Input
                        value={tier.name}
                        onChange={(e) => updatePriceTier(index, 'name', e.target.value)}
                        placeholder="Service name"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={tier.price}
                          onChange={(e) => updatePriceTier(index, 'price', e.target.value)}
                          placeholder="0"
                          className="w-24"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePriceTier(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new tier */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-14">Tier {priceTiers.length + 1}</span>
                <Input
                  value={newTierName}
                  onChange={(e) => setNewTierName(e.target.value)}
                  placeholder="e.g., Service"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPriceTier())}
                />
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={newTierPrice}
                    onChange={(e) => setNewTierPrice(e.target.value)}
                    placeholder="0"
                    className="w-24"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPriceTier())}
                  />
                </div>
                <Button type="button" variant="outline" onClick={addPriceTier}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {priceTiers.length === 0 && (
                <p className="text-xs text-warning-strong dark:text-warning-light">
                  💡 Tip: Add at least one pricing option so guests can see your rates
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxGuests" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Max Guests *
                </Label>
                <Input
                  id="maxGuests"
                  type="number"
                  placeholder="10"
                  {...register('maxGuests')}
                />
                {errors.maxGuests && <p className="text-sm text-destructive">{errors.maxGuests.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration *
                </Label>
                <Input
                  id="duration"
                  placeholder="e.g., 3 hours"
                  {...register('duration')}
                />
                {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
              </div>
            </div>

            {/* Included Items */}
            <div className="space-y-2">
              <Label>What's Included</Label>
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add an item..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIncludedItem())}
                />
                <Button type="button" variant="outline" onClick={addIncludedItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {includedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {includedItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {item}
                      <button type="button" onClick={() => removeIncludedItem(item)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Google Reviews (Optional)</CardTitle>
            <CardDescription>Link to your Google reviews for credibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleRating">Google Star Rating</Label>
              <Input
                id="googleRating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                placeholder="4.8"
                {...register('googleRating')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleReviewsUrl">Google Reviews URL</Label>
              <Input
                id="googleReviewsUrl"
                placeholder="https://g.page/..."
                {...register('googleReviewsUrl')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Airbnb Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Airbnb Experience Reviews
            </CardTitle>
            <CardDescription>Import reviews from your Airbnb experience listing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.airbnb.com/experiences/..."
                value={airbnbUrl}
                onChange={(e) => setAirbnbUrl(e.target.value)}
                className="flex-1"
              />
              <Button type="button" onClick={handleScrapeAirbnb} disabled={isScrapingAirbnb}>
                {isScrapingAirbnb ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
              </Button>
            </div>

            {airbnbReviews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">{airbnbReviews.length} reviews imported</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {airbnbReviews.map((review, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{review.reviewerName}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">"{review.comment}"</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-destructive hover:text-destructive"
                        onClick={() => setAirbnbReviews(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {airbnbReviews.length === 0 && (
              <p className="text-xs text-muted-foreground">
                💡 Paste your Airbnb experience URL to automatically import guest reviews
              </p>
            )}
          </CardContent>
        </Card>

        {/* Meet the Vendor / About You */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Meet the Host
            </CardTitle>
            <CardDescription>
              Add a personal touch — guests love knowing who's behind the experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Your Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {hostAvatarUrl ? (
                    <AvatarImage src={hostAvatarUrl} alt="Host avatar" />
                  ) : null}
                  <AvatarFallback className="text-lg bg-muted">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingAvatar}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;
                      setIsUploadingAvatar(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
                        const { error: uploadError } = await supabase.storage.from('vendor-photos').upload(filePath, file);
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage.from('vendor-photos').getPublicUrl(filePath);
                        setHostAvatarUrl(publicUrl);
                        toast.success('Photo uploaded!');
                      } catch (err) {
                        console.error('Avatar upload error:', err);
                        toast.error('Failed to upload photo');
                      } finally {
                        setIsUploadingAvatar(false);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">A friendly headshot helps build trust</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="hostBio">About You</Label>
              <Textarea
                id="hostBio"
                placeholder="Tell guests about yourself — your passion, what makes your experience special..."
                value={hostBio}
                onChange={(e) => setHostBio(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {hostBio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Where You'll Meet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Where You'll Meet
            </CardTitle>
            <CardDescription>
              Describe where guests should meet you for the experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetingPoint">Meeting Point Description</Label>
              <Textarea
                id="meetingPoint"
                placeholder="e.g., We'll meet at the cenote entrance near the parking lot. Look for the blue van with our logo."
                value={meetingPointDescription}
                onChange={(e) => setMeetingPointDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                💡 Be specific so guests can easily find you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ownership Evidence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Ownership & Verification
            </CardTitle>
            <CardDescription>
              Help us verify that you own and operate this experience to build trust and increase your trust score.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
              <Input
                id="websiteUrl"
                placeholder="https://www.yourbusiness.com"
                {...register('websiteUrl')}
              />
              {errors.websiteUrl && <p className="text-sm text-destructive">{errors.websiteUrl.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile (Optional)</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/yourprofile"
                {...register('linkedinUrl')}
              />
              {errors.linkedinUrl && <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistrationUrl">Business Registration URL (Optional)</Label>
              <Input
                id="businessRegistrationUrl"
                placeholder="Link to public registry or document"
                {...register('businessRegistrationUrl')}
              />
              {errors.businessRegistrationUrl && <p className="text-sm text-destructive">{errors.businessRegistrationUrl.message}</p>}
            </div>

            <div className="space-y-2 pt-2">
              <Label>Additional Evidence (Photos/Documents)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload photos of your equipment, past events, or other proof of operation.
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  disabled={isUploadingEvidence}
                  onChange={handleEvidenceUpload}
                />
                {isUploadingEvidence && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                
                {ownershipEvidenceUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {ownershipEvidenceUrls.map((url, index) => (
                      <div key={index} className="relative flex-shrink-0 w-20 h-20 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {url.includes('.pdf') ? (
                          <span className="text-xs font-medium">PDF</span>
                        ) : (
                          <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setOwnershipEvidenceUrls(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Affiliate Program
            </CardTitle>
            <CardDescription>
              Set the commission percentage you offer to hosts who refer guests to you. 
              This is only visible to hosts and other vendors, not guests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionPercentage" className="flex items-center gap-1">
                Commission Percentage
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commissionPercentage"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="15"
                  {...register('commissionPercentage')}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Example: If you set 15%, hosts earn $15 for every $100 booking they refer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              About This Experience
            </CardTitle>
            <CardDescription>Generate or write a compelling description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription}
              className="w-full"
            >
              {isGeneratingDescription ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
            
            <Textarea
              placeholder="Describe your experience in detail..."
              {...register('aboutExperience')}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUpdateMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isUpdateMode ? 'Update Profile' : 'Create Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
