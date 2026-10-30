import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2 } from "lucide-react";
import { GoogleRating } from "@/components/GoogleRating";
import { Link, useParams } from "react-router-dom";
import { experiences } from "@/data/mockData";

const categories = [
  { name: "Water Sports", icon: "🌊", count: 3 },
  { name: "Rentals", icon: "🚴", count: 1 },
  { name: "Tours", icon: "🗺", count: 1 },
  { name: "Wellness", icon: "💆", count: 1 },
];

const HostStorefront = () => {
  const { hostId } = useParams();
  
  // In a real app, this would fetch host data based on hostId
  const hostName = "John Doe";
  const propertyName = "Beach House Paradise";

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand to-hot text-paper p-6 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{propertyName}</h1>
            <p className="text-paper/90">Hosted by {hostName}</p>
          </div>
          <p className="text-sm text-paper/80 leading-relaxed">
            Welcome! I've personally selected these amazing local vendors to make your stay unforgettable.
          </p>
          <Button variant="outline" size="sm" className="bg-paper/10 border-paper/20 text-paper hover:bg-paper/20">
            <Share2 className="h-4 w-4 mr-2" />
            Share Storefront
          </Button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Categories */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Browse by Category</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Card 
                  key={category.name} 
                  className="p-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <div className="text-center space-y-2">
                    <div className="text-3xl">{category.icon}</div>
                    <div>
                      <p className="font-semibold text-sm">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count} {category.count === 1 ? 'experience' : 'experiences'}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Experiences */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Featured Experiences</h2>
            
            <div className="space-y-3">
              {experiences.slice(0, 4).map((experience) => (
                <Link key={experience.id} to={`/experience/${experience.id}`}>
                  <Card className="p-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-95">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{experience.categoryIcon}</span>
                            <h3 className="font-semibold text-base leading-tight">{experience.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{experience.vendor}</p>
                        </div>
                        <Badge variant="secondary" className="bg-gradient-to-r from-brand to-hot text-paper text-sm flex-shrink-0">
                          ${experience.price}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <GoogleRating value={null} showCount={false} starClassName="h-3 w-3" />
                        <span>•</span>
                        <span>{experience.duration}</span>
                        <span>•</span>
                        <span>Up to {experience.maxGuests}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <Card className="p-5 bg-muted/30">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Questions about any of these experiences?
              </p>
              <Button variant="gradient" className="w-full">
                Contact Host
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HostStorefront;
