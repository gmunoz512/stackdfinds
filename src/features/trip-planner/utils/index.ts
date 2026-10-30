import type { Message, ItineraryItemCategory, ItineraryDay, ItineraryItem } from "../types";

export const CHAT_HISTORY_KEY = "tripPlannerChatHistory";
export const MAX_MESSAGE_LENGTH = 2000;
export const LOCAL_SHARE_PREFIX = "stackd_local_share_";

export function persistLocalSharedItinerary(token: string, payload: unknown) {
  const serialized = JSON.stringify(payload);
  try {
    sessionStorage.setItem(LOCAL_SHARE_PREFIX + token, serialized);
    localStorage.setItem(LOCAL_SHARE_PREFIX + token, serialized);
  } catch {
    // Ignore quota / private-mode failures
  }
}

export function readLocalSharedItinerary(token: string): unknown | null {
  try {
    const raw =
      sessionStorage.getItem(LOCAL_SHARE_PREFIX + token) ||
      localStorage.getItem(LOCAL_SHARE_PREFIX + token);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ============================================
// Confirmed Activity Detection (for auto-add)
// ============================================

export interface ConfirmedActivity {
  title: string;
  dayNumber?: number;
  duration?: string;
  location?: string;
  includes?: string[];
  whatToBring?: string[];
  category: ItineraryItemCategory;
}

/**
 * Detect when JC confirms an activity has been added to the itinerary.
 * Looks for structured confirmation patterns like:
 * - ✅ **Added to your itinerary:** **Gran Cenote** - Day 1
 * - I've added Gran Cenote to your itinerary
 * - Great! Gran Cenote is now on your plan
 */
export function detectConfirmedActivities(message: string): ConfirmedActivity[] {
  const activities: ConfirmedActivity[] = [];
  
  // Pattern 1: Structured format - ✅ **Added to your itinerary:** **[Name]** - Day [X]
  const structuredPattern = /✅\s*\*\*Added to your itinerary:\*\*\s*\n\n\*\*([^*]+)\*\*\s*[-–]\s*Day\s*(\d+)/gi;
  let match: RegExpExecArray | null;
  
  while ((match = structuredPattern.exec(message)) !== null) {
    const title = match[1].trim();
    const dayNumber = parseInt(match[2], 10);
    
    // Extract additional details from the surrounding text
    const blockStart = match.index;
    const blockEnd = message.indexOf("---", blockStart);
    const block = blockEnd > blockStart ? message.slice(blockStart, blockEnd) : message.slice(blockStart, blockStart + 500);
    
    activities.push({
      title,
      dayNumber,
      duration: extractFieldFromBlock(block, "Duration"),
      location: extractFieldFromBlock(block, "Location"),
      includes: extractListFromBlock(block, "What's Included"),
      whatToBring: extractListFromBlock(block, "What to Bring"),
      category: categorizeFromTitle(title),
    });
  }
  
  // Pattern 2: Natural language confirmations (fallback)
  if (activities.length === 0) {
    const naturalPatterns = [
      /I've added\s+\*?\*?([^*\n,]+?)\*?\*?\s+to (?:your|the) itinerary(?:\s+for\s+Day\s*(\d+))?/gi,
      /\*?\*?([^*\n,]+?)\*?\*?\s+(?:is now|has been) added to (?:your|the) itinerary(?:\s+for\s+Day\s*(\d+))?/gi,
      /Great[!,]?\s+(?:I've )?added\s+\*?\*?([^*\n,]+?)\*?\*?(?:\s+to (?:your|the) (?:itinerary|plan))?(?:\s+for\s+Day\s*(\d+))?/gi,
    ];
    
    for (const pattern of naturalPatterns) {
      while ((match = pattern.exec(message)) !== null) {
        const title = match[1].trim().replace(/[🌊🫧🏖️🍽️🏛️✨🐠🐢🌴⭐]/g, '').trim();
        
        // Skip if it's too short or looks like a phrase
        if (title.length < 3 || title.length > 80) continue;
        if (/^(it|that|this|the activity|your|some)/i.test(title)) continue;
        
        // Check if we already have this activity
        if (activities.some(a => a.title.toLowerCase() === title.toLowerCase())) continue;
        
        const dayNumber = match[2] ? parseInt(match[2], 10) : undefined;
        
        activities.push({
          title,
          dayNumber,
          category: categorizeFromTitle(title),
        });
      }
    }
  }
  
  return activities;
}

/**
 * Extract a single field value from a confirmation block
 */
function extractFieldFromBlock(block: string, fieldName: string): string | undefined {
  const patterns = [
    new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i'),
    new RegExp(`[📍⏱️✨🎒]\\s*${fieldName}[:\\s]+([^\\n]+)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extract a list of items from a confirmation block
 */
function extractListFromBlock(block: string, fieldName: string): string[] | undefined {
  const field = extractFieldFromBlock(block, fieldName);
  if (!field) return undefined;
  
  const items = field
    .split(/[,•]/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 100);
  
  return items.length > 0 ? items : undefined;
}

/**
 * Categorize an activity based on its title
 */
function categorizeFromTitle(title: string): ItineraryItemCategory {
  const lowerTitle = title.toLowerCase();
  
  if (/restaurant|food|eat|dining|breakfast|lunch|dinner|brunch|cafe|taco|pizza|sushi/i.test(lowerTitle)) {
    return "food";
  }
  if (/transport|taxi|uber|bus|flight|train|drive|airport|transfer/i.test(lowerTitle)) {
    return "transport";
  }
  if (/free time|rest|relax|leisure|optional/i.test(lowerTitle)) {
    return "free";
  }
  
  return "activity";
}

/**
 * Bionic reading: bold first part of each word for improved readability
 */
/**
 * Bionic reading: bold first part of each word for improved readability.
 * Now operates on plain text segments only, preserving markdown syntax.
 */
export function applyBionicReading(text: string): string {
  // Split text into markdown tokens and plain text
  // Preserve: **bold**, *italic*, [links](url), `code`, ```blocks```, #headings, emojis
  return text.replace(
    /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]*\]\([^)]*\)|`[^`]+`|```[\s\S]*?```|#{1,6}\s|[^\s\w])/g,
    '\x00$1\x00'
  ).split('\x00').map(segment => {
    // If it's a markdown token or empty, return as-is
    if (!segment || /^(\*|`|#|\[|!)/.test(segment) || /^\W+$/.test(segment)) {
      return segment;
    }
    // Apply bionic to plain text words only
    return segment.replace(/\b(\w+)\b/g, (word) => {
      if (word.length <= 1) return word;
      const boldLength = Math.ceil(word.length * 0.4);
      return `**${word.slice(0, boldLength)}**${word.slice(boldLength)}`;
    });
  }).join('');
}

/**
 * Extract vendor name from a message with a booking link
 */
export function extractVendorFromMessage(content: string): string | null {
  // Look for booking link format: [Book VendorName Now →](/experience/ID)
  const bookingMatch = content.match(/\[Book\s+([^\]]+?)\s+Now\s*→?\]/i);
  if (bookingMatch) {
    return bookingMatch[1].trim();
  }
  
  // Look for "Great choice" confirmation with vendor name
  const greatChoiceMatch = content.match(/Great choice[^*]*\*\*([^*]+)\*\*/i);
  if (greatChoiceMatch) {
    return greatChoiceMatch[1].trim();
  }
  
  // Look for HOST'S PICK pattern
  const hostsPickMatch = content.match(/HOST'S PICK:\s*\*?\*?([^*\n]+)/i);
  if (hostsPickMatch) {
    return hostsPickMatch[1].trim();
  }
  
  // Look for first bold text that looks like a venue name (not "Great choice" etc)
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g);
  if (boldMatches) {
    for (const match of boldMatches) {
      const name = match.replace(/\*\*/g, '').trim();
      // Skip common non-venue phrases
      if (!name.match(/^(Great choice|What's Included|Pro Tips|Duration|Price)/i) && name.length > 2) {
        return name;
      }
    }
  }
  
  return null;
}

/**
 * Check if message contains a quote (booking link or price mention)
 */
export function hasQuoteInMessage(content: string): boolean {
  const hasBookingLink = /\[Book[^\]]*\]\(\/(?:vendor|experience)\//.test(content);
  const hasPriceMention = /\$\d+/.test(content) && /per person|total|price/i.test(content);
  // Also detect the styled booking summary format from the AI
  const hasBookingSummary = /✅\s*\*\*Great choice/.test(content) || /⏱️.*💰/.test(content);
  return hasBookingLink || hasPriceMention || hasBookingSummary;
}

/**
 * Check if any message in conversation has a booking confirmation
 */
export function hasBookingInConversation(messages: Message[]): boolean {
  return messages.some(m => m.role === "assistant" && hasQuoteInMessage(m.content));
}

/**
 * Generate initial greeting message based on vendor availability
 */
export function getInitialMessage(vendorCount: number): string {
  return vendorCount > 0
    ? `🌴 Hey! I'm JC, your local Tulum guide. Your host has curated ${vendorCount} amazing experiences just for you — let's plan something great!`
    : "🌴 Hey! I'm JC, your local Tulum guide. Tell me about your trip and I'll help you find the best cenotes, beach clubs, restaurants, and hidden gems!";
}

// ============================================
// Itinerary Extraction Utilities (pure functions)
// ============================================

// Note: ItineraryItemCategory imported at top of file

// Known destinations to match first (prevents matching random phrases)
const KNOWN_DESTINATIONS = [
  "Tulum", "Cancun", "Cancún", "Playa del Carmen", "Mexico City", "Ciudad de México",
  "Riviera Maya", "Cozumel", "Isla Mujeres", "Holbox", "Bacalar", "Merida", "Mérida",
  "Puerto Vallarta", "Los Cabos", "Cabo San Lucas", "San Miguel de Allende", "Oaxaca",
  "Miami", "New York", "Los Angeles", "Paris", "London", "Tokyo", "Barcelona", "Rome",
  "Bali", "Phuket", "Dubai", "Sydney", "Amsterdam", "Berlin", "Prague", "Vienna"
];

export function extractDestination(text: string): string {
  // First, check for known destinations (case-insensitive)
  for (const destination of KNOWN_DESTINATIONS) {
    const regex = new RegExp(`\\b${destination}\\b`, "i");
    if (regex.test(text)) {
      return destination;
    }
  }
  
  // Fallback patterns for destinations not in the known list
  const patterns = [
    /(?:welcome to|visiting|trip to|traveling to)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|!|\?|$)/i,
    /(?:your\s+)?(?:trip|stay|visit)\s+(?:to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|!|\?|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const dest = match[1].trim();
      // Validate it looks like a destination (not a phrase like "the ocean")
      if (dest.length >= 3 && dest.length <= 40 && !dest.toLowerCase().startsWith("the ")) {
        return dest;
      }
    }
  }
  
  return "Your Trip";
}

export function extractDates(text: string): { startDate: string; endDate: string } {
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const datePattern = /(\w+\s+\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?/;
  const match = text.match(datePattern);
  
  if (match) {
    return { startDate: defaultStart, endDate: defaultEnd };
  }
  
  return { startDate: defaultStart, endDate: defaultEnd };
}

export function categorizeActivity(text: string): ItineraryItemCategory {
  const lowerText = text.toLowerCase();
  
  if (/restaurant|food|eat|dining|breakfast|lunch|dinner|brunch|cafe|taco|pizza|sushi/i.test(lowerText)) {
    return "food";
  }
  if (/transport|taxi|uber|bus|flight|train|drive|airport|transfer/i.test(lowerText)) {
    return "transport";
  }
  if (/free time|rest|relax|leisure|optional/i.test(lowerText)) {
    return "free";
  }
  
  return "activity";
}

/**
 * Parse a comma-separated or bullet-point list into an array of strings
 */
function parseListItems(text: string): string[] {
  if (!text) return [];
  
  // Split by common delimiters: commas, bullet points, or newlines with bullets
  const items = text
    .split(/[,•\n]+/)
    .map(item => item.replace(/^[-•*]\s*/, '').trim())
    .filter(item => item.length > 0 && item.length < 100);
  
  return items;
}

/**
 * Extract duration from text (e.g., "Duration: 2 hours", "2-3 hours")
 */
function extractDuration(text: string): string | undefined {
  const patterns = [
    /Duration:\s*([^\n,]+)/i,
    /(\d+(?:-\d+)?\s*(?:hour|hr|min|minute|day)s?)/i,
    /(?:takes|lasts|approximately)\s*(\d+(?:-\d+)?\s*(?:hour|hr|min|minute|day)s?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

/**
 * Extract "What's Included" list from text
 */
function extractIncludes(text: string): string[] {
  const patterns = [
    /What's Included[:\s]*([^\n]*(?:\n[•\-*].*)*)/i,
    /Includes?[:\s]*([^\n]*(?:\n[•\-*].*)*)/i,
    /Included[:\s]*([^\n]*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseListItems(match[1]);
    }
  }
  
  return [];
}

/**
 * Extract "What to Bring" list from text
 */
function extractWhatToBring(text: string): string[] {
  const patterns = [
    /What to Bring[:\s]*([^\n]*(?:\n[•\-*].*)*)/i,
    /Bring[:\s]*([^\n]*)/i,
    /Pack[:\s]*([^\n]*)/i,
    /You(?:'ll)?\s*need[:\s]*([^\n]*)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return parseListItems(match[1]);
    }
  }
  
  return [];
}

/**
 * Extract travel/distance info from text
 */
function extractTravelInfo(text: string): { distance?: string; travelTime?: string } {
  const result: { distance?: string; travelTime?: string } = {};
  
  // Distance patterns
  const distancePatterns = [
    /(\d+(?:\.\d+)?\s*(?:km|mi|miles?|kilometers?))/i,
    /distance[:\s]*([^\n,]+)/i,
  ];
  
  for (const pattern of distancePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      result.distance = match[1].trim();
      break;
    }
  }
  
  // Travel time patterns
  const timePatterns = [
    /Travel[:\s]*([^\n,]+)/i,
    /(\d+(?:-\d+)?\s*(?:min|minute|hour|hr)s?\s*(?:drive|walk|ride)?)/i,
    /(?:takes?|about)\s*(\d+(?:-\d+)?\s*(?:min|minute|hour|hr)s?)/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      result.travelTime = match[1].trim();
      break;
    }
  }
  
  return result;
}

/**
 * Extract a location/address from text
 */
function extractLocation(text: string): string | undefined {
  const patterns = [
    /(?:at|location|address)[:\s]*([^\n,]+)/i,
    /(?:from|in)\s+(?:Tulum\s+)?([A-Z][a-zA-Z\s]+(?:Centro|Beach|Zone|Hotel Zone))/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const location = match[1].trim();
      if (location.length > 3 && location.length < 80) {
        return location;
      }
    }
  }
  
  return undefined;
}

interface ExtractedActivity {
  title: string;
  description: string;
  category: ItineraryItemCategory;
  time?: string;
  duration?: string;
  includes?: string[];
  whatToBring?: string[];
  location?: string;
  distanceFromPrevious?: string;
  travelTimeFromPrevious?: string;
}

/**
 * Extract structured itinerary items from AI response text
 * Handles formats like:
 * **9:00 AM - Gran Cenote Visit** 🫧
 * Duration: 2 hours
 * What's Included: Entrance fee, Locker, Life jacket
 * What to Bring: Swimsuit, Sunscreen, Towel
 * Travel: 10 min drive from Tulum Centro (4 km)
 */
export function extractActivities(text: string): ExtractedActivity[] {
  const activities: ExtractedActivity[] = [];
  
  // Pattern for time-based activities: **9:00 AM - Activity Name**
  const timeActivityPattern = /\*\*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–]\s*([^*\n]+)\*\*/gi;
  let match: RegExpExecArray | null;
  
  const sections: Array<{ time: string; title: string; startIndex: number }> = [];
  
  while ((match = timeActivityPattern.exec(text)) !== null) {
    sections.push({
      time: match[1].trim(),
      title: match[2].trim().replace(/[🌊🫧🏖️🍽️🏛️✨🐠🐢🌴⭐]/g, '').trim(),
      startIndex: match.index,
    });
  }
  
  // Process each section to extract details
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const nextSectionStart = sections[i + 1]?.startIndex ?? text.length;
    const sectionText = text.slice(section.startIndex, nextSectionStart);
    
    const duration = extractDuration(sectionText);
    const includes = extractIncludes(sectionText);
    const whatToBring = extractWhatToBring(sectionText);
    const travelInfo = extractTravelInfo(sectionText);
    const location = extractLocation(sectionText);
    
    // Extract description (first line after the title that isn't a field)
    const descriptionMatch = sectionText.match(/\*\*[^*]+\*\*[^\n]*\n+([^*\n][^\n]+)/);
    const description = descriptionMatch?.[1]?.trim() || "";
    
    activities.push({
      title: section.title,
      description,
      category: categorizeActivity(section.title),
      time: section.time,
      duration,
      includes: includes.length > 0 ? includes : undefined,
      whatToBring: whatToBring.length > 0 ? whatToBring : undefined,
      location,
      distanceFromPrevious: travelInfo.distance,
      travelTimeFromPrevious: travelInfo.travelTime,
    });
  }
  
  // Fallback: If no time-based activities found, try extracting bold titles
  if (activities.length === 0) {
    const boldPattern = /\*\*([^*]+)\*\*/g;
    
    while ((match = boldPattern.exec(text)) !== null) {
      const title = match[1].trim();
      if (!/^(Great choice|What's Included|Pro Tips|Duration|Price|Note|Travel|Bring)/i.test(title) && title.length > 2) {
        // Get surrounding text for context
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(text.length, match.index + 500);
        const contextText = text.slice(contextStart, contextEnd);
        
        activities.push({
          title,
          description: "",
          category: categorizeActivity(title),
          duration: extractDuration(contextText),
          includes: extractIncludes(contextText),
          whatToBring: extractWhatToBring(contextText),
          location: extractLocation(contextText),
        });
      }
    }
    
    // Also check numbered lists
    const numberedPattern = /(?:^|\n)\s*\d+\.\s*\*?\*?([^*\n]+)/gm;
    while ((match = numberedPattern.exec(text)) !== null) {
      const title = match[1].trim();
      if (title.length > 3 && !activities.some(a => a.title === title)) {
        activities.push({
          title,
          description: "",
          category: categorizeActivity(title),
        });
      }
    }
  }
  
  return activities;
}

export function generateDays(
  startDate: string,
  endDate: string,
  activities: ExtractedActivity[]
): ItineraryDay[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const days: ItineraryDay[] = [];
  const activitiesPerDay = Math.ceil(activities.length / dayCount) || 2;
  const defaultTimes = ["09:00", "12:00", "15:00", "18:00", "20:00"];
  
  for (let i = 0; i < dayCount; i++) {
    const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = dayDate.toISOString().split('T')[0];
    
    const dayActivities = activities.slice(i * activitiesPerDay, (i + 1) * activitiesPerDay);
    
    const items: ItineraryItem[] = dayActivities.map((activity, idx) => {
      // Calculate travel info from previous activity
      const prevActivity = dayActivities[idx - 1];
      const nextActivity = dayActivities[idx + 1];
      
      return {
        time: activity.time || defaultTimes[idx % defaultTimes.length],
        title: activity.title,
        description: activity.description,
        category: activity.category,
        duration: activity.duration,
        includes: activity.includes,
        whatToBring: activity.whatToBring,
        location: activity.location,
        distanceFromPrevious: idx > 0 ? activity.distanceFromPrevious : undefined,
        travelTimeFromPrevious: idx > 0 ? activity.travelTimeFromPrevious : undefined,
        // Set distance/time to next from the next activity's "from previous"
        distanceToNext: nextActivity?.distanceFromPrevious,
        travelTimeToNext: nextActivity?.travelTimeFromPrevious,
        isUserEdited: false,
        confidence: activity.includes?.length || activity.whatToBring?.length ? 0.85 : 0.7,
      };
    });
    
    days.push({
      date: dateStr,
      title: `Day ${i + 1}`,
      items,
    });
  }
  
  return days;
}
