import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Sparkles, Save, Apple } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSkip?: () => void;
}

export function AuthPromptDialog({ open, onOpenChange, onSkip }: AuthPromptDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuth = async (data: AuthFormData) => {
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/trip-planner`,
          },
        });

        if (error) {
          if (error.message.includes("already registered") || error.message.includes("already exists")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Try signing in instead.",
            });
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          throw error;
        }

        // Assign user role
        await supabase.functions.invoke("assign-role", {
          body: { role: "user" },
        });

        toast({
          title: "Account created!",
          description: "Your chat history and itineraries will now be saved.",
        });
        onOpenChange(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Your saved chats and itineraries are ready.",
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      localStorage.setItem("pending_role", "user");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth",
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      localStorage.setItem("pending_role", "user");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    onSkip?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl">
            {isSignUp ? "Save your trip plans" : "Welcome back!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp
              ? "Create an account to save your chat history and itineraries"
              : "Sign in to access your saved trips"}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="flex justify-center gap-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Save className="h-3.5 w-3.5 text-primary" />
            <span>Save chats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Build itineraries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Share trips</span>
          </div>
        </div>

        {/* OAuth Sign In Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FcGoogle className="h-5 w-5 mr-2" />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleAppleSignIn}
            disabled={loading}
          >
            <Apple className="h-5 w-5 mr-2" />
            Continue with Apple
          </Button>
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...form.register("email")}
              disabled={loading}
              className="h-10"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
              disabled={loading}
              className="h-10"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        {/* Toggle Sign Up/In */}
        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <span className="text-primary font-medium">Sign in</span>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <span className="text-primary font-medium">Sign up</span>
              </>
            )}
          </button>
        </div>

        {/* Skip Button */}
        <div className="text-center pt-2 border-t border-border">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue without an account
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
