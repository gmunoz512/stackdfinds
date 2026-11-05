import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, Waves, Map, Heart, Clock, Users } from "lucide-react";
import { GoogleRating } from "@/components/GoogleRating";
import { Link } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

const categories = [
  { icon: Bike, label: "Rentals", emoji: "🚴" },
  { icon: Waves, label: "Water Sports", emoji: "🌊" },
  { icon: Map, label: "Tours", emoji: "🗺" },
  { icon: Heart, label: "Wellness", emoji: "💆" },
];

const experiences = [
  {
    id: "sunset-kayak",
    title: "Sunset Kayak Tour",
    vendor: "Ocean Adventures",
    duration: "2 hours",
    maxGuests: 6,
    rating: 4.9,
    price: 80,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
  },
  {
    id: "beach-bike",
    title: "Beach Bike Rental",
    vendor: "Coastal Bikes",
    duration: "Full day",
    maxGuests: 4,
    rating: 4.8,
    price: 45,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
  },
  {
    id: "snorkeling",
    title: "Snorkeling Adventure",
    vendor: "Ocean Adventures",
    duration: "3 hours",
    maxGuests: 8,
    rating: 5.0,
    price: 95,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
  },
  {
    id: "couples-massage",
    title: "Couples Beach Massage",
    vendor: "Relax Spa Team",
    duration: "90 min",
    maxGuests: 2,
    rating: 4.9,
    price: 180,
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
  },
];

const Storefront = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={stackdLogo} alt="stackd logo" className="h-8 w-8 drop-shadow-lg" />
              <span className="text-xl font-bold font-display bg-gradient-to-r from-brand via-hot to-iris-strong bg-clip-text text-transparent">
                stackd
              </span>
            </Link>
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Storefront Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Beach House Paradise</h1>
          <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
            <h2 className="text-xl font-semibold mb-2 text-primary">
              Curated experiences by your host John
            </h2>
            <p className="text-muted-foreground">
              Welcome! I've personally selected these amazing local vendors to make your stay unforgettable. 
              Book with confidence - I only recommend the best!
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card
                key={category.label}
                className="p-6 text-center hover:shadow-lg transition-all cursor-pointer group hover:border-primary"
              >
                <div className="text-4xl mb-2">{category.emoji}</div>
                <p className="font-medium group-hover:text-primary transition-colors">
                  {category.label}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Experiences */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Featured Experiences</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((experience) => (
              <Link key={experience.id} to={`/experience/${experience.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all group">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={experience.image}
                      alt={experience.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-3 right-3 bg-background/90 text-foreground border-0">
                      <GoogleRating value={null} showCount={false} starClassName="h-3 w-3" />
                    </Badge>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {experience.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{experience.vendor}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {experience.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Max {experience.maxGuests}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <span className="text-sm text-muted-foreground">From</span>
                        <p className="text-xl font-bold text-primary">
                          ${experience.price}
                          <span className="text-sm font-normal text-muted-foreground">/person</span>
                        </p>
                      </div>
                      <Button size="sm">Book Now</Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Storefront;
