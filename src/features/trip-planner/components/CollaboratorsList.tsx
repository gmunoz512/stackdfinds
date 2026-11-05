import { useState } from "react";
import { Users, X, Mail, Eye, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CollaboratorPermission } from "../types";
import { addCollaborator, removeCollaborator } from "../hooks/useItinerarySync";

interface Collaborator {
  id: string;
  email: string | null;
  userId: string | null;
  permission: CollaboratorPermission;
}

interface CollaboratorsListProps {
  itineraryId: string;
  collaborators: Collaborator[];
  onCollaboratorsChange: (collaborators: Collaborator[]) => void;
  isOwner: boolean;
}

export function CollaboratorsList({
  itineraryId,
  collaborators,
  onCollaboratorsChange,
  isOwner,
}: CollaboratorsListProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<CollaboratorPermission>("viewer");
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddCollaborator = async () => {
    if (!email.trim()) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if already exists
    if (collaborators.some(c => c.email?.toLowerCase() === email.toLowerCase())) {
      toast.error("This person already has access");
      return;
    }

    setIsAdding(true);
    
    const { inviteToken, error } = await addCollaborator(itineraryId, email, permission);
    
    if (error) {
      toast.error("Failed to add collaborator");
      setIsAdding(false);
      return;
    }

    // Add to local list
    const newCollaborator: Collaborator = {
      id: inviteToken || crypto.randomUUID(),
      email: email.toLowerCase(),
      userId: null,
      permission,
    };

    onCollaboratorsChange([...collaborators, newCollaborator]);
    setEmail("");
    setPermission("viewer");
    toast.success(`Invited ${email} as ${permission}`);
    setIsAdding(false);
  };

  const handleRemoveCollaborator = async (collaborator: Collaborator) => {
    setRemovingId(collaborator.id);
    
    const { error } = await removeCollaborator(collaborator.id);
    
    if (error) {
      toast.error("Failed to remove collaborator");
      setRemovingId(null);
      return;
    }

    onCollaboratorsChange(collaborators.filter(c => c.id !== collaborator.id));
    toast.success("Collaborator removed");
    setRemovingId(null);
  };

  if (!isOwner && collaborators.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4" />
        <span>Collaborators</span>
        {collaborators.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {collaborators.length}
          </Badge>
        )}
      </div>

      {/* Current collaborators list */}
      {collaborators.length > 0 && (
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm truncate">{collaborator.email}</span>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="gap-1">
                  {collaborator.permission === "editor" ? (
                    <>
                      <Pencil className="h-3 w-3" />
                      Editor
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Viewer
                    </>
                  )}
                </Badge>
                
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemoveCollaborator(collaborator)}
                    disabled={removingId === collaborator.id}
                  >
                    {removingId === collaborator.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add collaborator form (owner only) */}
      {isOwner && (
        <div className="space-y-3 pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground">
            Invite by email
          </Label>
          
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCollaborator();
                }
              }}
            />
            
            <Select
              value={permission}
              onValueChange={(value) => setPermission(value as CollaboratorPermission)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Viewer
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-1">
                    <Pencil className="h-3 w-3" />
                    Editor
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleAddCollaborator}
            disabled={!email.trim() || isAdding}
            className="w-full"
            size="sm"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
