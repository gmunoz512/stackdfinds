import { Badge } from "@/components/ui/badge";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Store, Share2, Copy, Check, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-beach.jpg";
import { useMemo, useState, useEffect } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSignup } from "@/contexts/SignupContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEnsureProfileName } from "@/hooks/useEnsureProfileName";
import HostBottomNav from "@/components/HostBottomNav";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaWhatsapp } from "react-icons/fa";

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  commission_percentage: number | null;
  listing_type: string;
}

const HostVendors = () => {
  const navigate = useNavigate();
  const { recommendations, isLoading: isLoadingProfile } = useProfile();
  const { hostSignupData } = useSignup();
  const { user } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const [vendorProfiles, setVendorProfiles] = useState<VendorProfile[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);

  useEnsureProfileName({
    firstName: hostSignupData.firstName,
    lastName: hostSignupData.lastName,
  });

  const guideUrl = user ? `${window.location.origin}/guide/${user.id}` : "";
  const shareMessage = `Check out my curated guest guide with local recommendations: ${guideUrl}`;

  const handleCopyLink = async () => {
    if (!guideUrl) return;
    try {
      await navigator.clipboard.writeText(guideUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with your guests" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleShareSMS = () => {
    if (!guideUrl) return;
    window.open(`sms:?body=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    if (!guideUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  // UUID regex to validate IDs
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Get vendor IDs from recommendations (only valid UUIDs)
  const savedVendorIds = useMemo(() => {
    return recommendations
      .filter(r => r.type === 'vendor' && isValidUUID(r.id))
      .map(r => r.id);
  }, [recommendations]);

  // Fetch vendor profiles from Supabase
  useEffect(() => {
    const fetchVendorProfiles = async () => {
      if (savedVendorIds.length === 0) {
        setVendorProfiles([]);
        return;
      }

      setIsLoadingVendors(true);
      try {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('id, name, category, description, photos, price_per_person, google_rating, commission_percentage, listing_type')
          .in('id', savedVendorIds)
          .eq('is_published', true);

        if (error) {
          console.error('Error fetching vendor profiles:', error);
          toast({ title: "Failed to load vendors", variant: "destructive" });
        } else {
          setVendorProfiles(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    fetchVendorProfiles();
  }, [savedVendorIds]);

  const isLoading = isLoadingProfile || isLoadingVendors;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/80 to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/host/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Vendors</h1>
          </div>
          <p className="text-muted-foreground">
            Browse vendors from Explore to add them to your list
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link 
              to="/explore?mode=host"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-brand to-hot text-paper font-medium hover:scale-105 transition-all text-sm"
            >
              Explore Vendors
            </Link>
            
            {savedVendorIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-primary text-primary font-medium hover:bg-primary/10 transition-all text-sm gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    {copied ? (
                      <Check className="h-4 w-4 mr-2 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareSMS} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Share via Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
                    <FaWhatsapp className="h-4 w-4 mr-2 text-success" />
                    Share via WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your vendors...</p>
          </div>
        ) : savedVendorIds.length === 0 ? (
          <Card className="max-w-md mx-auto p-8 text-center bg-card/80 backdrop-blur-sm">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Yet</h3>
            <p className="text-muted-foreground mb-4">
              Browse experiences and click "Add to Vendor List" to add vendors here.
            </p>
          </Card>
        ) : (
          /* Vendors Grid - Smaller cards like AppView */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-12">
            {vendorProfiles.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendor/${vendor.id}`}
                className="block group"
              >
                <div className="space-y-1.5">
                  {/* Image - Smaller like AppView */}
                  <div className="relative aspect-square overflow-hidden rounded-xl shadow-md">
                    <img 
                      src={vendor.photos?.[0] || heroImage}
                      alt={vendor.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Commission Badge */}
                    {vendor.commission_percentage && (
                      <div className="absolute top-2 right-2 z-20">
                        <Badge className="bg-success/90 text-paper backdrop-blur-sm shadow-md text-xs px-1.5 py-0.5 font-semibold">
                          {vendor.commission_percentage}%
                        </Badge>
                      </div>
                    )}

                    {/* Gradient overlay with name */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                      <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
                    </div>
                  </div>

                  {/* Content - Compact */}
                  <div className="space-y-0.5 px-0.5">
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {vendor.listing_type === 'restaurant' ? 'Restaurant' : 'Experience'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <GoogleRating
                        value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                        showCount={false}
                        className="text-[10px]"
                        starClassName="h-2.5 w-2.5"
                      />
                      {resolveGoogleRating({ googleRating: vendor.google_rating }) ? (
                        <span className="text-muted-foreground">•</span>
                      ) : null}
                      {vendor.price_per_person && (
                        <span className="text-muted-foreground">${vendor.price_per_person}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostVendors;
