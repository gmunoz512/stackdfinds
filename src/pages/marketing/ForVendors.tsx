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
    { num: "01", title: "Create your profile", desc: "Showcase your business with photos, pricing, and the details travelers need." },
    { num: "02", title: "Choose your commission", desc: "Set a rate that works for your business while giving hosts a reason to recommend you." },
    { num: "03", title: "Get added to guidebooks", desc: "Hosts can discover your profile and add your business to their personal guest recommendations." },
    { num: "04", title: "Receive bookings", desc: "Travelers purchase through the marketplace and you keep more of each booking."
    }
  ];

  const businessTypes = [
    "Restaurants", "Tour Guides", "Adventure Sports", "Spa & Wellness",
    "Photography", "Cooking Classes", "Wine Tours", "Water Sports",
    "Hiking Tours", "Art Workshops", "Nightlife", "Transportation"
  ];

  return (
    <PartnerPage
      audience="For vendors"
      title="Reach more travelers without giving away your margin."
      description="stackd was built with short-term rental hosts in mind. That means we understand the value of every booking and are designing a lower-commission marketplace for local vendors."
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
