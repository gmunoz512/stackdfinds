import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { PasswordResetOTPDialog } from "@/components/PasswordResetOTPDialog";

const SignIn = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, isLoading } = useAuthContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in
  if (!isLoading && isAuthenticated && role) {
    if (role === 'host') {
      navigate('/host/dashboard', { replace: true });
    } else if (role === 'vendor') {
      navigate('/vendor/dashboard', { replace: true });
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        const msg = error.message.includes("Invalid login credentials")
          ? "Invalid email or password. If you recently enabled leaked-password protection, you may need to reset your password."
          : error.message;

        toast({
          title: "Sign in failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in",
        });
        // The AuthContext will handle the redirect based on role
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    const email = formData.email.trim();
    if (!email) {
      toast({
        title: "Enter your email",
        description: "Type your email above, then click Forgot Password.",
        variant: "destructive",
      });
      return;
    }
    setResetEmail(email);
    setShowOTPDialog(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PasswordResetOTPDialog 
        open={showOTPDialog} 
        onOpenChange={setShowOTPDialog} 
        email={resetEmail} 
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <Card className="w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src={stackdLogo} alt="stackd logo" className="h-10 w-10 drop-shadow-lg" />
            <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-brand via-hot to-iris-strong bg-clip-text text-transparent">
              stackd
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold">Welcome Back</h2>
          <p className="text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSubmitting}
              className="text-sm text-primary hover:underline disabled:opacity-60"
            >
              Forgot Password?
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Don't have an account?</p>
          <div className="flex gap-2 justify-center">
            <Link to="/signup/host" className="text-primary hover:underline">
              Sign up as Host
            </Link>
            <span>•</span>
            <Link to="/signup/vendor" className="text-primary hover:underline">
              Sign up as Vendor
            </Link>
          </div>
        </div>
        </Card>
      </div>
    </div>
    </>
  );
};

export default SignIn;
