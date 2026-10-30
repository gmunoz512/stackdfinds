# Vendor Profile Guidelines

Use this document as a reference when creating or editing vendor profiles in stackd.

---

## 1. Vendor Onboarding Flow

### New Vendor Signup
1. Vendor signs up via `/auth` with role "vendor"
2. Redirected to `/vendor/create-profile` to complete profile
3. Once saved, redirected to `/vendor/preview` to see how guests view their profile

### Returning Vendor Login
1. Vendor logs in via `/auth`
2. System checks if `vendor_profiles` exists for user
3. **If profile exists** → Redirect to `/vendor/dashboard`
4. **If no profile** → Redirect to `/vendor/create-profile` to create one

### Profile Create vs Update
- `/vendor/create-profile` automatically detects existing profile
- **New vendor**: Title shows "Create Vendor Profile", button says "Create Profile"
- **Existing vendor**: Title shows "Update Vendor Profile", button says "Update Profile"
- All existing data is pre-populated in the form

---

## 2. Vendor Preview Page (`/vendor/preview`)

The preview page shows vendors exactly how guests see their profile, plus management tools.

### Component Architecture

```typescript
// Required imports
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ArrowLeft, Star, Clock, Users, CheckCircle, Heart,
  Instagram, ExternalLink, Store, Eye, Edit, Globe, Plus, Trash2, Loader2, ImagePlus, GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import VendorBottomNav from '@/components/VendorBottomNav';
import InteractiveSelector from '@/components/ui/interactive-selector';
import { FaUtensils, FaSpa, FaCamera, FaWineGlass, FaShip, FaBicycle, FaSwimmer, FaMountain } from 'react-icons/fa';
import { Reorder } from 'framer-motion';
```

### TypeScript Interfaces

```typescript
interface PriceTier {
  name: string;
  price: number;
}

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
}
```

### Category Icons Mapping

```typescript
const categoryIcons: Record<string, { icon: string; faIcon: React.ReactNode }> = {
  'Private Chef': { icon: '👨‍🍳', faIcon: <FaUtensils size={20} className="text-white" /> },
  'Massage & Spa': { icon: '💆', faIcon: <FaSpa size={20} className="text-white" /> },
  'Yacht Charter': { icon: '🛥️', faIcon: <FaShip size={20} className="text-white" /> },
  'Photography': { icon: '📸', faIcon: <FaCamera size={20} className="text-white" /> },
  'Tour Guide': { icon: '🗺️', faIcon: <FaMountain size={20} className="text-white" /> },
  'Fitness & Yoga': { icon: '🧘', faIcon: <FaSpa size={20} className="text-white" /> },
  'Wine Tasting': { icon: '🍷', faIcon: <FaWineGlass size={20} className="text-white" /> },
  'Fishing Charter': { icon: '🎣', faIcon: <FaShip size={20} className="text-white" /> },
  'Water Sports': { icon: '🌊', faIcon: <FaSwimmer size={20} className="text-white" /> },
  'Cooking Class': { icon: '👩‍🍳', faIcon: <FaUtensils size={20} className="text-white" /> },
  'Transportation': { icon: '🚗', faIcon: <FaBicycle size={20} className="text-white" /> },
  'default': { icon: '✨', faIcon: <FaSpa size={20} className="text-white" /> },
};
```

### State Variables

