import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Heart, User, Search, Sparkles, Store, ChevronRight, ChevronDown, MapPin, CalendarDays, LogIn, UserPlus, Settings, LogOut, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import stackdLogo from "@/assets/stackd-logo-new.png";
import heroImage from "@/assets/hero-beach.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BlurImage } from "@/components/BlurImage";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import type { Restaurant } from "@/data/mockRestaurants";
import type { SupportedCity } from "@/lib/supportedCities";
import type { UserRole, Vendor } from "@/types";

interface GuestVendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
}

interface GuestExploreTabProps {
  role: UserRole | null;
  isAuthenticated: boolean;
  profileRoute: string;
  handleSignOut: () => void;
  cityDropdownOpen: boolean;
  setCityDropdownOpen: (open: boolean) => void;
  destination: string;
  setDestination: (destination: string) => void;
  supportedCities: SupportedCity[];
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  navigate: (path: string) => void;
  myBusinesses: Vendor[];
  isLoadingVendors: boolean;
  vendorRestaurants: GuestVendor[];
  curatedRestaurants: Restaurant[];
  googlePhotos: Record<string, string>;
  vendorFavorites: string[];
  toggleVendorFavorite: (id: string, event: React.MouseEvent) => void;
  vendorExperiences: GuestVendor[];
  favorites: number[];
}

