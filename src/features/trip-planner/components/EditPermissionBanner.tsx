import { Eye, Pencil, User, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CollaboratorPermission } from "../types";

interface EditPermissionBannerProps {
  permission: "owner" | CollaboratorPermission;
  isConnected?: boolean;
  isSyncing?: boolean;
  isGuest?: boolean;
  className?: string;
}

export function EditPermissionBanner({
  permission,
  isConnected = false,
  isSyncing = false,
  isGuest = false,
  className,
}: EditPermissionBannerProps) {
  const canEdit = permission === "owner" || permission === "editor";

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-xs",
        canEdit
          ? "bg-primary/10 text-primary border border-primary/20"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {permission === "owner" ? (
          <>
            <User className="h-3.5 w-3.5" />
            <span className="font-medium">Your itinerary</span>
          </>
        ) : permission === "editor" ? (
          <>
            <Pencil className="h-3.5 w-3.5" />
            <span className="font-medium">
              {isGuest ? "Editing as guest" : "You can edit"}
            </span>
          </>
        ) : (
          <>
            <Eye className="h-3.5 w-3.5" />
            <span className="font-medium">View only</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSyncing && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Saving...
          </Badge>
        )}

        {canEdit && (
          <div className="flex items-center gap-1">
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 text-success" />
                <span className="text-[10px] text-success-strong">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px]">Offline</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