```typescript
const navigate = useNavigate();
const { id } = useParams();
const { user } = useAuthContext();
const [profile, setProfile] = useState<VendorProfile | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isPublishing, setIsPublishing] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

### Core Functions

#### fetchProfile
- Fetches vendor profile from `vendor_profiles` table
- If `id` param exists, fetches by profile ID; otherwise fetches by `user_id`
- Safely parses `price_tiers` from JSONB to `PriceTier[]`

#### handlePublish
- Toggles `is_published` boolean in database
- Updates local state and shows success toast

#### handlePhotoUpload
- Accepts multiple files via hidden file input
- Uploads to `vendor-photos` storage bucket at path `{user.id}/{timestamp}-{random}.{ext}`
- Appends new URLs to existing photos array
- Updates database and local state

#### handleDeletePhoto
- Extracts file path from URL
- Removes from `vendor-photos` storage bucket
- Filters photo from array and updates database

### Layout Structure (matches VendorPublicProfile)

1. **Preview Banner** (sticky top)
   - Yellow background: `bg-amber-500 text-amber-950`
   - Eye icon + "Preview - How Guests See You"
   - Draft/Live badge

2. **Header** (sticky below banner)
   - Back button → navigates to `/vendor/dashboard`
   - Category name
   - Add photo button + Heart icon

3. **InteractiveSelector** (photo slideshow)
   - Limited to first 3 photos: `photos.slice(0, 3)`
   - Photo titles: "Featured", "In Action", "View 3"
   - Icons from `categoryIcons` mapping

4. **Empty State** (if no photos)
   - Matches InteractiveSelector dimensions exactly
   - Wrapper: `relative flex flex-col items-center justify-center py-4 bg-background`
   - Button: `w-full max-w-[450px] h-[280px] mx-auto rounded-xl` with `minWidth: 300px`
   - Gradient: `bg-gradient-to-br from-orange-500 to-purple-600`

5. **Content Area** (`px-4 py-6 space-y-6`)
   - Experience Header (emoji + name + category + rating)
   - Price Tiers Card OR Quick Info Card
   - Affiliate Commission Card (amber highlight)
   - About This Experience section
   - What's Included list
   - External Links (Instagram, Menu, Google Reviews)
   - Photo Gallery Management

6. **Fixed Bottom Actions** (`fixed bottom-16`)
   - Edit Profile button (outline)
   - Publish/Unpublish button (gradient)

7. **VendorBottomNav** (fixed bottom navigation)

---

## 3. Photo Management with Drag & Drop

### Implementation
Uses framer-motion's `Reorder` component for drag-and-drop reordering.

```typescript
<Reorder.Group
  axis="x"
  values={profile.photos || []}
  onReorder={async (newOrder) => {
    // Update local state immediately
    setProfile(prev => prev ? { ...prev, photos: newOrder } : null);
    
    // Persist to database
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ photos: newOrder })
      .eq('id', profile.id);
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
      {/* Photo content */}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

### Photo Item Features
- `cursor-grab active:cursor-grabbing` for drag cursor
- `whileDrag` animation: scale 1.05, elevated z-index, shadow
- Grip icon on hover: `GripVertical` in top-left
- Delete button on hover: red circle in top-right
- "Main" badge on first photo (idx === 0)
- Images use `object-cover` and `pointer-events-none`

### Photo Grid Styling
- Grid: `grid grid-cols-3 gap-2`
- Each photo: `aspect-square rounded-lg overflow-hidden`
- Add button below grid: dashed border, hover effects

---

## 4. Image Display Rules

### InteractiveSelector (Profile Pages)
- **Container**: `max-w-[450px] h-[280px]` with `minWidth: 300px`
- **Wrapper**: `relative flex flex-col items-center justify-center py-4 bg-background`
- **Limit**: First 3 photos only
- **Titles**: "Featured", "In Action", "View 3"
- **Background**: `backgroundSize: 'cover'`, `backgroundPosition: 'center'`

### Photo Gallery (Manage Photos Section)
- Grid: `grid grid-cols-3 gap-2`
- Photos: `aspect-square rounded-lg overflow-hidden`
- Images: `w-full h-full object-cover`

### Card Thumbnails (AppView, Wishlists)
- Container: `aspect-square` with `w-36` width
- Images: `object-cover` to fill uniformly
- Fallback: gradient placeholder with Store icon

---

## 5. Price Tiers System

### Database Field
- Column: `price_tiers` (JSONB, default `[]::jsonb`)
- Format: `[{ "name": "Breakfast", "price": 75 }, { "name": "Dinner", "price": 150 }]`

### Vendor Preview Display
```typescript
{profile.price_tiers && profile.price_tiers.length > 0 ? (
  <Card className="p-4">
    <div className="space-y-3">
      <p className="text-sm font-medium">Pricing Options</p>
      <div className="space-y-2">
        {profile.price_tiers.map((tier, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-sm">{tier.name}</span>
            <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
              ${tier.price}/person
            </Badge>
          </div>
        ))}
      </div>
    </div>
  </Card>
) : (
  // Fallback: Quick Info Card with duration, max guests, price
)}
```

