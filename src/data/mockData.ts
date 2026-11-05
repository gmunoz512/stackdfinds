// Experience images
import kayaking from '@/assets/experiences/kayaking.jpg';
import kayaking2 from '@/assets/experiences/kayaking-2.jpg';
import kayaking3 from '@/assets/experiences/kayaking-3.jpg';
import bikes from '@/assets/experiences/bikes.jpg';
import snorkeling from '@/assets/experiences/snorkeling.jpg';
import snorkeling2 from '@/assets/experiences/snorkeling-2.jpg';
import snorkeling3 from '@/assets/experiences/snorkeling-3.jpg';
import photography from '@/assets/experiences/photography.jpg';
import spa from '@/assets/experiences/spa.jpg';
import wine from '@/assets/experiences/wine.jpg';
import atv from '@/assets/experiences/atv.jpg';
import boat from '@/assets/experiences/boat.jpg';
import zipline from '@/assets/experiences/zipline.jpg';
import horseback from '@/assets/experiences/horseback.jpg';
import scuba from '@/assets/experiences/scuba.jpg';
import scuba2 from '@/assets/experiences/scuba-2.jpg';
import scuba3 from '@/assets/experiences/scuba-3.jpg';
import hiking from '@/assets/experiences/hiking.jpg';
import hiking2 from '@/assets/experiences/hiking-2.jpg';
import hiking3 from '@/assets/experiences/hiking-3.jpg';
import parasailing from '@/assets/experiences/parasailing.jpg';
import parasailing2 from '@/assets/experiences/parasailing-2.jpg';
import parasailing3 from '@/assets/experiences/parasailing-3.jpg';
import yoga from '@/assets/experiences/yoga.jpg';
import fishing from '@/assets/experiences/fishing.jpg';
import cooking from '@/assets/experiences/cooking.jpg';
import balloon from '@/assets/experiences/balloon.jpg';
import balloon2 from '@/assets/experiences/balloon-2.jpg';
import balloon3 from '@/assets/experiences/balloon-3.jpg';
import dining from '@/assets/experiences/dining.jpg';

export const dashboardStats = [
  { 
    label: "Total Earnings", 
    value: "$847", 
    icon: "DollarSign", 
    color: "text-primary" 
  },
  { 
    label: "Bookings", 
    value: "23", 
    icon: "Calendar", 
    color: "text-secondary" 
  },
  { 
    label: "Active Vendors", 
    value: "8", 
    icon: "Users", 
    color: "text-primary" 
  },
  { 
    label: "Avg Rating", 
    value: "4.8★", 
    icon: "Star", 
    color: "text-secondary" 
  },
];

export const vendorDashboardStats = [
  { 
    label: "Total Revenue", 
    value: "$3,240", 
    icon: "DollarSign", 
    color: "text-primary" 
  },
  { 
    label: "Bookings", 
    value: "47", 
    icon: "Calendar", 
    color: "text-secondary" 
  },
  { 
    label: "Active Hosts", 
    value: "12", 
    icon: "Users", 
    color: "text-primary" 
  },
  { 
    label: "Rating", 
    value: "4.9★", 
    icon: "Star", 
    color: "text-secondary" 
  },
];

export const recentBookings = [
  { 
    service: "Snorkeling Adventure", 
    vendor: "Ocean Adventures", 
    date: "Aug 15, 2024", 
    amount: "$95" 
  },
  { 
    service: "Food & Wine Tour", 
    vendor: "Local Food Tours", 
    date: "Aug 14, 2024", 
    amount: "$120" 
  },
  { 
    service: "Parasailing Adventure", 
    vendor: "Sky High Watersports", 
    date: "Aug 12, 2024", 
    amount: "$140" 
  },
  { 
    service: "ATV Jungle Adventure", 
    vendor: "Adventure Seekers", 
    date: "Aug 10, 2024", 
    amount: "$135" 
  },
];

