import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import HostBottomNav from "@/components/HostBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSmartBack } from "@/hooks/use-smart-back";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ChangePassword = () => {
  const goBack = useSmartBack("/host/profile");
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [directPassword, setDirectPassword] = useState('');
  const [directConfirm, setDirectConfirm] = useState('');
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDirectReset = async () => {
    if (directPassword !== directConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (directPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsDirectLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: directPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setDirectPassword('');
      setDirectConfirm('');
      setDialogOpen(false);
    } catch (error: any) {
      const message = error.message || "Failed to update password";
      // Handle leaked password detection
      if (message.includes("data breach") || message.includes("leaked password") || message.includes("Password has been found")) {
        toast.error("This password has been found in a data breach. Please choose a different, more secure password.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsDirectLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      // First, get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("Unable to verify user. Please sign in again.");
        return;
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword
      });

      if (verifyError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Current password verified, now update to new password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const message = error.message || "Failed to update password";
      // Handle leaked password detection
      if (message.includes("data breach") || message.includes("leaked password") || message.includes("Password has been found")) {
        toast.error("This password has been found in a data breach. Please choose a different, more secure password.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="text-sm text-muted-foreground">Update your account password</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Update Password"}
            </Button>

            <div className="text-center pt-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot current password? Reset directly
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password Directly</DialogTitle>
                    <DialogDescription>
                      Since you're already logged in, you can set a new password without knowing your current one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="directPassword">New Password</Label>
                      <Input
                        id="directPassword"
                        type="password"
                        value={directPassword}
                        onChange={(e) => setDirectPassword(e.target.value)}
                        placeholder="Enter new password"
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="directConfirm">Confirm New Password</Label>
                      <Input
                        id="directConfirm"
                        type="password"
                        value={directConfirm}
                        onChange={(e) => setDirectConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        minLength={6}
                      />
                    </div>
                    <Button 
                      onClick={handleDirectReset} 
                      className="w-full" 
                      disabled={isDirectLoading}
                    >
                      {isDirectLoading ? "Updating..." : "Set New Password"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </Card>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default ChangePassword;
