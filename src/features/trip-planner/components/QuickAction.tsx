import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ChatQuickActionProps {
  icon: ReactNode;
  label: string;
  onAction: () => void;
  disabled?: boolean;
}

export function ChatQuickAction({ icon, label, onAction, disabled }: ChatQuickActionProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onAction}
      disabled={disabled}
      aria-label={label}
      className="flex items-center gap-1.5 h-8 px-3 rounded-full border-border bg-card/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}

/** @deprecated Use ChatQuickAction instead */
export const QuickAction = ChatQuickAction;
