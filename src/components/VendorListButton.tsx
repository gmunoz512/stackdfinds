import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Store, Check, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from '@/hooks/use-toast';

interface VendorListButtonProps {
  vendorId: string;
  vendorName: string;
}

export const VendorListButton = ({ vendorId, vendorName }: VendorListButtonProps) => {
  const { isAuthenticated, role } = useAuthContext();
  const { hasRecommendation, addRecommendation, removeRecommendation } = useProfile();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for authenticated hosts
  if (!isAuthenticated || role !== 'host') {
    return null;
  }

  const isSaved = hasRecommendation(vendorId, 'vendor');

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        await removeRecommendation(vendorId, 'vendor');
        toast({
          title: 'Removed from Vendor List',
          description: `${vendorName} has been removed from your vendors.`,
        });
      } else {
        await addRecommendation({ id: vendorId, type: 'vendor' });
        toast({
          title: 'Added to Vendor List',
          description: `${vendorName} has been added to your vendors.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your vendor list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? "outline" : "gradient"}
      size="lg"
      className="w-full"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isSaved ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Store className="h-4 w-4 mr-2" />
      )}
      {isSaved ? 'Remove from Vendor List' : 'Add to Vendor List'}
    </Button>
  );
};
