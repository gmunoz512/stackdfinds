import { Store, Users, DollarSign, BarChart3, Calendar, Shield } from "lucide-react";
import { PartnerPage } from "./PartnerPage";

export default function ForHosts() {
  const features = [
    {
      icon: Users,
      title: "Build your personal guidebook",
      description: "Choose the local restaurants, experiences, and services you genuinely want your guests to discover."
    },
    {
      icon: DollarSign,
      title: "Earn from recommendations",
      description: "Turn the recommendations you already make into a formal affiliation with commission tracking built in."
    },
    {
      icon: BarChart3,
      title: "A gap hosts have always felt",
      description: "Nearly every host recommends local vendors, but most have never had a simple, organized way to benefit from those referrals."
    },
    {
      icon: Calendar,
      title: "Simple guest sharing",
      description: "Share one guidebook with guests so they can browse and purchase from the vendors you trust."
    },
    {
      icon: Shield,
      title: "Trusted local partners",
      description: "Add vendors that fit your standards and your guests’ needs."
    },
    {
      icon: Store,
      title: "Your brand, your recommendations",
      description: "Create a guidebook that feels personal to your property instead of sending guests to a generic marketplace."
    }
  ];

  const steps = [
    { num: "01", title: "Create your host profile", desc: "Set up your property and tell guests what kind of stay you provide." },
    { num: "02", title: "Choose your vendors", desc: "Browse the marketplace and add trusted local partners to your personal guidebook." },
    { num: "03", title: "Share it with guests", desc: "Give guests one place to discover and purchase from the vendors you recommend." },
    { num: "04", title: "Earn from the connection", desc: "Track your referrals and receive your commission in your preferred payout currency." }
  ];

  return (
    <PartnerPage
      audience="For hosts"
      title="Your local recommendations can work harder for you."
      description="We saw the gap: nearly every host recommends local vendors, but there has never been a simple, formal affiliation program built around that relationship."
      signup="/signup/host"
      featuresTitle="Turn your trusted recommendations into a guidebook"
      ctaTitle="Ready to get started?"
      ctaDescription="Create a guidebook your guests will actually use — and earn when they purchase through it."
      ctaLabel="Create your host account"
      features={features}
      steps={steps}
    />
  );
}
