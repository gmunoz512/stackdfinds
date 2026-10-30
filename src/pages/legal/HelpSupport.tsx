import { Card } from "@/components/ui/card";
import { ArrowLeft, Mail, MessageCircle, Book } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";

const HelpSupport = () => {
  const goBack = useSmartBack("/host/profile");

  const helpOptions = [
    {
      icon: Book,
      title: "Help Center",
      description: "Browse our guides and FAQs",
      action: "#"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "#"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@stackd.com",
      action: "mailto:support@stackd.com"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-sm text-muted-foreground">We're here to help you</p>
        </div>

        <div className="space-y-3">
          {helpOptions.map((option) => (
            <Card key={option.title} className="p-5">
              <a
                href={option.action}
                className="flex items-start gap-4 hover:opacity-80 transition-opacity"
              >
                <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </a>
            </Card>
          ))}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HelpSupport;
