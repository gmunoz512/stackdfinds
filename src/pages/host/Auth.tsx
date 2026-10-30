import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PasswordResetOTPDialog } from "@/components/PasswordResetOTPDialog";

const HostAuth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/host/dashboard`,
          },
        });
        if (error) throw error;
        
        // Insert host role for the new user using secure Edge Function
        if (signUpData.user) {
          const { error: roleError } = await supabase.functions.invoke('assign-role', {
            body: { role: 'host' }
          });
          
          if (roleError) {
            console.error('Error setting host role:', roleError);
          }
        }
        
        toast.success("Account created! Redirecting...");
        navigate("/host/vendors");
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Check if user is admin
        if (signInData.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', signInData.user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (roleData) {
            toast.success("Welcome back, Admin!");
            navigate("/admin/settings");
            return;
          }
        }

        toast.success("Signed in successfully!");
        navigate("/host/vendors");
      }
    } catch (error: any) {
      const rawMessage = error?.message || "An error occurred";
      const message = rawMessage.includes("Invalid login credentials")
        ? "Invalid email or password. If you recently enabled leaked-password protection, you may need to reset your password."
        : rawMessage;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Enter your email above to reset your password");
      return;
    }

    setResetEmail(trimmedEmail);
    setShowOTPDialog(true);
  };

  return (
    <>
      <PasswordResetOTPDialog
        open={showOTPDialog}
        onOpenChange={setShowOTPDialog}
        email={resetEmail}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create an account to get started" : "Sign in to manage your vendors"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          {!isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
    </>
  );
};

export default HostAuth;
