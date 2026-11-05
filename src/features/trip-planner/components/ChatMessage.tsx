import { memo, useMemo, lazy, Suspense, useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, ItineraryItemCategory, HostVendor } from "../types";
import { applyBionicReading, extractVendorFromMessage, hasQuoteInMessage } from "../utils";
import { AddToItineraryButton, type ParsedActivity } from "./AddToItineraryButton";

const VendorLocationMap = lazy(() => 
  import("@/components/VendorLocationMap").then(m => ({ default: m.VendorLocationMap }))
);

interface ChatMessageProps {
  message: Message;
  bionicEnabled: boolean;
  hostVendors?: HostVendor[];
}

// Signals that the guest has chosen / is booking an activity
const BOOKING_INTENT = /(added to your itinerary|great choice|book|reserve|let'?s do|you'?re all set|confirmed)/i;

const BookingLink = memo(function BookingLink({ href, text }: { href: string; text: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-2 px-5 py-2.5 mt-3 mb-1 rounded-full font-medium text-sm no-underline
        bg-gradient-to-r from-iris-strong via-hot to-brand-light
        text-paper
        shadow-[0_4px_20px_rgba(168,85,247,0.4)]
        transition-all duration-300
        hover:shadow-[0_6px_30px_rgba(168,85,247,0.6)]
        hover:scale-105
        active:scale-95"
      aria-label={`Book ${text}`}
    >
      {text}
    </Link>
  );
});

const ExternalLink = memo(function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  );
});

