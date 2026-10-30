import { Link } from "react-router-dom";
import { TabsContent } from "@/components/ui/tabs";
import { User, Store, Megaphone, ChevronRight, ChevronDown, Home } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import stackdLogo from "@/assets/stackd-logo-new.png";

export function GuestServicesTab() {
  return (
    <>
          <TabsContent value="services" className="flex-1 overflow-y-auto pb-20 mt-0 lg:overflow-visible lg:pb-8">
            <div className="px-4 py-6 space-y-5 md:px-6 md:max-w-3xl md:mx-auto">
              <div className="text-center">
                <img src={stackdLogo} alt="stackd" className="h-32 w-32 mx-auto" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-paper" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold">For Customers</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Discover and book amazing local experiences with ease. From dining to adventures, find everything you need in one place.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center flex-shrink-0">
                    <Store className="h-4 w-4 text-paper" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold">For Airbnb Hosts</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Create your profile, add vendors from our directory or your own list, and share with guests so they can book through the platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center flex-shrink-0">
                    <Megaphone className="h-4 w-4 text-paper" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold">For Vendors</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
Get additional advertising and promote your affiliate programs to reach more customers through local Airbnb hosts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Partner Links Section */}
              <section className="space-y-3">
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-iris/30 transition-all cursor-pointer group">
                      <h2 className="text-sm font-display font-bold tracking-wide">Partner With Us</h2>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <Link 
                      to="/for-vendors" 
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-brand/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center flex-shrink-0">
                          <Store className="h-4 w-4 text-paper" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">For Vendors</p>
                          <p className="text-[10px] text-muted-foreground">Grow your business with stackd</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors" />
                    </Link>
                    <Link 
                      to="/for-hosts" 
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-brand/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center flex-shrink-0">
                          <Home className="h-4 w-4 text-paper" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">For Hosts</p>
                          <p className="text-[10px] text-muted-foreground">Monetize your recommendations</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-brand transition-colors" />
                    </Link>
                  </CollapsibleContent>
                </Collapsible>
              </section>

              {/* FAQ Section */}
              <section className="space-y-3">
                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-iris/30 transition-all cursor-pointer group">
                      <h2 className="text-sm font-display font-bold tracking-wide">Common Questions</h2>
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Accordion type="single" collapsible className="space-y-2">
                      <AccordionItem value="item-1" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          Do my guests pay more?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          No. Guests pay the vendor's regular price. Your commission comes from the vendor, not the guest.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          How do I get paid?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          Automatic payouts every week via Stripe. No chasing vendors for payment.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          What if I already recommend these places?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          Perfect! Now you'll get paid for recommendations you're already making for free.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          Is there a monthly fee?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          No monthly fee for hosts. stackd earns a small platform fee from vendors.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          What do vendors get?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          Advertising and exposure through trusted host recommendations — the most valuable kind of marketing.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-6" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          What do guests get?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          Convenience of booking highly recommended businesses in one place, curated by their host.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-7" className="bg-card rounded-lg border border-border px-4">
                        <AccordionTrigger className="text-left text-xs font-semibold hover:no-underline py-3">
                          I already have affiliate partnerships — can I still use stackd?
                        </AccordionTrigger>
                        <AccordionContent className="text-xs text-muted-foreground pb-3">
                          Absolutely! Keep your existing relationships and discover new ones through our platform.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CollapsibleContent>
                </Collapsible>
              </section>
            </div>
          </TabsContent>
    </>
  );
}

export function GuestAboutTab() {
  return (
    <>
          <TabsContent value="about" className="flex-1 overflow-y-auto pb-20 mt-0 lg:overflow-visible lg:pb-8">
            <div className="px-4 py-6 space-y-6 md:px-6 md:max-w-3xl md:mx-auto">
              {/* Logo and Tagline */}
              <div className="text-center space-y-2">
                <img src={stackdLogo} alt="stackd" className="h-32 w-32 mx-auto" />
                <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                  Your one-stop platform for discovering local experiences, dining, and adventures.
                </p>
              </div>

              {/* Mission */}
              <div className="space-y-1.5">
                <h3 className="font-semibold text-sm">Our Mission</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We connect travelers with unforgettable local experiences while empowering hosts and vendors to grow their businesses through meaningful partnerships.
                </p>
              </div>

              {/* What We Offer */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">What We Offer</h3>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Curated local restaurants and dining experiences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Adventure activities and tours from trusted vendors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>AI-powered trip planning assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Seamless booking and reservation management</span>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-1.5 pt-3 border-t border-border">
                <h3 className="font-semibold text-sm">Get in Touch</h3>
                <p className="text-xs text-muted-foreground">
                  Have questions or feedback? We'd love to hear from you.
                </p>
                <p className="text-xs text-primary">support@stackd.com</p>
              </div>

              {/* Version */}
              <div className="text-center pt-3">
                <p className="text-[10px] text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
          </TabsContent>
    </>
  );
}