export const upcomingBookings = [
  { 
    service: "Snorkeling Adventure",
    date: "Aug 18 2024",
    time: "10:00 AM",
    guest: "Sarah Johnson",
    host: "Beach House Paradise"
  },
  { 
    service: "Mountain Hiking Expedition",
    date: "Aug 19 2024",
    time: "8:00 AM",
    guest: "Mike Chen",
    host: "Sunset Villa"
  },
  { 
    service: "Hot Air Balloon Ride",
    date: "Aug 20 2024",
    time: "6:00 AM",
    guest: "Emma Davis",
    host: "Ocean View Resort"
  },
];

export const vendorServices = [
  {
    id: 1,
    name: "Snorkeling Adventure",
    duration: "3 hours",
    capacity: "Max 8 people",
    price: "$95.00",
    description: "Explore vibrant coral reefs and marine life"
  },
  {
    id: 2,
    name: "Food & Wine Tour",
    duration: "4 hours",
    capacity: "Max 10 people",
    price: "$120.00",
    description: "Taste the best local cuisine and wines"
  },
  {
    id: 3,
    name: "Parasailing Adventure",
    duration: "1.5 hours",
    capacity: "Max 3 people",
    price: "$140.00",
    description: "Soar 400 feet above the ocean for breathtaking views"
  },
];

export const vendors = [
  {
    id: 1,
    name: "Ocean Adventures",
    description: "Kayaking, paddleboarding, and boat tours",
    commission: "20%",
    category: "Water Sports",
    email: "info@oceanadventures.com",
    phone: "(555) 111-2222"
  },
  {
    id: 2,
    name: "Beach Bike Rentals",
    description: "Premium bike rentals and guided tours",
    commission: "15%",
    category: "Transportation",
    email: "rentals@beachbikes.com",
    phone: "(555) 222-3333"
  },
  {
    id: 3,
    name: "Sunset Sailing Co",
    description: "Private sailing experiences at sunset",
    commission: "25%",
    category: "Water Sports",
    email: "sail@sunsetsailing.com",
    phone: "(555) 333-4444"
  },
  {
    id: 4,
    name: "Local Food Tours",
    description: "Curated culinary experiences",
    commission: "18%",
    category: "Food & Dining",
    email: "tours@localfood.com",
    phone: "(555) 444-5555"
  },
  {
    id: 5,
    name: "Spa by the Sea",
    description: "Relaxation and wellness treatments",
    commission: "22%",
    category: "Wellness",
    email: "relax@spabythesea.com",
    phone: "(555) 555-6666"
  },
  {
    id: 6,
    name: "Island Photography",
    description: "Professional vacation photoshoots",
    commission: "20%",
    category: "Photography",
    email: "photos@islandphoto.com",
    phone: "(555) 666-7777"
  },
  {
    id: 7,
    name: "Surf School Pro",
    description: "Surf lessons for all skill levels",
    commission: "17%",
    category: "Water Sports",
    email: "learn@surfschoolpro.com",
    phone: "(555) 777-8888"
  },
  {
    id: 8,
    name: "Private Chef Services",
    description: "In-home dining experiences",
    commission: "15%",
    category: "Food & Dining",
    email: "chef@privatechef.com",
    phone: "(555) 888-9999"
  },
];

export const categories = [
  "Water Sports",
  "Transportation",
  "Food & Dining",
  "Wellness",
  "Photography",
  "Entertainment",
  "Tours & Activities"
];

export interface Experience {
  id: number;
  name: string;
  vendor: string;
  vendorId: number;
  category: string;
  categoryIcon: string;
  price: number;
  duration: string;
  maxGuests: number;
  rating: number;
  reviewCount: number;
  description: string;
  included: string[];
  images: string[];
}

