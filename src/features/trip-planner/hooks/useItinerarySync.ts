import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Itinerary, CollaboratorPermission } from "../types";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Json } from "@/integrations/supabase/types";

interface UseItinerarySyncOptions {
  /** The itinerary ID to sync */
  itineraryId: string | null;
  /** Current user's permission */
  permission: "owner" | CollaboratorPermission | null;
  /** Callback when remote changes are received */
  onRemoteChange: (itinerary: Itinerary) => void;
  /** Debounce delay in ms for local changes */
  debounceMs?: number;
}

interface UseItinerarySyncReturn {
  /** Push local changes to the database */
  pushChanges: (itinerary: Itinerary) => void;
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Whether realtime is connected */
  isConnected: boolean;
}

/**
 * Hook for real-time itinerary collaboration.
 * Handles bidirectional sync between local state and database.
 */
export function useItinerarySync({
  itineraryId,
  permission,
  onRemoteChange,
  debounceMs = 1000,
}: UseItinerarySyncOptions): UseItinerarySyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedRef = useRef<string | null>(null);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!itineraryId) {
      setIsConnected(false);
      return;
    }

    const channel = supabase
      .channel(`itinerary:${itineraryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "itineraries",
          filter: `id=eq.${itineraryId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          
          // Skip if this was our own change (avoid echo)
          const dataHash = JSON.stringify(row.itinerary_data);
          if (dataHash === lastPushedRef.current) {
            return;
          }

          // Extract itinerary from the database row
          const itinerary: Itinerary = {
            ...row.itinerary_data,
            id: row.id,
            destination: row.destination,
            startDate: row.start_date,
            endDate: row.end_date,
            isConfirmed: row.is_confirmed,
            shareToken: row.share_token,
            isPublic: row.is_public,
            userId: row.user_id,
          };

          onRemoteChange(itinerary);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [itineraryId, onRemoteChange]);

  const pushChanges = useCallback(
    (itinerary: Itinerary) => {
      if (!itineraryId) return;
      if (permission !== "owner" && permission !== "editor") {
        return;
      }

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setIsSyncing(true);
        
        try {
          const dataToStore = {
            ...itinerary,
            // Clean up local-only fields
            shareUrl: undefined,
          };
          
          // Track what we're pushing to avoid echo
          lastPushedRef.current = JSON.stringify(dataToStore);

          const { error } = await supabase
            .from("itineraries")
            .update({
              destination: itinerary.destination,
              start_date: itinerary.startDate,
              end_date: itinerary.endDate,
              itinerary_data: dataToStore as unknown as Json,
              is_confirmed: itinerary.isConfirmed ?? false,
              is_public: itinerary.isPublic ?? false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", itineraryId);

          if (error) {
            lastPushedRef.current = null;
          } else {
            setLastSyncAt(new Date());
          }
        } catch {
          lastPushedRef.current = null;
        } finally {
          setIsSyncing(false);
        }
      }, debounceMs);
    },
    [itineraryId, permission, debounceMs]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    pushChanges,
    isSyncing,
    lastSyncAt,
    isConnected,
  };
}

/**
 * Load an itinerary from the database by ID or share token.
  * Uses itineraries_public view for anonymous/unauthenticated access.
 */
