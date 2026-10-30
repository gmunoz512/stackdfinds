import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Message, Itinerary, ItineraryDay, ItineraryItem, CollaboratorPermission } from "../types";
import { extractDestination, extractActivities, generateDays } from "../utils";
import type { ParsedActivity } from "../components/AddToItineraryButton";
import { useItinerarySync, saveItineraryToDatabase, getCollaborators, addCollaborator } from "../hooks/useItinerarySync";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

const ITINERARY_STORAGE_KEY = "tripPlannerItinerary";

export type RegenerateMode = "full" | "improve";
export type GenerationError = {
  message: string;
  code: "NETWORK_ERROR" | "PARSE_ERROR" | "NO_DATA" | "UNKNOWN";
  retryable: boolean;
};

// Parse trip dates from chat messages
function extractTripDatesFromMessages(messages: Message[]): { 
  startDate: string; 
  endDate: string; 
  destination: string;
  numDays: number;
} {
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Combine all messages for parsing
  const allText = messages.map(m => m.content).join("\n");
  
  // Try to extract destination
  const destination = extractDestination(allText) || "Tulum";
  
  // Try to find date patterns in user messages
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content).join("\n");
  const assistantMessages = messages.filter(m => m.role === "assistant").map(m => m.content).join("\n");
  
  // Look for explicit date mentions like "January 22-25" or "Jan 22 - 25"
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthAbbrev = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  
  const dateRangePattern = new RegExp(
    `(${monthNames.join("|")}|${monthAbbrev.join("|")})\\s*(\\d{1,2})(?:\\s*[-–]\\s*(\\d{1,2}))?(?:\\s*(?:to|-)\\s*(${monthNames.join("|")}|${monthAbbrev.join("|")})?\\s*(\\d{1,2}))?`,
    "i"
  );
  
  const dateMatch = (userMessages + " " + assistantMessages).match(dateRangePattern);
  
  const daysPattern = /(\d+)\s*(?:days?|nights?)/i;
  const daysMatch = (userMessages + " " + assistantMessages).match(daysPattern);
  
  let numDays = 4;
  let startDate = defaultStart;
  let endDate = defaultEnd;
  
  if (daysMatch) {
    numDays = parseInt(daysMatch[1], 10);
    if (numDays < 1) numDays = 1;
    if (numDays > 14) numDays = 14;
  }
  
  if (dateMatch) {
    const monthStr = dateMatch[1].toLowerCase();
    const startDay = parseInt(dateMatch[2], 10);
    const endDay = dateMatch[3] ? parseInt(dateMatch[3], 10) : (dateMatch[5] ? parseInt(dateMatch[5], 10) : startDay + numDays - 1);
    
    let monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthAbbrev.indexOf(monthStr);
    }
    
    if (monthIndex !== -1) {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      const year = monthIndex < currentMonth ? currentYear + 1 : currentYear;
      
      const parsedStart = new Date(year, monthIndex, startDay);
      const parsedEnd = new Date(year, monthIndex, endDay);
      
      if (!isNaN(parsedStart.getTime())) {
        startDate = parsedStart.toISOString().split('T')[0];
      }
      if (!isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd.toISOString().split('T')[0];
      }
      
      numDays = Math.max(1, Math.ceil((parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
  } else if (daysMatch) {
    const endDateObj = new Date(today.getTime() + (numDays - 1) * 24 * 60 * 60 * 1000);
    endDate = endDateObj.toISOString().split('T')[0];
  }
  
  return { startDate, endDate, destination, numDays };
}

interface CollaboratorInfo {
  id: string;
  email: string | null;
  userId: string | null;
  permission: CollaboratorPermission;
}

interface ItineraryContextValue {
  itinerary: Itinerary | null;
  isGenerating: boolean;
  isSaving: boolean;
  isSharing: boolean;
  isSyncing: boolean;
  isConnected: boolean;
  hasUserEdits: boolean;
  isConfirmed: boolean;
  shareUrl: string | null;
  generationError: GenerationError | null;
  lastMessages: Message[] | null;
  /** Current user's permission level */
  userPermission: "owner" | CollaboratorPermission | null;
  /** List of collaborators */
  collaborators: CollaboratorInfo[];
  /** Sync destination + dates from chat without regenerating items */
  syncTripFromChat: (messages: Message[]) => void;
  generateItineraryFromChat: (messages: Message[], mode?: RegenerateMode) => void;
  retryGeneration: () => void;
  clearError: () => void;
  updateItinerary: (partialUpdate: Partial<Itinerary>) => void;
  updateDayItems: (dayIndex: number, items: ItineraryItem[]) => void;
  updateItem: (dayIndex: number, itemIndex: number, updates: Partial<ItineraryItem>) => void;
  removeItem: (dayIndex: number, itemIndex: number) => void;
  addActivityToItinerary: (activity: ParsedActivity, dayIndex?: number, messages?: Message[]) => void;
  setTripDates: (startDate: string, endDate: string, destination?: string) => void;
  confirmItinerary: () => void;
  unconfirmItinerary: () => void;
  clearItinerary: () => void;
  generateShareLink: (permission?: CollaboratorPermission) => Promise<string | null>;
  saveToDatabase: () => Promise<boolean>;
  loadFromDatabase: () => Promise<boolean>;
  inviteCollaborator: (email: string, permission: CollaboratorPermission) => Promise<boolean>;
  refreshCollaborators: () => Promise<void>;
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

interface ItineraryProviderProps {
  children: ReactNode;
  messages?: Message[];
}

// ============================================
// Provider Component
// ============================================

export function ItineraryProvider({ children }: ItineraryProviderProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [generationError, setGenerationError] = useState<GenerationError | null>(null);
  const [lastMessages, setLastMessages] = useState<Message[] | null>(null);
  const [lastMode, setLastMode] = useState<RegenerateMode>("full");
  const [userPermission, setUserPermission] = useState<"owner" | CollaboratorPermission | null>("owner");
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const hasInitialized = useRef(false);
  const pendingSaveRef = useRef(false);

  // Handle remote changes from realtime sync
  const handleRemoteChange = useCallback((remoteItinerary: Itinerary) => {
    setItinerary(remoteItinerary);
  }, []);

  // Realtime sync hook
  const { pushChanges, isSyncing, isConnected } = useItinerarySync({
    itineraryId: itinerary?.id || null,
    permission: userPermission,
    onRemoteChange: handleRemoteChange,
    debounceMs: 1500,
  });

  // Load from localStorage on mount (fallback for offline/guest users)
  useEffect(() => {
    if (!hasInitialized.current) {
      const stored = localStorage.getItem(ITINERARY_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setItinerary(parsed);
        } catch {
          // Invalid JSON, ignore
        }
      }
      hasInitialized.current = true;
    }
  }, []);

  // Load from database for authenticated users
  useEffect(() => {
    const loadFromDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has an itinerary in the database
      const { data, error } = await supabase
        .from("itineraries")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = data as any;
      const itineraryData = row.itinerary_data || { days: [] };
      
      const dbItinerary: Itinerary = {
        ...itineraryData,
        id: row.id,
        destination: row.destination,
        startDate: row.start_date,
        endDate: row.end_date,
        isConfirmed: row.is_confirmed,
        shareToken: row.share_token,
        isPublic: row.is_public,
        userId: row.user_id,
        shareUrl: `${window.location.origin}/shared/${row.share_token}`,
      };

      // Only use DB version if it's newer or local is empty
      const localStored = localStorage.getItem(ITINERARY_STORAGE_KEY);
      if (!localStored) {
        setItinerary(dbItinerary);
        setUserPermission("owner");
      }
    };

    if (hasInitialized.current) {
      loadFromDB();
    }
  }, []);

  // Persist to localStorage when itinerary changes (fallback)
  useEffect(() => {
    if (hasInitialized.current && itinerary) {
      setIsSaving(true);
      localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(itinerary));
      
      // Also push to database if we have edit permission
      if (userPermission === "owner" || userPermission === "editor") {
        pushChanges(itinerary);
      }
      
      const timer = setTimeout(() => setIsSaving(false), 500);
      return () => clearTimeout(timer);
    }
  }, [itinerary, userPermission, pushChanges]);

  // Save to database explicitly
  const saveToDatabase = useCallback(async (): Promise<boolean> => {
    if (!itinerary) return false;
    
    setIsSaving(true);
    const { id, shareToken, error } = await saveItineraryToDatabase(itinerary);
    setIsSaving(false);
    
    if (error) {
      return false;
    }

    // Update itinerary with database ID and share token
    if (id && id !== itinerary.id) {
      setItinerary(prev => prev ? {
        ...prev,
        id,
        shareToken: shareToken || prev.shareToken,
        shareUrl: shareToken ? `${window.location.origin}/shared/${shareToken}` : prev.shareUrl,
      } : prev);
    }

    return true;
  }, [itinerary]);

  // Load from database
  const loadFromDatabase = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = data as any;
    const itineraryData = row.itinerary_data || { days: [] };
    
    const dbItinerary: Itinerary = {
      ...itineraryData,
      id: row.id,
      destination: row.destination,
      startDate: row.start_date,
      endDate: row.end_date,
      isConfirmed: row.is_confirmed,
      shareToken: row.share_token,
      isPublic: row.is_public,
      userId: row.user_id,
      shareUrl: `${window.location.origin}/shared/${row.share_token}`,
    };

    setItinerary(dbItinerary);
    setUserPermission("owner");
    return true;
  }, []);

  // Refresh collaborators list
  const refreshCollaborators = useCallback(async () => {
    if (!itinerary?.id) return;
    
    const { collaborators: collabs } = await getCollaborators(itinerary.id);
    setCollaborators(collabs);
  }, [itinerary?.id]);

  // Invite a collaborator
  const inviteCollaborator = useCallback(async (email: string, permission: CollaboratorPermission): Promise<boolean> => {
    if (!itinerary?.id) return false;
    
    const { error } = await addCollaborator(itinerary.id, email, permission);
    if (error) return false;
    
    await refreshCollaborators();
    return true;
  }, [itinerary?.id, refreshCollaborators]);

  const generateItineraryFromChat = useCallback((messages: Message[], mode: RegenerateMode = "full") => {
    setIsGenerating(true);
    setGenerationError(null);
    setLastMessages(messages);
    setLastMode(mode);
    
    setTimeout(() => {
      try {
        const assistantMessages = messages.filter(m => m.role === "assistant");
        
        if (assistantMessages.length === 0) {
          setGenerationError({
            message: "No trip information found. Please chat about your destination first.",
            code: "NO_DATA",
            retryable: false,
          });
          setIsGenerating(false);
          return;
        }
        
        const combinedText = assistantMessages.map(m => m.content).join("\n\n");
        const { startDate, endDate, destination } = extractTripDatesFromMessages(messages);
        const activities = extractActivities(combinedText);
        const newGeneratedDays = generateDays(startDate, endDate, activities);

        if (newGeneratedDays.length === 0) {
          setGenerationError({
            message: "Couldn't generate any days for your trip. Try asking for specific activities or recommendations.",
            code: "PARSE_ERROR",
            retryable: true,
          });
          setIsGenerating(false);
          return;
        }

        if (mode === "improve" && itinerary) {
          const improvedDays = itinerary.days.map((existingDay, dayIndex) => {
            const newDayData = newGeneratedDays[dayIndex];
            const keepItems = existingDay.items.filter(
              item => item.isUserEdited || (item.confidence && item.confidence >= 0.8)
            );
            const usedTimes = new Set(keepItems.map(item => item.time));
            const availableNewItems = newDayData?.items.filter(
              item => !usedTimes.has(item.time)
            ) || [];
            const mergedItems = [
              ...keepItems,
              ...availableNewItems.slice(0, Math.max(0, 4 - keepItems.length)),
            ].sort((a, b) => a.time.localeCompare(b.time));

            return {
              ...existingDay,
              items: mergedItems,
            };
          });

          setItinerary(prev => prev ? { ...prev, days: improvedDays } : prev);
        } else {
          const newItinerary: Itinerary = {
            id: crypto.randomUUID(),
            destination,
            startDate,
            endDate,
            days: newGeneratedDays,
          };
          
          setItinerary(newItinerary);
          setUserPermission("owner");
        }
        
        setGenerationError(null);
      } catch (err) {
        console.error("Error generating itinerary:", err);
        setGenerationError({
          message: "Something went wrong while creating your itinerary. Please try again.",
          code: "UNKNOWN",
          retryable: true,
        });
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  }, [itinerary]);

  const syncTripFromChat = useCallback((messages: Message[]) => {
    if (!messages.length) return;
    const { startDate, endDate, destination } = extractTripDatesFromMessages(messages);

    setItinerary(prev => {
      if (!prev) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        const days: ItineraryDay[] = [];
        for (let i = 0; i < numDays; i++) {
          const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          days.push({
            date: dayDate.toISOString().split("T")[0],
            items: [],
          });
        }

        return {
          id: crypto.randomUUID(),
          destination,
          startDate,
          endDate,
          days,
        };
      }

      if (prev.startDate === startDate && prev.endDate === endDate && prev.destination === destination) {
        return prev;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const newDays: ItineraryDay[] = [];
      const prevHasAnyItems = prev.days.some(d => d.items.length > 0);
      for (let i = 0; i < numDays; i++) {
        const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = dayDate.toISOString().split("T")[0];

        const existingByDate = prev.days.find(d => d.date === dateStr);
        if (existingByDate) {
          newDays.push(existingByDate);
          continue;
        }

        const existingByIndex = prevHasAnyItems ? prev.days[i] : undefined;
        if (existingByIndex) {
          newDays.push({
            ...existingByIndex,
            date: dateStr,
          });
          continue;
        }

        newDays.push({
          date: dateStr,
          items: [],
        });
      }

      return {
        ...prev,
        startDate,
        endDate,
        destination,
        days: newDays,
      };
    });
  }, []);

  const retryGeneration = useCallback(() => {
    if (lastMessages) {
      generateItineraryFromChat(lastMessages, lastMode);
    }
  }, [lastMessages, lastMode, generateItineraryFromChat]);

  const clearError = useCallback(() => {
    setGenerationError(null);
  }, []);

  const updateItinerary = useCallback((partialUpdate: Partial<Itinerary>) => {
    setItinerary(prev => {
      if (!prev) return prev;
      return { ...prev, ...partialUpdate };
    });
  }, []);

  const updateDayItems = useCallback((dayIndex: number, items: ItineraryItem[]) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        newDays[dayIndex] = { ...newDays[dayIndex], items };
      }
      return { ...prev, days: newDays };
    });
  }, []);

  const updateItem = useCallback((dayIndex: number, itemIndex: number, updates: Partial<ItineraryItem>) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex] && newDays[dayIndex].items[itemIndex]) {
        const newItems = [...newDays[dayIndex].items];
        newItems[itemIndex] = { 
          ...newItems[itemIndex], 
          ...updates, 
          isUserEdited: true,
          confidence: 1.0,
        };
        newDays[dayIndex] = { ...newDays[dayIndex], items: newItems };
      }
      return { ...prev, days: newDays };
    });
  }, []);

  const removeItem = useCallback((dayIndex: number, itemIndex: number) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        const newItems = newDays[dayIndex].items.filter((_, idx) => idx !== itemIndex);
        newDays[dayIndex] = { ...newDays[dayIndex], items: newItems };
      }
      return { ...prev, days: newDays };
    });
  }, []);

  const clearItinerary = useCallback(() => {
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
    setItinerary(null);
    setCollaborators([]);
  }, []);

  const setTripDates = useCallback((startDate: string, endDate: string, destination?: string) => {
    setItinerary(prev => {
      if (!prev) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        const days: ItineraryDay[] = [];
        for (let i = 0; i < numDays; i++) {
          const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          days.push({
            date: dayDate.toISOString().split('T')[0],
            items: [],
          });
        }
        
        return {
          id: crypto.randomUUID(),
          destination: destination || "Tulum",
          startDate,
          endDate,
          days,
        };
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const numDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      const newDays: ItineraryDay[] = [];
      for (let i = 0; i < numDays; i++) {
        const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = dayDate.toISOString().split('T')[0];
        
        const existingDay = prev.days.find(d => d.date === dateStr);
        if (existingDay) {
          newDays.push(existingDay);
        } else {
          newDays.push({
            date: dateStr,
            items: [],
          });
        }
      }
      
      return {
        ...prev,
        startDate,
        endDate,
        destination: destination || prev.destination,
        days: newDays,
      };
    });
  }, []);

  const addActivityToItinerary = useCallback((activity: ParsedActivity, dayIndex?: number, messages?: Message[]) => {
    setItinerary(prev => {
      if (!prev) {
        const chatMessages = messages || [];
        const { startDate, endDate, destination, numDays } = extractTripDatesFromMessages(chatMessages);
        
        const days: ItineraryDay[] = [];
        const start = new Date(startDate);
        for (let i = 0; i < numDays; i++) {
          const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          days.push({
            date: dayDate.toISOString().split('T')[0],
            items: [],
          });
        }
        
        const newItem: ItineraryItem = {
          id: crypto.randomUUID(),
          title: activity.title,
          description: activity.description || "",
          time: activity.time || "09:00",
          duration: activity.duration,
          category: activity.category,
          location: activity.location,
          includes: activity.includes,
          whatToBring: activity.whatToBring,
          vendorId: activity.vendorId,
          bookingLink: activity.bookingLink,
          travelInfo: activity.travelInfo,
          isUserEdited: true,
          confidence: 1.0,
        };
        
        days[0].items.push(newItem);
        
        return {
          id: crypto.randomUUID(),
          destination,
          startDate,
          endDate,
          days,
        };
      }
      
      let targetDayIndex = dayIndex ?? 0;
      
      if (dayIndex === undefined) {
        const foundIndex = prev.days.findIndex(day => day.items.length < 4);
        targetDayIndex = foundIndex >= 0 ? foundIndex : 0;
      }
      
      const targetDay = prev.days[targetDayIndex];
      const existingTimes = targetDay?.items.map(item => item.time) || [];
      const timeSlots = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
      const nextAvailableTime = timeSlots.find(t => !existingTimes.includes(t)) || activity.time || "12:00";
      
      const newItem: ItineraryItem = {
        id: crypto.randomUUID(),
        title: activity.title,
        description: activity.description || "",
        time: activity.time || nextAvailableTime,
        duration: activity.duration,
        category: activity.category,
        location: activity.location,
        includes: activity.includes,
        whatToBring: activity.whatToBring,
        vendorId: activity.vendorId,
        bookingLink: activity.bookingLink,
        travelInfo: activity.travelInfo,
        isUserEdited: true,
        confidence: 1.0,
      };
      
      const newDays = [...prev.days];
      if (newDays[targetDayIndex]) {
        newDays[targetDayIndex] = {
          ...newDays[targetDayIndex],
          items: [...newDays[targetDayIndex].items, newItem].sort((a, b) => a.time.localeCompare(b.time)),
        };
      }
      
      return { ...prev, days: newDays };
    });
  }, []);

  const confirmItinerary = useCallback(() => {
    setItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        isConfirmed: true,
        confirmedAt: new Date().toISOString(),
      };
    });
  }, []);

  const unconfirmItinerary = useCallback(() => {
    setItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        isConfirmed: false,
        confirmedAt: undefined,
      };
    });
  }, []);

  const generateShareLink = useCallback(async (defaultPermission: CollaboratorPermission = "viewer"): Promise<string | null> => {
    if (!itinerary) return null;
    
    // Auto-confirm if not confirmed
    if (!itinerary.isConfirmed) {
      setItinerary(prev => prev ? { ...prev, isConfirmed: true, confirmedAt: new Date().toISOString() } : prev);
    }
    
    // If we already have a share URL and it's in the database, return it
    if (itinerary.shareUrl && itinerary.shareToken) {
      return itinerary.shareUrl;
    }
    
    setIsSharing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // For authenticated users, save to the new itineraries table
      if (user) {
        const dataToStore = {
          ...itinerary,
          shareUrl: undefined,
          isConfirmed: true,
          confirmedAt: new Date().toISOString(),
        };

        // Check if itinerary already exists in DB
        const { data: existing } = await supabase
          .from("itineraries")
          .select("id, share_token")
          .eq("user_id", user.id)
          .eq("id", itinerary.id)
          .maybeSingle();

        let shareToken: string;
        let itineraryId: string;

        if (existing) {
          // Update existing and make public
          shareToken = existing.share_token;
          itineraryId = existing.id;
          
          await supabase
            .from("itineraries")
            .update({
              itinerary_data: dataToStore as unknown as Json,
              is_confirmed: true,
              is_public: true,
            })
            .eq("id", existing.id);
        } else {
          // Create new itinerary in database
          const { data: newData, error } = await supabase
            .from("itineraries")
            .insert([{
              user_id: user.id,
              destination: itinerary.destination,
              start_date: itinerary.startDate,
              end_date: itinerary.endDate,
              itinerary_data: dataToStore as unknown as Json,
              is_confirmed: true,
              is_public: true,
            }])
            .select("id, share_token")
            .single();

          if (error || !newData) {
            console.error("Error creating itinerary:", error);
            return null;
          }

          shareToken = newData.share_token;
          itineraryId = newData.id;
        }

        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/shared/${shareToken}`;

        setItinerary(prev => prev ? {
          ...prev,
          id: itineraryId,
          shareToken,
          shareUrl,
          isPublic: true,
        } : prev);

        return shareUrl;
      }
      
      // Anonymous users cannot create share links - prompt them to sign in
      toast.error("Please sign in to share your itinerary");
      return null;
    } catch (error) {
      console.error('Error generating share link:', error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [itinerary]);

  const hasUserEdits = itinerary?.days.some(day => 
    day.items.some(item => item.isUserEdited)
  ) ?? false;

  const isConfirmed = itinerary?.isConfirmed ?? false;
  const shareUrl = itinerary?.shareUrl ?? null;

  const value: ItineraryContextValue = {
    itinerary,
    isGenerating,
    isSaving,
    isSharing,
    isSyncing,
    isConnected,
    hasUserEdits,
    isConfirmed,
    shareUrl,
    generationError,
    lastMessages,
    userPermission,
    collaborators,
    syncTripFromChat,
    generateItineraryFromChat,
    retryGeneration,
    clearError,
    updateItinerary,
    updateDayItems,
    updateItem,
    removeItem,
    addActivityToItinerary,
    setTripDates,
    confirmItinerary,
    unconfirmItinerary,
    clearItinerary,
    generateShareLink,
    saveToDatabase,
    loadFromDatabase,
    inviteCollaborator,
    refreshCollaborators,
  };

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItineraryContext(): ItineraryContextValue {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error("useItineraryContext must be used within an ItineraryProvider");
  }
  return context;
}
