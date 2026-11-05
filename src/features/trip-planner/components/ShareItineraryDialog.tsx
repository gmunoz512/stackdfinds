import { useState, useEffect } from "react";
import { Copy, Check, Link2, Share2, Eye, Pencil, Users, Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { CollaboratorPermission } from "../types";
import { CollaboratorsList } from "./CollaboratorsList";
import { getCollaborators } from "../hooks/useItinerarySync";

interface Collaborator {
  id: string;
  email: string | null;
  userId: string | null;
  permission: CollaboratorPermission;
}

interface ShareItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl: string | null;
  isGenerating: boolean;
  onGenerateLink: (permission?: CollaboratorPermission) => void;
  itineraryId?: string;
  isOwner?: boolean;
}

export function ShareItineraryDialog({
  open,
  onOpenChange,
  shareUrl,
  isGenerating,
  onGenerateLink,
  itineraryId,
  isOwner = true,
}: ShareItineraryDialogProps) {
  const [copied, setCopied] = useState(false);
  const [defaultPermission, setDefaultPermission] = useState<CollaboratorPermission>("viewer");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);

  // Load collaborators when dialog opens
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!open || !itineraryId || !isOwner) return;
      
      setIsLoadingCollaborators(true);
      const { collaborators: collabs } = await getCollaborators(itineraryId);
      setCollaborators(collabs);
      setIsLoadingCollaborators(false);
    };

    loadCollaborators();
  }, [open, itineraryId, isOwner]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Trip Itinerary",
          text: "Check out my trip itinerary!",
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  const handleGenerateLink = () => {
    onGenerateLink(defaultPermission);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Itinerary
          </DialogTitle>
          <DialogDescription>
            Share your itinerary with friends and family, or invite collaborators to edit together.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2">
              <Link2 className="h-4 w-4" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Collaborators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 py-4">
            {!shareUrl ? (
              <div className="space-y-4">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Link2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate a shareable link for your itinerary.
                  </p>
                </div>

                {/* Permission selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Default permission for link visitors</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={defaultPermission === "viewer" ? "default" : "outline"}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setDefaultPermission("viewer")}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">View only</span>
                    </Button>
                    <Button
                      variant={defaultPermission === "editor" ? "default" : "outline"}
                      className="h-auto py-3 flex-col gap-1"
                      onClick={() => setDefaultPermission("editor")}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="text-xs">Can edit</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {defaultPermission === "viewer" 
                      ? "Visitors can view but not modify the itinerary"
                      : "Visitors can add, edit, and remove activities"
                    }
                  </p>
                </div>

                <Separator />

                <Button 
                  onClick={handleGenerateLink} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Share Link"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success-strong" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Share buttons grid */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-success-strong" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const text = `Check out my trip itinerary! ${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 text-success-strong" />
                    WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const subject = "My Trip Itinerary";
                      const body = `Check out my trip itinerary!\n\n${shareUrl}`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2 text-info" />
                    Email
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const text = `Check out my trip itinerary! ${shareUrl}`;
                      window.open(`sms:?body=${encodeURIComponent(text)}`, "_self");
                    }}
                  >
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    Text
                  </Button>
                </div>

                {/* Native share button for mobile */}
                {typeof navigator.share === "function" && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={handleNativeShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    More Options
                  </Button>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Anyone with this link can {defaultPermission === "editor" ? "edit" : "view"} your itinerary
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaborators" className="py-4">
            {isLoadingCollaborators ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : itineraryId ? (
              <CollaboratorsList
                itineraryId={itineraryId}
                collaborators={collaborators}
                onCollaboratorsChange={setCollaborators}
                isOwner={isOwner}
              />
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Generate a share link first to invite collaborators
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