export async function loadItineraryFromDatabase(
  idOrToken: string,
  isShareToken = false
): Promise<{ itinerary: Itinerary | null; permission: "owner" | CollaboratorPermission | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // For unauthenticated users, use the public view (no user_id exposed)
    if (!user) {
      // Query the public view that strips sensitive fields
      let query = supabase
        .from("itineraries_public")
        .select("*");
      
      if (isShareToken) {
        query = query.eq("share_token", idOrToken);
      } else {
        query = query.eq("id", idOrToken);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await query.maybeSingle() as any;

      if (error) {
        return { itinerary: null, permission: null, error: error.message };
      }

      if (!data) {
        return { itinerary: null, permission: null, error: "Itinerary not found" };
      }

      // Build itinerary from public view (no user_id field)
      const itineraryData = data.itinerary_data || { days: [] };
      const itinerary: Itinerary = {
        ...itineraryData,
        id: data.id,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        isConfirmed: data.is_confirmed,
        shareToken: data.share_token,
        isPublic: data.is_public,
        // userId intentionally not set - not exposed in public view
        shareUrl: `${window.location.origin}/shared/${data.share_token}`,
      };

      return { itinerary, permission: "viewer", error: null };
    }

    // Authenticated user: query the base table (RLS applies)
    let query = supabase
      .from("itineraries")
      .select("*");
    
    if (isShareToken) {
      query = query.eq("share_token", idOrToken);
    } else {
      query = query.eq("id", idOrToken);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await query.maybeSingle() as any;

    if (error) {
      return { itinerary: null, permission: null, error: error.message };
    }

    if (!data) {
      return { itinerary: null, permission: null, error: "Itinerary not found" };
    }

    // Determine permission for authenticated user
    let permission: "owner" | CollaboratorPermission | null = null;
    const isOwner = user.id === data.user_id;

    if (isOwner) {
      permission = "owner";
    } else {
      // Check if user is a collaborator
      const { data: collab } = await supabase
        .from("itinerary_collaborators")
        .select("permission")
        .eq("itinerary_id", data.id)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();
      
      if (collab) {
        permission = collab.permission as CollaboratorPermission;
      } else if (data.is_public) {
        permission = "viewer";
      }
    }

    // Build itinerary object from database row
    const itineraryData = data.itinerary_data || { days: [] };
    const itinerary: Itinerary = {
      ...itineraryData,
      id: data.id,
      destination: data.destination,
      startDate: data.start_date,
      endDate: data.end_date,
      isConfirmed: data.is_confirmed,
      shareToken: data.share_token,
      isPublic: data.is_public,
      userId: isOwner ? data.user_id : undefined, // Only expose userId to owner
      shareUrl: `${window.location.origin}/shared/${data.share_token}`,
    };

    return { itinerary, permission, error: null };
  } catch {
    return { itinerary: null, permission: null, error: "Failed to load itinerary" };
  }
}

/**
 * Save an itinerary to the database (create or update).
 */
export async function saveItineraryToDatabase(
  itinerary: Itinerary
): Promise<{ id: string | null; shareToken: string | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { id: null, shareToken: null, error: "Not authenticated" };
    }

    const dataToStore = {
      ...itinerary,
      shareUrl: undefined,
    };

    // Check if itinerary exists
    if (itinerary.id) {
      const { data: existing } = await supabase
        .from("itineraries")
        .select("id, user_id")
        .eq("id", itinerary.id)
        .maybeSingle();

      if (existing && existing.user_id === user.id) {
      // Update existing
        const { error } = await supabase
          .from("itineraries")
          .update({
            destination: itinerary.destination,
            start_date: itinerary.startDate,
            end_date: itinerary.endDate,
            itinerary_data: dataToStore as unknown as Json,
            is_confirmed: itinerary.isConfirmed ?? false,
            is_public: itinerary.isPublic ?? false,
          })
          .eq("id", itinerary.id);

        if (error) {
          return { id: null, shareToken: null, error: error.message };
        }

        return { id: itinerary.id, shareToken: itinerary.shareToken || null, error: null };
      }
    }

    // Create new
    const { data, error } = await supabase
      .from("itineraries")
      .insert([{
        user_id: user.id,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        end_date: itinerary.endDate,
        itinerary_data: dataToStore as unknown as Json,
        is_confirmed: itinerary.isConfirmed ?? false,
        is_public: false,
      }])
      .select("id, share_token")
      .single();

    if (error) {
      return { id: null, shareToken: null, error: error.message };
    }

    return { id: data.id, shareToken: data.share_token, error: null };
  } catch {
    return { id: null, shareToken: null, error: "Failed to save itinerary" };
  }
}

/**
 * Add a collaborator to an itinerary.
 */
export async function addCollaborator(
  itineraryId: string,
  email: string,
  permission: CollaboratorPermission
): Promise<{ inviteToken: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("itinerary_collaborators")
      .insert({
        itinerary_id: itineraryId,
        email: email.toLowerCase(),
        permission,
      })
      .select("invite_token")
      .single();

    if (error) {
      return { inviteToken: null, error: error.message };
    }

    return { inviteToken: data.invite_token, error: null };
  } catch {
    return { inviteToken: null, error: "Failed to add collaborator" };
  }
}

/**
 * Remove a collaborator from an itinerary.
 */
export async function removeCollaborator(
  collaboratorId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from("itinerary_collaborators")
      .delete()
      .eq("id", collaboratorId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch {
    return { error: "Failed to remove collaborator" };
  }
}

/**
 * Get collaborators for an itinerary.
 */
export async function getCollaborators(
  itineraryId: string
): Promise<{ collaborators: Array<{ id: string; email: string | null; userId: string | null; permission: CollaboratorPermission }>; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("itinerary_collaborators")
      .select("id, email, user_id, permission")
      .eq("itinerary_id", itineraryId);

    if (error) {
      return { collaborators: [], error: error.message };
    }

    const collaborators = (data || []).map((c) => ({
      id: c.id,
      email: c.email,
      userId: c.user_id,
      permission: c.permission as CollaboratorPermission,
    }));

    return { collaborators, error: null };
  } catch {
    return { collaborators: [], error: "Failed to get collaborators" };
  }
}
