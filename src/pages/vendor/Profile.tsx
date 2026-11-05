import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, CreditCard, Receipt, UserPen, Lock, HelpCircle, LogOut, Eye, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VendorBottomNav from "@/components/VendorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const VendorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contactName, setContactName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch user profile for contact name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Fetch vendor profile for business name
      const { data: vendorData } = await supabase
        .from('vendor_profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setContactName(profileData?.full_name || "");
      setEditName(profileData?.full_name || "");
      setBusinessName(vendorData?.name || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setContactName(editName.trim());
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Your name has been updated.",
      });
    } catch (error) {
      console.error('Error saving name:', error);
      toast({
        title: "Error",
        description: "Failed to update name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = contactName || "Your Name";
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "VN";

  const menuItems = [
    { 
      label: "Preview Profile", 
      icon: Eye, 
      action: "/vendor/preview",
      gradient: true
    },
    { 
      label: "Settings", 
      icon: Settings, 
      action: "/vendor/settings",
      gradient: false
    },
    { 
      label: "Payment Settings", 
      icon: CreditCard, 
      action: "/vendor/payment-settings",
      gradient: false
    },
    { 
      label: "Payout History", 
      icon: Receipt, 
      action: "/vendor/payout-history",
      gradient: false
    },
    { 
      label: "Edit Profile", 
      icon: UserPen, 
      action: "/vendor/edit-profile",
      gradient: false
    },
    { 
      label: "Change Password", 
      icon: Lock, 
      action: "/vendor/change-password",
      gradient: false
    },
    { 
      label: "Help & Support", 
      icon: HelpCircle, 
      action: "/vendor/help-support",
      gradient: false
    },
    { 
      label: "Log Out", 
      icon: LogOut, 
      action: "/signout",
      gradient: false
    },
  ];

  const handleMenuClick = (action: string) => {
    navigate(action);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your account</p>
          </div>
          <button
            onClick={() => navigate('/signout')}
            className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Profile Header Card */}
        <Card className="p-5">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ) : isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-brand-light via-hot to-iris-strong text-paper text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditName(contactName);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={isSaving || !editName.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-brand-light via-hot to-iris-strong text-paper text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold truncate">{displayName}</h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    aria-label="Edit name"
                  >
                    <UserPen className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {businessName || "No business profile yet"}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Menu Items */}
        <Card className="overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.action)}
              className={`
                w-full flex items-center justify-between p-4 
                hover:bg-muted/30 active:bg-muted/50 transition-all
                ${index !== menuItems.length - 1 ? 'border-b' : ''}
                ${item.gradient ? 'bg-gradient-to-r from-brand/5 to-hot/5' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 flex-shrink-0 ${item.gradient ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-medium text-sm ${item.gradient ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </Card>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorProfile;