import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Sparkles, Trash2 } from "lucide-react";

export type RegenerateOption = "full" | "improve" | null;

interface RegenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: RegenerateOption) => void;
  hasUserEdits: boolean;
}

export function RegenerateDialog({
  open,
  onOpenChange,
  onSelect,
  hasUserEdits,
}: RegenerateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Regenerate Itinerary
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Choose how you'd like to regenerate your itinerary:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {/* Improve Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex flex-col items-start gap-1 text-left"
            onClick={() => onSelect("improve")}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Improve Current Itinerary
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {hasUserEdits
                ? "Keeps your edited items and fills in gaps with new suggestions."
                : "Enhances existing items and adds more activities where needed."}
            </p>
          </Button>

          {/* Full Regenerate Option */}
          <Button
            variant="outline"
            className="w-full h-auto p-4 flex flex-col items-start gap-1 text-left border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
            onClick={() => onSelect("full")}
          >
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <Trash2 className="h-4 w-4" />
              Full Regenerate
            </div>
            <p className="text-xs text-muted-foreground font-normal">
              {hasUserEdits
                ? "Warning: This will remove all your edits and create a fresh itinerary."
                : "Clears everything and creates a brand new itinerary from scratch."}
            </p>
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onSelect(null)}>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
