import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/hooks/use-toast';
import type { RecommendationItem } from '@/types';

interface GuestGuideButtonProps {
  itemId: string;
  itemType: RecommendationItem['type'];
  itemName: string;
}

export const GuestGuideButton = ({ itemId, itemType, itemName }: GuestGuideButtonProps) => {
  const { isAuthenticated, role } = useAuthContext();
  const { hasRecommendation, addRecommendation, removeRecommendation } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for authenticated hosts
  if (!isAuthenticated || role !== 'host') {
    return null;
  }

  const isSaved = hasRecommendation(itemId, itemType);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        await removeRecommendation(itemId, itemType);
        toast({
          title: 'Removed from Guest Guide',
          description: `${itemName} has been removed from your recommendations.`,
        });
      } else {
        await addRecommendation({ id: itemId, type: itemType });
        toast({
          title: 'Added to Guest Guide',
          description: `${itemName} has been added to your recommendations.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your Guest Guide. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="h-4 w-4 mr-2" />
      ) : (
        <BookmarkPlus className="h-4 w-4 mr-2" />
      )}
      {isSaved ? 'Remove from Guide' : 'Add to My Guest Guide'}
    </Button>
  );
};