export function GuestExploreTab({
  role, isAuthenticated, profileRoute, handleSignOut, cityDropdownOpen, setCityDropdownOpen, destination, setDestination, supportedCities, calendarOpen, setCalendarOpen, selectedDate, setSelectedDate, navigate, myBusinesses, isLoadingVendors, vendorRestaurants, curatedRestaurants, googlePhotos, vendorFavorites, toggleVendorFavorite, vendorExperiences, favorites
}: GuestExploreTabProps) {
  return (
    <>
          <TabsContent value="explore" className="flex-1 overflow-y-auto overflow-x-hidden pb-20 mt-0 lg:overflow-visible lg:pb-8">
            {/* Hero Section - Now scrollable */}
            <div className="relative">
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${heroImage})`,
                  filter: 'blur(1px)',
                }}
              />
              <div className="absolute inset-0 bg-background/70" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2">
                <ThemeToggle />
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Account menu" className="p-2 rounded-full bg-background/80 border border-border text-foreground hover:bg-accent transition-colors relative">
                      <User className="h-4 w-4" />
                      {role && (
                        <span className={cn(
                          "absolute -bottom-1 -right-1 text-[8px] font-bold px-1 rounded-full capitalize",
                          role === 'host' ? "bg-brand text-paper" :
                          role === 'vendor' ? "bg-iris text-paper" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {role === 'host' ? 'H' : role === 'vendor' ? 'V' : 'U'}
                        </span>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {isAuthenticated ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to={profileRoute} className="flex items-center gap-2 cursor-pointer">
                              <User className="h-4 w-4" />
                              Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={role === 'host' ? '/host/profile' : role === 'vendor' ? '/vendor/profile' : '/profile'} className="flex items-center gap-2 cursor-pointer">
                              <Settings className="h-4 w-4" />
                              Settings
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                              <LogIn className="h-4 w-4" />
                              Sign In
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/auth?signup=true" className="flex items-center gap-2 cursor-pointer">
                              <UserPlus className="h-4 w-4" />
                              Sign Up
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link
                    to="/trip-planner"
                    aria-label="Open trip planner"
                    className="p-2 rounded-full bg-gradient-to-r from-brand to-iris-strong text-paper"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Hero Content */}
              <div className="relative z-10 px-4 pb-4 pt-4 text-center">
                <img src={stackdLogo} alt="stackd" className="h-40 w-40 mx-auto mb-3" />
                <h1 className="text-xl font-bold text-foreground mb-1">
                  Discover Experiences
                </h1>
                <p className="text-xs text-muted-foreground mb-3">
                  Find amazing restaurants & adventures nearby
                </p>

                {/* Search Section - Single Bar */}
                <div className="relative md:max-w-2xl md:mx-auto">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/20 to-iris-strong/20 rounded-full blur-sm"></div>
                  <div className="relative bg-card/90 rounded-full border border-border/50 backdrop-blur-sm flex items-center px-3 py-2">
                    {/* Left: Location icon */}
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    
                    {/* Center: City Dropdown - takes flex space and centers */}
                    <div className="flex-1 flex items-center">
                      <Popover open={cityDropdownOpen} onOpenChange={setCityDropdownOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex-1 flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
                            <span>{destination}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-1 z-50 bg-popover" align="center">
                          <div className="space-y-0.5">
                            {supportedCities.map((city) => (
                              <button
                                key={city.id}
                                onClick={() => {
                                  setDestination(city.name);
                                  setCityDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                                  destination === city.name
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                )}
                              >
                                <span>{city.name}</span>
                                {destination === city.name && (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="h-4 w-px bg-border/50 flex-shrink-0" />
                    
                    {/* Right: Date picker */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          <span className="text-xs whitespace-nowrap">
                            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "When?"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="end">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <button
                      type="button"
                      aria-label="Search restaurants"
                      className="ml-2 bg-gradient-to-r from-brand to-iris-strong text-paper rounded-full p-1.5 flex-shrink-0"
                      onClick={() => navigate('/restaurants')}
                    >
                      <Search className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-3 py-3 space-y-5 md:px-6">

              {/* My Businesses */}
              {myBusinesses.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">My Businesses</h2>
                    <Link to="/host/vendors" className="text-xs text-primary">
                      View all
                    </Link>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:overflow-visible md:mx-0 md:px-0">
                    <div className="flex gap-3 w-max md:grid md:grid-cols-4 lg:grid-cols-6 md:w-full">
                      {myBusinesses.map((business) => (
                        <Link
                          key={business.id}
                          to="/host/vendors"
                          className="flex-shrink-0 w-28 md:w-auto md:min-w-0"
                        >
                          <div className="aspect-square bg-gradient-to-br from-brand/20 to-hot/20 rounded-xl flex items-center justify-center border border-border">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-xs font-medium mt-1 line-clamp-1">{business.name}</p>
                          <p className="text-[10px] text-muted-foreground">{business.category}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Restaurants in {destination} */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Restaurants in {destination}</h2>
                  <Link to="/restaurants" aria-label={`See all restaurants in ${destination}`} className="flex items-center text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:overflow-visible md:mx-0 md:px-0">
                  <div className="flex gap-3 w-max pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:w-full">
                    {isLoadingVendors ? (
                      // Show skeleton loading states
                      <>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex-shrink-0 w-36 md:w-auto md:min-w-0">
                            <Skeleton className="aspect-square rounded-xl" />
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Vendor restaurants from database */}
                        {vendorRestaurants.map((vendor, index) => (
                          <Link
                            key={vendor.id}
                            to={`/vendor/${vendor.id}`}
                            className="flex-shrink-0 w-36 animate-fade-in group md:w-auto md:min-w-0"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="aspect-square rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
                              {vendor.photos && vendor.photos.length > 0 ? (
                                <BlurImage
                                  src={vendor.photos[0]}
                                  alt={vendor.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand to-iris-strong flex items-center justify-center">
                                  <Store className="h-8 w-8 text-paper/80" />
                                </div>
                              )}
                              <button
                                type="button"
                                aria-label={vendorFavorites.includes(vendor.id) ? `Remove ${vendor.name} from saved` : `Save ${vendor.name}`}
                                onClick={(e) => toggleVendorFavorite(vendor.id, e)}
                                className="absolute top-2 right-2 z-10"
                              >
                                <Heart
                                  className={`h-5 w-5 drop-shadow-md ${
                                    vendorFavorites.includes(vendor.id)
                                      ? "fill-danger text-danger"
                                      : "fill-ink/40 text-paper"
                                  }`}
                                />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                                <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
                                <div className="flex items-center gap-1 text-paper/80 text-[10px]">
                                  <GoogleRating
                                    value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                                    showCount={false}
                                    className="text-[10px] text-inherit"
                                    starClassName="h-2.5 w-2.5"
                                  />
                                  <span>•</span>
                                  <span>{vendor.category}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        
                        {/* Curated restaurants for the selected city */}
                        {curatedRestaurants.map((restaurant, index) => {
                          const photo = googlePhotos[restaurant.id];

                          // Hide cards that failed to get a Google photo (empty string = no photo found)
                          if (photo === '') return null;

                          return (
                            <Link
                              key={restaurant.id}
                              to={`/restaurant/${restaurant.id}`}
                              className="flex-shrink-0 w-36 animate-fade-in group md:w-auto md:min-w-0"
                              style={{ animationDelay: `${(vendorRestaurants.length + index) * 50}ms` }}
                            >
                              <div className="aspect-square rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
                                {photo ? (
                                  <BlurImage
                                    src={photo}
                                    alt={restaurant.name}
                                    containerClassName="w-full h-full"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                ) : (
                                  <Skeleton className="w-full h-full" />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                                  <p className="text-paper text-xs font-medium line-clamp-1">{restaurant.name}</p>
                                  <div className="flex items-center gap-1 text-paper/80 text-[10px]">
                                    <GoogleRating
                                      value={resolveGoogleRating({
                                        place: { rating: restaurant.rating, reviewCount: restaurant.reviewCount, isFromApi: restaurant.isFromApi },
                                      })}
                                      showCount={false}
                                      className="text-[10px] text-inherit"
                                      starClassName="h-2.5 w-2.5"
                                    />
                                    <span>•</span>
                                    <span>{restaurant.priceRange}</span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}

                        {/* Empty state when no restaurants at all */}
                        {vendorRestaurants.length === 0 && curatedRestaurants.length === 0 && (
                          <div className="flex-shrink-0 w-full py-4 text-center md:col-span-full">
                            <p className="text-xs text-muted-foreground">No restaurants available in {destination} yet</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Popular Experiences in {destination} */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Experiences in {destination}</h2>
                  <Link to="/experiences" aria-label={`See all experiences in ${destination}`} className="flex items-center text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 md:overflow-visible md:mx-0 md:px-0">
                  <div className="flex gap-3 w-max pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:w-full">
                    {isLoadingVendors ? (
                      // Show skeleton loading states
                      <>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex-shrink-0 w-36 md:w-auto md:min-w-0">
                            <Skeleton className="aspect-square rounded-xl" />
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Vendor experiences first */}
                        {vendorExperiences.map((vendor, index) => (
                          <Link
                            key={vendor.id}
                            to={`/vendor/${vendor.id}`}
                            className="flex-shrink-0 w-36 animate-fade-in group md:w-auto md:min-w-0"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="aspect-square rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
                              {vendor.photos && vendor.photos.length > 0 ? (
                                <BlurImage
                                  src={vendor.photos[0]}
                                  alt={vendor.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand to-iris-strong flex items-center justify-center">
                                  <Store className="h-8 w-8 text-paper/80" />
                                </div>
                              )}
                              <button
                                type="button"
                                aria-label={vendorFavorites.includes(vendor.id) ? `Remove ${vendor.name} from saved` : `Save ${vendor.name}`}
                                onClick={(e) => toggleVendorFavorite(vendor.id, e)}
                                className="absolute top-2 right-2 z-10"
                              >
                                <Heart
                                  className={`h-5 w-5 drop-shadow-md ${
                                    vendorFavorites.includes(vendor.id)
                                      ? "fill-danger text-danger"
                                      : "fill-ink/40 text-paper"
                                  }`}
                                />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                                <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
                                <div className="flex items-center gap-1 text-paper/80 text-[10px]">
                                  <GoogleRating
                                    value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                                    showCount={false}
                                    className="text-[10px] text-inherit"
                                    starClassName="h-2.5 w-2.5"
                                  />
                                  {vendor.price_per_person && <><span>•</span><span>${vendor.price_per_person}</span></>}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {/* Empty state when no experiences */}
                        {vendorExperiences.length === 0 && (
                          <div className="flex-shrink-0 w-full py-4 text-center md:col-span-full">
                            <p className="text-xs text-muted-foreground">No experiences available in {destination} yet</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Wishlists Section - Shows hearted experiences and vendors */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">My Wishlists</h2>
                  {(favorites.length > 0 || vendorFavorites.length > 0) && (
                    <span className="text-xs text-muted-foreground">{favorites.length + vendorFavorites.length} saved</span>
                  )}
                </div>
                {favorites.length === 0 && vendorFavorites.length === 0 ? (
                  <div className="py-8 text-center">
                    <Heart className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">No favorites yet</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Heart experiences to save them here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Vendor favorites */}
                    {[...vendorExperiences, ...vendorRestaurants]
                      .filter(vendor => vendorFavorites.includes(vendor.id))
                      .map((vendor) => (
                        <Link key={vendor.id} to={`/vendor/${vendor.id}`} className="block group">
                          <div className="aspect-square rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
                            <BlurImage
                              src={vendor.photos?.[0] || '/placeholder.svg'}
                              alt={vendor.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <button
                              type="button"
                              aria-label={`Remove ${vendor.name} from saved`}
                              onClick={(e) => toggleVendorFavorite(vendor.id, e)}
                              className="absolute top-2 right-2 z-10"
                            >
                              <Heart className="h-4 w-4 drop-shadow-md fill-danger text-danger" />
                            </button>
                          </div>
                          <div className="mt-1.5">
                            <p className="text-xs font-medium line-clamp-1">{vendor.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{vendor.category}</p>
                            <div className="flex items-center gap-1 text-[10px]">
                              <GoogleRating
                                value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                                showCount={false}
                                className="text-[10px]"
                                starClassName="h-2.5 w-2.5"
                              />
                              <span className="text-muted-foreground">•</span>
                              <span className="font-medium">${vendor.price_per_person}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    {/* Only show vendor favorites - mock experiences removed */}
                  </div>
                )}
              </section>

              {/* Footer spacer for bottom nav */}
              <div className="h-4" />
            </div>
          </TabsContent>
    </>
  );
}