### Guest Experience (VendorPublicProfile)
- Dropdown selector to choose tier
- Live quote updates below dropdown
- Bottom CTA shows selected tier name and price

---

## 6. Affiliate Commission System

### Display (Vendor Preview)
```typescript
<Card className="p-4 border-amber-500/50 bg-amber-500/5">
  <div className="flex items-center justify-between">
    <div className="space-y-1">
      <p className="text-sm font-medium flex items-center gap-2">
        💰 Affiliate Commission
      </p>
      <p className="text-xs text-muted-foreground">
        Visible to hosts & vendors only
      </p>
    </div>
    <div className="text-right">
      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
        {profile.commission_percentage ? `${profile.commission_percentage}%` : 'Not set'}
      </p>
    </div>
  </div>
</Card>
```

### Visibility Rules

Commission information is shown **only** when **all** of the following are true:

1. User is **authenticated**
2. User role is `host`
3. URL contains `?mode=host` query parameter

| Context | `?mode=host` | Authenticated Host | Can See Commission? |
|---------|--------------|-------------------|---------------------|
| Explore page (host mode) | ✅ | ✅ | ✅ Yes |
| Vendor profile from Host Dashboard | ✅ | ✅ | ✅ Yes |
| Splash → Explore → Vendor profile | ❌ | ❌ | ❌ No |
| Logged-in host browsing AppView | ❌ | ✅ | ❌ No |
| Vendor viewing their own preview | N/A | ✅ Vendor | ✅ Yes (own preview page) |

### Implementation (VendorPublicProfile.tsx)
```typescript
const [searchParams] = useSearchParams();
const { role, isAuthenticated } = useAuthContext();

// Commission is host-only AND only when explicitly in host context.
const isHostContext = searchParams.get('mode') === 'host';
const canSeeCommission = isAuthenticated && role === 'host' && isHostContext;
```

### Host-Context Links
When navigating from host areas, append `?mode=host` to preserve context:
- **Explore page** (`/explore?mode=host`): Vendor card links include `?mode=host`
- **Host Dashboard**: Partner Commissions cards navigate to `/vendor/:id?mode=host`

---

## 7. Loading & Empty States

### Loading State
```typescript
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
```

### No Profile State
```typescript
<div className="min-h-screen bg-background flex items-center justify-center pb-24">
  <div className="text-center space-y-4">
    <p className="text-muted-foreground">No profile found</p>
    <Button onClick={() => navigate('/vendor/create-profile')}>
      Create Profile
    </Button>
  </div>
  <VendorBottomNav />
</div>
```

---

## 8. Vendor Profile Database Schema

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Business name |
| `category` | text | e.g., "Private Chef", "Massage & Spa" |
| `listing_type` | text | `'experience'` or `'restaurant'` |
| `is_published` | boolean | Must be `true` to appear publicly |
| `user_id` | uuid | Owner's auth user ID |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `description` | text | Brief tagline/summary |
| `about_experience` | text | Detailed description (AI-generated option) |
| `photos` | text[] | Array of image URLs (first 3 displayed in selector) |
| `price_per_person` | numeric | Starting price (auto-calculated from price_tiers) |
| `price_tiers` | jsonb | Array of pricing options `[{ "name": "Breakfast", "price": 75 }]` |
| `duration` | text | e.g., "3 hours" |
| `max_guests` | integer | Maximum group size |
| `included_items` | text[] | Array of included items |
| `google_rating` | numeric | 1-5 star rating |
| `instagram_url` | text | Full Instagram profile URL |
| `menu_url` | text | Full menu/service list URL |
| `google_reviews_url` | text | Google reviews link |
| `commission_percentage` | numeric | Affiliate commission % (0-100) |

---

## 9. Storage Bucket

### Configuration
- Bucket name: `vendor-photos`
- Public: Yes (for direct URL access)
- File path format: `{user_id}/{timestamp}-{random}.{extension}`

### Upload Flow
1. Select files via hidden `<input type="file" multiple>`
2. For each file, generate unique filename
3. Upload to `supabase.storage.from('vendor-photos').upload()`
4. Get public URL via `getPublicUrl()`
5. Append URLs to profile's photos array
6. Update database

---

## 10. Where Vendors Appear