export const experiences: Experience[] = [
  {
    id: 3,
    name: "Snorkeling Adventure",
    vendor: "Ocean Adventures",
    vendorId: 1,
    category: "Water Sports",
    categoryIcon: "🌊",
    price: 95,
    duration: "3 hours",
    maxGuests: 8,
    rating: 5.0,
    reviewCount: 156,
    description: "Discover vibrant coral reefs and tropical fish in crystal-clear waters. Our expert guides ensure a safe and unforgettable underwater adventure.",
    included: [
      "All snorkeling equipment",
      "Wetsuit if needed",
      "Underwater camera rental",
      "Light refreshments",
      "Marine life guide"
    ],
    images: [snorkeling, snorkeling2, snorkeling3]
  },
  {
    id: 6,
    name: "Food & Wine Tour",
    vendor: "Local Food Tours",
    vendorId: 4,
    category: "Food & Dining",
    categoryIcon: "🍷",
    price: 120,
    duration: "4 hours",
    maxGuests: 10,
    rating: 4.8,
    reviewCount: 143,
    description: "Taste the best local cuisine and wines while exploring the charming downtown area with our expert food guide.",
    included: [
      "5 food stops",
      "3 wine tastings",
      "Local guide",
      "Historical walking tour",
      "Recipe cards"
    ],
    images: [wine, cooking, dining]
  },
  {
    id: 7,
    name: "ATV Jungle Adventure",
    vendor: "Adventure Seekers",
    vendorId: 9,
    category: "Tours & Activities",
    categoryIcon: "🏍️",
    price: 135,
    duration: "3 hours",
    maxGuests: 8,
    rating: 4.9,
    reviewCount: 178,
    description: "Ride through lush jungle trails on powerful ATVs. Experience muddy tracks, river crossings, and breathtaking mountain views.",
    included: [
      "ATV and safety gear",
      "Professional guide",
      "Safety briefing",
      "Refreshments and snacks",
      "Action photos"
    ],
    images: [atv, hiking, hiking2]
  },
  {
    id: 8,
    name: "Private Boat Rental",
    vendor: "Marina Bay Charters",
    vendorId: 10,
    category: "Water Sports",
    categoryIcon: "🚤",
    price: 250,
    duration: "4 hours",
    maxGuests: 10,
    rating: 5.0,
    reviewCount: 92,
    description: "Charter your own private boat for island hopping, fishing, or coastal exploration. Captain and fuel included.",
    included: [
      "Private boat with captain",
      "Fuel and equipment",
      "Snorkeling gear",
      "Cooler with ice",
      "Bluetooth sound system"
    ],
    images: [boat, kayaking, fishing]
  },
  {
    id: 9,
    name: "Jungle Zip Line & Canopy Tour",
    vendor: "Canopy Adventures",
    vendorId: 11,
    category: "Tours & Activities",
    categoryIcon: "🌳",
    price: 110,
    duration: "2.5 hours",
    maxGuests: 12,
    rating: 4.9,
    reviewCount: 234,
    description: "Soar through the jungle canopy on 8 zip lines with platforms offering stunning forest views. Perfect for thrill-seekers!",
    included: [
      "8 zip line courses",
      "All safety equipment",
      "Professional guides",
      "Jungle nature walk",
      "Photo opportunities"
    ],
    images: [zipline, hiking3, atv]
  },
  {
    id: 10,
    name: "Horseback Riding on Beach",
    vendor: "Coastal Stables",
    vendorId: 12,
    category: "Tours & Activities",
    categoryIcon: "🐴",
    price: 90,
    duration: "2 hours",
    maxGuests: 6,
    rating: 4.7,
    reviewCount: 145,
    description: "Experience the magic of riding gentle horses along pristine beaches at sunset. Perfect for all experience levels.",
    included: [
      "Well-trained horses",
      "Riding helmets",
      "Professional instructor",
      "Beach sunset views",
      "Photo session"
    ],
    images: [horseback, hiking, balloon2]
  },
  {
    id: 11,
    name: "Scuba Diving Certification",
    vendor: "Deep Blue Dive School",
    vendorId: 13,
    category: "Water Sports",
    categoryIcon: "🤿",
    price: 450,
    duration: "2 days",
    maxGuests: 4,
    rating: 5.0,
    reviewCount: 88,
    description: "Get PADI certified with our expert instructors. Includes classroom, pool training, and 4 open water dives.",
    included: [
      "PADI certification",
      "All diving equipment",
      "Digital learning materials",
      "4 open water dives",
      "Certification card"
    ],
    images: [scuba, scuba2, scuba3]
  },
  {
    id: 12,
    name: "Mountain Hiking Expedition",
    vendor: "Peak Adventures",
    vendorId: 14,
    category: "Tours & Activities",
    categoryIcon: "⛰️",
    price: 85,
    duration: "5 hours",
    maxGuests: 10,
    rating: 4.8,
    reviewCount: 167,
    description: "Hike to stunning viewpoints with panoramic ocean and mountain views. Includes lunch at a scenic overlook.",
    included: [
      "Experienced hiking guide",
      "Hiking poles if needed",
      "Packed lunch",
      "Water and snacks",
      "First aid support"
    ],
    images: [hiking, hiking2, hiking3]
  },
  {
    id: 13,
    name: "Parasailing Adventure",
    vendor: "Sky High Watersports",
    vendorId: 15,
    category: "Water Sports",
    categoryIcon: "🪂",
    price: 140,
    duration: "1.5 hours",
    maxGuests: 3,
    rating: 5.0,
    reviewCount: 215,
    description: "Soar 400 feet above the ocean for breathtaking aerial views. Safe, thrilling, and unforgettable experience.",
    included: [
      "Parasailing flight",
      "All safety equipment",
      "Boat ride to launch point",
      "GoPro footage available",
      "Experienced crew"
    ],
    images: [parasailing, parasailing2, parasailing3]
  },
  {
    id: 14,
    name: "Sunset Yoga on Beach",
    vendor: "Zen Wellness Studio",
    vendorId: 16,
    category: "Wellness",
    categoryIcon: "🧘",
    price: 35,
    duration: "1 hour",
    maxGuests: 15,
    rating: 4.9,
    reviewCount: 189,
    description: "Find your inner peace with gentle yoga flows as the sun sets over the ocean. All levels welcome.",
    included: [
      "Yoga mat provided",
      "Guided meditation",
      "Herbal tea after class",
      "Beachfront location",
      "Certified instructor"
    ],
    images: [yoga, spa, hiking]
  },
  {
    id: 15,
    name: "Deep Sea Fishing Charter",
    vendor: "Captain's Catch Charters",
    vendorId: 17,
    category: "Water Sports",
    categoryIcon: "🎣",
    price: 320,
    duration: "6 hours",
    maxGuests: 6,
    rating: 4.8,
    reviewCount: 132,
    description: "Fish for marlin, tuna, and mahi-mahi with experienced captain. All equipment and fishing licenses included.",
    included: [
      "Professional fishing gear",
      "Fishing licenses",
      "Bait and tackle",
      "Cooler for your catch",
      "Fish cleaning service"
    ],
    images: [fishing, boat, kayaking2]
  },
  {
    id: 16,
    name: "Cooking Class - Local Cuisine",
    vendor: "Culinary Culture",
    vendorId: 18,
    category: "Food & Dining",
    categoryIcon: "👨‍🍳",
    price: 95,
    duration: "3 hours",
    maxGuests: 12,
    rating: 4.9,
    reviewCount: 156,
    description: "Learn to cook authentic local dishes with a professional chef. Enjoy your creations with wine pairings.",
    included: [
      "Hands-on cooking",
      "All ingredients provided",
      "Wine pairings",
      "Recipe booklet",
      "Eat what you cook"
    ],
    images: [cooking, wine, dining]
  },
  {
    id: 17,
    name: "Hot Air Balloon Ride",
    vendor: "Skyview Balloons",
    vendorId: 19,
    category: "Tours & Activities",
    categoryIcon: "🎈",
    price: 280,
    duration: "3 hours",
    maxGuests: 8,
    rating: 5.0,
    reviewCount: 198,
    description: "Float peacefully over stunning landscapes at sunrise. Includes champagne toast and breakfast after landing.",
    included: [
      "1-hour balloon flight",
      "Champagne celebration",
      "Gourmet breakfast",
      "Flight certificate",
      "Hotel pickup included"
    ],
    images: [balloon, balloon2, balloon3]
  },
  {
    id: 18,
    name: "Wine Tasting Tour",
    vendor: "Vineyard Ventures",
    vendorId: 20,
    category: "Food & Dining",
    categoryIcon: "🍇",
    price: 110,
    duration: "4 hours",
    maxGuests: 14,
    rating: 4.7,
    reviewCount: 176,
    description: "Visit 3 boutique wineries with tastings, vineyard tours, and cheese pairings. Transportation included.",
    included: [
      "Visit 3 wineries",
      "10+ wine tastings",
      "Cheese pairings",
      "Vineyard tours",
      "Round-trip transport"
    ],
    images: [wine, cooking, dining]
  }
];

