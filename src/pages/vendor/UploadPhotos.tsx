import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Instagram, Image, Check, ArrowRight, X, Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

const TestInstagramScrape = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedPhotos, setScrapedPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter an Instagram URL');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-instagram', {
        body: { instagramUrl: url }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        // Check if it's the "not supported" error
        if (data?.error?.includes('not currently supported')) {
          toast.error('Instagram scraping requires enterprise access. Please upload photos manually instead.');
        } else {
          throw new Error(data?.error || 'Failed to scrape Instagram');
        }
        return;
      }

      if (data.data?.photos?.length > 0) {
        setScrapedPhotos(data.data.photos);
        toast.success(`Found ${data.data.photos.length} photos!`);
      } else {
        toast.info('No photos found. Try uploading manually.');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error('Instagram scraping is not available. Please upload photos manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('vendor-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('vendor-photos')
          .getPublicUrl(data.path);

        newPhotos.push(urlData.publicUrl);
      }

      if (newPhotos.length > 0) {
        setUploadedPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`Uploaded ${newPhotos.length} photo(s)!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const togglePhotoSelection = (photo: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photo) 
        ? prev.filter(p => p !== photo)
        : prev.length < 6 
          ? [...prev, photo]
          : prev
    );
  };

  const handleContinue = () => {
    sessionStorage.setItem('vendorScrapedPhotos', JSON.stringify(selectedPhotos));
    sessionStorage.setItem('vendorInstagramUrl', url);
    navigate('/vendor/create-profile');
  };

  const allPhotos = [...uploadedPhotos, ...scrapedPhotos];

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-iris to-hot rounded-2xl mb-4">
            <Camera className="h-8 w-8 text-paper" />
          </div>
          <h1 className="text-2xl font-bold">Add Your Photos</h1>
          <p className="text-muted-foreground">
            Upload photos to showcase your services
          </p>
        </div>

        {/* Upload Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Photos
            </CardTitle>
            <CardDescription>
              Select up to 6 high-quality photos of your work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full gap-2"
              variant="outline"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose Photos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Scrape (Optional) */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Instagram className="h-5 w-5" />
              Import from Instagram (Beta)
            </CardTitle>
            <CardDescription>
              Try to import photos from your Instagram profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://instagram.com/yourusername"
                className="flex-1"
              />
              <Button onClick={handleScrape} disabled={isLoading} variant="secondary">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Try Import'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Instagram import may not work for all profiles. Uploading photos directly is recommended.
            </p>
          </CardContent>
        </Card>

        {/* Photo Selection */}
        {allPhotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Select Your Photos
              </CardTitle>
              <CardDescription>
                Choose up to 6 photos for your profile ({selectedPhotos.length}/6 selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {allPhotos.map((photo, index) => (
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
                        target.parentElement!.style.display = 'none';
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
            </CardContent>
          </Card>
        )}

        {/* Selected Preview & Continue */}
        {selectedPhotos.length > 0 && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium">Selected Photos</p>
                <Button onClick={handleContinue} className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedPhotos.map((photo, index) => (
                  <div key={index} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                    <img src={photo} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhotoSelection(photo);
                      }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip option */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/vendor/create-profile')}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TestInstagramScrape;