// Parse activity blocks from AI response
function parseActivitiesFromContent(content: string): ParsedActivity[] {
  const activities: ParsedActivity[] = [];
  
  // Pattern to match activity blocks with bold titles
  // Matches: **Activity Title** or **9:00 AM - Activity Title** or **🫧 Activity Title**
  const activityBlockPattern = /\*\*(?:\d{1,2}:\d{2}\s*(?:AM|PM)?\s*[-–]?\s*)?([^*]+?)\*\*(?:\s*🫧|\s*🌊|\s*🏖️|\s*🍽️|\s*🏛️)?[^\n]*\n(?:(?!\*\*)[^\n]*\n)*/gi;
  
  const matches = content.matchAll(activityBlockPattern);
  
  for (const match of matches) {
    const block = match[0];
    const title = match[1]?.trim().replace(/[🫧🌊🏖️🍽️🏛️⭐]/g, '').trim();
    
    if (!title || title.length < 3 || title.length > 100) continue;
    
    // Skip section headers and non-activity items
    const skipPatterns = [
      /^(pro tips?|rules?|notes?|important|recommended|what's included|what to bring|travel|duration)/i,
      /^(snorkeling|water activities|cenotes|beach clubs|restaurants|activities)/i,
    ];
    if (skipPatterns.some(p => p.test(title))) continue;
    
    // Extract duration
    const durationMatch = block.match(/duration[:\s]+([^\n]+)/i);
    const duration = durationMatch?.[1]?.trim();
    
    // Extract what's included
    const includesMatch = block.match(/what's included[:\s]+([^\n]+(?:\n[•\-\*][^\n]+)*)/i);
    const includesText = includesMatch?.[1]?.trim() || "";
    const includes = includesText
      .split(/[•\-\*\n,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 100);
    
    // Extract what to bring
    const bringMatch = block.match(/what to bring[:\s]+([^\n]+(?:\n[•\-\*][^\n]+)*)/i);
    const bringText = bringMatch?.[1]?.trim() || "";
    const whatToBring = bringText
      .split(/[•\-\*\n,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 100);
    
    // Extract location
    const locationMatch = block.match(/(?:location|at|📍)[:\s]+([^\n]+)/i);
    const location = locationMatch?.[1]?.trim();
    
    // Extract travel info
    const travelMatch = block.match(/travel[:\s]+([^\n]+)/i);
    const travelInfo = travelMatch ? {
      travelTime: travelMatch[1]?.trim(),
    } : undefined;
    
    // Detect category based on keywords
    let category: ItineraryItemCategory = "activity";
    const lowerBlock = block.toLowerCase();
    if (/restaurant|food|eat|dining|taco|burrito|breakfast|lunch|dinner/i.test(lowerBlock)) {
      category = "food";
    } else if (/cenote|snorkel|dive|swim|beach|water|kayak|paddleboard/i.test(lowerBlock)) {
      category = "activity";
    }
    
    // Extract time if present
    const timeMatch = block.match(/\*\*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    const time = timeMatch?.[1]?.trim();
    
    // Extract booking link if present
    const bookingMatch = block.match(/\[Book[^\]]*\]\(([^)]+)\)/i);
    const bookingLink = bookingMatch?.[1];
    
    // Extract vendor ID from booking link (/vendor/{id}/book or legacy /experience/{id})
    const vendorIdMatch =
      bookingLink?.match(/\/vendor\/([^/\s)]+)\/book/) ??
      bookingLink?.match(/\/experience\/([^/\s)]+)/);
    const vendorId = vendorIdMatch?.[1];
    
    activities.push({
      title,
      description: block.slice(0, 200).replace(/\*\*/g, '').trim(),
      time,
      duration,
      category,
      location,
      includes: includes.length > 0 ? includes : undefined,
      whatToBring: whatToBring.length > 0 ? whatToBring : undefined,
      vendorId,
      bookingLink,
      travelInfo,
    });
  }
  
  return activities;
}

// Lazy-loaded map that only renders when visible
function LazyVendorMap({ vendorName }: { vendorName: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-[85%] mt-3" style={{ minHeight: '200px' }}>
      {isVisible ? (
        <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" aria-label="Loading map" />}>
          <VendorLocationMap vendorName={vendorName} />
        </Suspense>
      ) : (
        <Skeleton className="h-48 w-full rounded-lg" aria-label="Loading map" />
      )}
    </div>
  );
}

export const ChatMessage = memo(function ChatMessage({ message, bionicEnabled, hostVendors }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Fallback: model sometimes confirms a host vendor without emitting a Book link
  const fallbackBookVendors = useMemo(() => {
    if (!isAssistant || !hostVendors?.length) return [];
    const content = message.content;
    if (/\]\(\/vendor\/[^)]+\/book\)/i.test(content)) return [];
    if (!BOOKING_INTENT.test(content)) return [];
    const lower = content.toLowerCase();
    return hostVendors.filter(v => v.name && lower.includes(v.name.toLowerCase()));
  }, [isAssistant, hostVendors, message.content]);
  
  const isQuoteMessage = useMemo(
    () => isAssistant && hasQuoteInMessage(message.content),
    [isAssistant, message.content]
  );
  
  const vendorName = useMemo(
    () => isQuoteMessage ? extractVendorFromMessage(message.content) : null,
    [isQuoteMessage, message.content]
  );
  
  const formattedContent = useMemo(
    () => isAssistant && bionicEnabled ? applyBionicReading(message.content) : message.content,
    [isAssistant, bionicEnabled, message.content]
  );

  const markdownComponents = useMemo(() => ({
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      const text = String(children);
      const isBookingLink =
        (href?.startsWith('/vendor/') || href?.startsWith('/experience/')) && text.includes('Book');
      
      if (isBookingLink && href) {
        return <BookingLink href={href} text={text} />;
      }
      
      return <ExternalLink href={href || '#'}>{children}</ExternalLink>;
    },
  }), []);

  return (
    <article 
      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
      aria-label={`${isUser ? "Your" : "Assistant"} message`}
    >
      <Card
        className={`max-w-[85%] p-4 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <div
          className={
            isAssistant
              ? "prose prose-sm dark:prose-invert max-w-none prose-p:my-3 prose-p:leading-relaxed prose-ul:my-4 prose-ul:space-y-2 prose-li:my-1 prose-headings:mt-6 prose-headings:mb-3 prose-h2:text-base prose-h2:font-bold prose-strong:text-foreground [&>*+*]:mt-4 [&_ul]:pl-1 [&_li]:pl-0 prose-li:marker:text-primary whitespace-pre-line"
              : ""
          }
        >
          <ReactMarkdown components={markdownComponents}>
            {formattedContent}
          </ReactMarkdown>
          {fallbackBookVendors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fallbackBookVendors.map(v => (
                <BookingLink
                  key={String(v.id)}
                  href={`/vendor/${v.id}/book`}
                  text={`Book ${v.name} Now →`}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {isQuoteMessage && vendorName && (
        <LazyVendorMap vendorName={vendorName} />
      )}
    </article>
  );
});