export const activeHosts = [
  {
    id: 1,
    name: "Sarah Martinez",
    propertyName: "Beach House Paradise",
    email: "sarah@beachhouse.com",
    phone: "(555) 123-4567"
  },
  {
    id: 2,
    name: "John Davis",
    propertyName: "Sunset Villa",
    email: "john@sunsetvilla.com",
    phone: "(555) 234-5678"
  },
  {
    id: 3,
    name: "Emily Chen",
    propertyName: "Ocean View Resort",
    email: "emily@oceanview.com",
    phone: "(555) 345-6789"
  },
  {
    id: 4,
    name: "Michael Brown",
    propertyName: "Coastal Retreat",
    email: "michael@coastalretreat.com",
    phone: "(555) 456-7890"
  },
  {
    id: 5,
    name: "Amanda Wilson",
    propertyName: "Seabreeze Cottage",
    email: "amanda@seabreeze.com",
    phone: "(555) 567-8901"
  },
  {
    id: 6,
    name: "David Thompson",
    propertyName: "Palm Paradise",
    email: "david@palmparadise.com",
    phone: "(555) 678-9012"
  },
  {
    id: 7,
    name: "Lisa Garcia",
    propertyName: "Tropical Escape",
    email: "lisa@tropicalescape.com",
    phone: "(555) 789-0123"
  },
  {
    id: 8,
    name: "Robert Anderson",
    propertyName: "Marina Bay House",
    email: "robert@marinabay.com",
    phone: "(555) 890-1234"
  },
  {
    id: 9,
    name: "Jennifer Lee",
    propertyName: "Sandcastle Villa",
    email: "jennifer@sandcastle.com",
    phone: "(555) 901-2345"
  },
  {
    id: 10,
    name: "Chris Taylor",
    propertyName: "Island Oasis",
    email: "chris@islandoasis.com",
    phone: "(555) 012-3456"
  },
  {
    id: 11,
    name: "Michelle White",
    propertyName: "Coral Cove Resort",
    email: "michelle@coralcove.com",
    phone: "(555) 123-4568"
  },
  {
    id: 12,
    name: "James Rodriguez",
    propertyName: "Shoreline Suites",
    email: "james@shoreline.com",
    phone: "(555) 234-5679"
  }
];

export const revenueBreakdown = [
  {
    id: 1,
    service: "Sunset Kayak Tour",
    bookings: 18,
    amount: 1440
  },
  {
    id: 2,
    service: "Snorkeling Adventure",
    bookings: 12,
    amount: 1140
  },
  {
    id: 3,
    service: "Beach Photography Session",
    bookings: 5,
    amount: 750
  },
  {
    id: 4,
    service: "Private Sailing Charter",
    bookings: 3,
    amount: 900
  },
  {
    id: 5,
    service: "Surf Lessons",
    bookings: 8,
    amount: 640
  },
  {
    id: 6,
    service: "Stand-Up Paddleboard",
    bookings: 6,
    amount: 360
  }
];
