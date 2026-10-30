import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SignInPrompt } from "@/components/SignInPrompt";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItineraryItem } from "@/components/SortableItineraryItem";
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Share2,
  Link as LinkIcon,
  Check,
} from "lucide-react";

interface ItineraryItem {
  id: string;
  vendor_name: string;
  vendor_address: string | null;
  place_id: string | null;
  travel_distance: string | null;
  travel_duration: string | null;
  travel_duration_seconds: number | null;
  arrival_tips: string[] | null;
  notes: string | null;
  planned_date: string | null;
  planned_time: string | null;
  sort_order: number;
  created_at: string;
}

interface SharedItinerary {
  id: string;
  share_token: string;
  title: string;
  is_public: boolean;
}

export default function Itinerary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sharedItinerary, setSharedItinerary] = useState<SharedItinerary | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchItinerary = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNeedsSignIn(true);
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch itinerary items
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching itinerary:', error);
        toast({
          title: "Error",
          description: "Failed to load your itinerary.",
          variant: "destructive",
        });
      } else {
        setItems(data || []);
      }

      // Fetch or create shared itinerary record
      const { data: sharedData } = await supabase
        .from('shared_itineraries')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (sharedData) {
        setSharedItinerary(sharedData);
      }

      setIsLoading(false);
    };

    fetchItinerary();
  }, [navigate, toast]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update sort_order in database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('itinerary_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from itinerary.",
        variant: "destructive",
      });
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Removed",
        description: "Item removed from your itinerary.",
      });
    }
    setDeletingId(null);
  };

  const handleShare = async () => {
    if (!userId) return;

    setIsSharing(true);

    try {
      let shareToken = sharedItinerary?.share_token;

      if (!sharedItinerary) {
        // Create shared itinerary record
        const { data, error } = await supabase
          .from('shared_itineraries')
          .insert({
            user_id: userId,
            is_public: true,
          })
          .select()
          .single();

        if (error) throw error;
        setSharedItinerary(data);
        shareToken = data.share_token;
      } else if (!sharedItinerary.is_public) {
        // Make it public
        const { error } = await supabase
          .from('shared_itineraries')
          .update({ is_public: true })
          .eq('id', sharedItinerary.id);

        if (error) throw error;
        setSharedItinerary({ ...sharedItinerary, is_public: true });
      }

      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/itinerary/shared/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);

      toast({
        title: "Link copied!",
        description: "Share this link with friends to show them your trip plan.",
      });
    } catch (err) {
      console.error('Error sharing itinerary:', err);
      toast({
        title: "Error",
        description: "Failed to create share link.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  if (needsSignIn) {
    return (
      <SignInPrompt
        title="Sign in to see saved plans"
        description="You can browse the trip planner without an account. Sign in to save an itinerary and open it here."
      />
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">My Itinerary</h1>
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Share itinerary"
              onClick={handleShare}
              disabled={isSharing}
              className="relative"
            >
              {linkCopied ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <Share2 className="h-5 w-5" />
              )}
            </Button>
          )}
          {items.length === 0 && <div className="w-10" />}
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved items yet</h2>
              <p className="text-muted-foreground mb-6">
                Use the Trip Planner to discover experiences and save them to your itinerary.
              </p>
              <Button onClick={() => navigate('/trip-planner')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Open Trip Planner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag to reorder
                </p>
              </div>

              {sharedItinerary?.is_public && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Sharing enabled</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-auto p-0 h-auto"
                    onClick={handleShare}
                  >
                    Copy link
                  </Button>
                </div>
              )}
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <SortableItineraryItem
                        key={item.id}
                        item={item}
                        index={index}
                        onDelete={handleDelete}
                        isDeleting={deletingId === item.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
