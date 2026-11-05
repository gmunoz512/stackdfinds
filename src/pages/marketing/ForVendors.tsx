import { Megaphone, Users, TrendingUp, Globe, Calendar, Star } from "lucide-react";
import { PartnerPage } from "./PartnerPage";

export default function ForVendors() {
  const features = [
    {
      icon: Megaphone,
      title: "Keep more of what you earn",
      description: "Because stackd is built with short-term rental homes in mind, our marketplace is designed around some of the lowest commission rates in the market."
    },
    {
      icon: Users,
      title: "Reach trusted hosts",
      description: "Connect with short-term rental hosts who already guide their guests toward local businesses like yours."
    },
    {
      icon: TrendingUp,
      title: "Grow your bookings",
      description: "Tap into a high-intent audience of travelers who are already looking for what you offer."
    },
    {
      icon: Globe,
      title: "Be discovered by travelers",
      description: "Show up in personal guidebooks and destination collections shared with guests before and during their stay."
    },
    {
      icon: Calendar,
      title: "A simple partner channel",
      description: "Create one profile and let participating hosts share your business without building a separate referral system."
    },
    {
      icon: Star,
      title: "Build your reputation",
      description: "Collect reviews and ratings that help travelers feel confident choosing your business."
    }
  ];

  const steps = [
    { num: "01", title: "Create your business profile", desc: "Show travelers who you are with photos, pricing, and the details they need." },
    { num: "02", title: "List your experiences and services", desc: "Add what guests can book, and pause or edit listings any time." },
    { num: "03", title: "Choose the commission you offer hosts", desc: "Set the affiliate rate hosts earn when their guests book you." },
    { num: "04", title: "Receive bookings through stackd", desc: "Guests pay on stackd, you fulfill the booking, and the host earns their share." }
  ];

  const businessTypes = [
    "Restaurants", "Tour Guides", "Adventure Sports", "Spa & Wellness",
    "Photography", "Cooking Classes", "Wine Tours", "Water Sports",
    "Hiking Tours", "Art Workshops", "Nightlife", "Transportation"
  ];

  return (
    <PartnerPage
      audience="For vendors"
      title="Your business. More guests. More bookings."
      description="List your services, connect with local hosts, and turn their recommendations into paying customers."
      signup="/signup/vendor"
      featuresTitle="A better marketplace for local businesses"
      ctaTitle="Ready to grow your business?"
      ctaDescription="Join a vendor network built to connect you with travelers and hosts while helping you keep more of what you earn."
      ctaLabel="Create your vendor account"
      businessTypes={businessTypes}
      features={features}
      steps={steps}
    />
  );
}
