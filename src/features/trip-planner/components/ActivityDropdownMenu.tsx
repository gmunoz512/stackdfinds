import { 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActivityDropdownMenuProps {
  onViewDetails: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onReplace: () => void;
  onViewOnMap?: () => void;
  hasLocation?: boolean;
  disabled?: boolean;
}

export function ActivityDropdownMenu({
  onViewDetails,
  onEdit,
  onRemove,
  onReplace,
  onViewOnMap,
  hasLocation = false,
  disabled = false,
}: ActivityDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
          disabled={disabled}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Activity options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-popover border-border"
        sideOffset={4}
      >
        <DropdownMenuItem 
          onClick={onViewDetails}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          <span>View details</span>
        </DropdownMenuItem>
        
        {hasLocation && onViewOnMap && (
          <DropdownMenuItem 
            onClick={onViewOnMap}
            className="flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="h-4 w-4" />
            <span>View on map</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onEdit}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onReplace}
          className="flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Replace with alternative</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onRemove}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>Remove</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