1. **Explore Page Host Mode** (`/explore?mode=host`)
   - Published vendors appear above mock experiences in a dedicated section
   - **Vendor Card Features (Host Mode)**:
     - **Gradient Add Button** (top-left): Orange-to-pink gradient button with Plus icon
       - Style: `bg-gradient-to-r from-orange-500 to-pink-500 text-white`
       - Hover: `hover:from-orange-600 hover:to-pink-600`
       - Adds vendor to host's guest guide recommendations
       - When added: Shows green background with check icon
     - **Commission Badge** (top-right): Displays vendor's affiliate commission percentage
       - Style: `bg-black/80 backdrop-blur-sm text-white` with `text-orange-400` percentage
       - Shows `% icon` and commission amount (e.g., "15%")
       - Only visible when `isHostMode` is true

2. **AppView Explore Tab** (`/appview`)
   - `listing_type: 'restaurant'` → "Restaurants Near You" section
   - `listing_type: 'experience'` → "Popular Experiences" section

3. **AppView My Wishlists Section** (`/appview`)
   - Shows favorited vendors alongside favorited experiences
   - Combined count displays "X saved"
   - Vendor favorites stored in `localStorage` key: `vendorFavorites`
   - Links to `/vendor/:id` for full profile view

4. **Wishlists Page** (`/wishlists`)
   - Services tab shows all favorited vendors (fetched from Supabase by IDs in localStorage)
   - Grid layout with remove button on each card

5. **Host Dashboard** (`/host/dashboard`)
   - "Partner Commissions" section (if `commission_percentage` is set)

6. **Direct Link**
   - `/vendor/:id` → Full public profile

---

## 11. Vendor Favorites System

### How Favorites Work
1. User clicks heart icon on vendor card in AppView
2. Vendor ID is added to `vendorFavorites` array in localStorage
3. Toast notification confirms "Added to favorites"
4. Vendor appears in:
   - "My Wishlists" section on AppView (immediate)
   - "Services" tab on Wishlists page (on navigation)

### localStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `vendorFavorites` | `string[]` | Array of vendor profile UUIDs |
| `restaurantFavorites` | `string[]` | Array of restaurant IDs |
| `favorites` | `number[]` | Array of experience IDs (mock data) |

### Favoriting Flow (AppView)
```typescript
const toggleVendorFavorite = (id: string, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setVendorFavorites((prev) => {
    const newFavorites = prev.includes(id)
      ? prev.filter((fav) => fav !== id)
      : [...prev, id];
    
    localStorage.setItem("vendorFavorites", JSON.stringify(newFavorites));
    
    toast({
      title: prev.includes(id) ? "Removed from favorites" : "Added to favorites",
      duration: 2000,
    });
    
    return newFavorites;
  });
};
```

### Loading Favorites (Wishlists Page)
```typescript
const loadFavoriteVendors = async () => {
  const favoriteIds = JSON.parse(localStorage.getItem("vendorFavorites") || "[]");
  if (favoriteIds.length === 0) {
    setFavoriteVendors([]);
    return;
  }

  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('id, name, category, description, photos, price_per_person, google_rating')
    .in('id', favoriteIds);

  if (!error) setFavoriteVendors(data || []);
};
```

---

## 12. Quick Checklist for New Vendors

### Profile Setup
- [ ] Photos uploaded (at least 1, ideally 3)
- [ ] Photos reordered as desired (drag & drop)
- [ ] `listing_type` correctly set (restaurant vs experience)
- [ ] `category` matches predefined list
- [ ] `price_per_person` OR `price_tiers` set
- [ ] `duration` specified
- [ ] `max_guests` defined

### Affiliate Program (Optional)
- [ ] `commission_percentage` set (if offering affiliate program)

### Publishing
- [ ] Preview checked at `/vendor/preview`
- [ ] Profile published (is_published = true)
- [ ] Appears correctly in AppView under correct section
- [ ] Commission visible in Host Dashboard (if set)

### Testing
- [ ] Heart/favorite button works
- [ ] Favorited vendor appears in "My Wishlists" section on AppView
- [ ] Favorited vendor appears in Wishlists page Services tab
- [ ] Book Now button navigates correctly
- [ ] All links (Instagram, Menu, Google Reviews) open properly
- [ ] Photo drag-and-drop reordering works
- [ ] Photo upload and delete work
