import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Apple, Building2, Home, Store, Users } from "lucide-react";
import { FaAirbnb } from "react-icons/fa";
import { authSchema, type AuthFormData } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthContext } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-beach.jpg";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { PasswordResetOTPDialog } from "@/components/PasswordResetOTPDialog";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get("role") as "host" | "vendor" | "user" | null;
  const returnTo = searchParams.get("returnTo");
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { isAuthenticated, isLoading, role: userRole, setUserRole } = useAuthContext();

  // All hooks must be called before any conditional returns
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Only redirect authenticated users who have an existing role in the database
  useEffect(() => {
    const handleRedirect = async () => {
      if (!isLoading && isAuthenticated && userRole) {
        // If there's a returnTo parameter, use it
        if (returnTo) {
          navigate(returnTo, { replace: true });
          return;
        }
        
        if (userRole === "host") {
          navigate("/host/vendors", { replace: true });
        } else if (userRole === "vendor") {
          // Check if vendor already has a profile
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: vendorProfile } = await supabase
              .from('vendor_profiles')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (vendorProfile) {
              // Existing vendor with profile - go to dashboard
              navigate("/vendor/dashboard", { replace: true });
            } else {
              // New vendor without profile - go to create profile
              navigate("/vendor/upload-photos", { replace: true });
            }
          }
        } else if (userRole === "user") {
          navigate("/appview", { replace: true });
        }
      }
    };
    
    handleRedirect();
  }, [isAuthenticated, isLoading, userRole, navigate, returnTo]);

  // Handle OAuth callback - save pending role after Google sign-in
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const pendingRole = localStorage.getItem('pending_role') as 'host' | 'vendor' | 'user' | null;
      
      if (isAuthenticated && pendingRole && !userRole) {
        // User just signed in via OAuth and has a pending role to save
        // Use setUserRole which now calls the Edge Function
        const { error: roleError } = await setUserRole(pendingRole);
        
        if (!roleError) {
          localStorage.removeItem('pending_role');
        }
      }
    };
    
    handleOAuthCallback();
  }, [isAuthenticated, userRole, setUserRole]);

  const handleRoleSelect = async (selectedRole: "host" | "vendor" | "user") => {
    // If user is already authenticated but has no role, save the role directly
    if (isAuthenticated && !userRole) {
      setLoading(true);
      const { error } = await setUserRole(selectedRole);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to save your role. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Role saved!",
        description: "Redirecting to your dashboard...",
      });
      setLoading(false);
      navigate(getRedirectPath(selectedRole));
      return;
    }
    // Otherwise, proceed to sign up form with role
    setSearchParams({ role: selectedRole });
  };

  const getRedirectPath = (selectedRole: string | null, hasVendorProfile: boolean = false) => {
    // Check for returnTo parameter first
    if (returnTo) return returnTo;
    if (selectedRole === "host") return "/host/vendors";
    if (selectedRole === "vendor") return hasVendorProfile ? "/vendor/dashboard" : "/vendor/upload-photos";
    return "/appview";
  };

  // Show role selection if no role is specified and user is signing up
  if (!role && isSignUp) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={stackdLogo}
              alt="Stackd" 
              className="h-32 w-32 sm:h-40 sm:w-40 object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Choose your role.</h1>
          </div>

          {/* Role Cards - Compact horizontal style */}
          <div className="space-y-3">
            {/* Guest Card */}
            <button
              onClick={() => handleRoleSelect("user")}
              className="group w-full p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm
                transition-all duration-300 hover:border-brand/50 hover:bg-card/80 hover:scale-[1.01]
                hover:shadow-[0_4px_20px_rgba(234,179,8,0.15)] focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rating to-brand 
                  flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-paper" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-foreground">Guest</h3>
                  <p className="text-sm text-muted-foreground">Discover local experiences</p>
                </div>
              </div>
            </button>

            {/* Host Card */}
            <button
              onClick={() => handleRoleSelect("host")}
              className="group w-full p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm
                transition-all duration-300 hover:border-iris/50 hover:bg-card/80 hover:scale-[1.01]
                hover:shadow-[0_4px_20px_rgba(168,85,247,0.15)] focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-iris-strong to-hot 
                  flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-paper" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-foreground">Host</h3>
                  <p className="text-sm text-muted-foreground">Curate experiences for guests</p>
                </div>
              </div>
            </button>

            {/* Vendor Card */}
            <button
              onClick={() => handleRoleSelect("vendor")}
              className="group w-full p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm
                transition-all duration-300 hover:border-brand/50 hover:bg-card/80 hover:scale-[1.01]
                hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)] focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-hot 
                  flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Store className="h-6 w-6 text-paper" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-foreground">Vendor</h3>
                  <p className="text-sm text-muted-foreground">Offer services to guests</p>
                </div>
              </div>
            </button>
          </div>

          {/* Sign in link */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleAuth = async (data: AuthFormData) => {
    setLoading(true);
    
    // Use AbortController for proper timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      if (isSignUp) {
        const redirectPath = getRedirectPath(role);
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectPath}`,
          },
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          // Handle "User already registered" - offer to sign in instead
          if (error.message.includes("already registered") || error.message.includes("already exists")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Try signing in instead.",
            });
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          setLoading(false);
          throw error;
        }
        
        // Save user role if provided - use Edge Function for secure role assignment
        if (signUpData.user && role) {
          // Call Edge Function to assign role securely server-side
          // Retry up to 3 times with delay
          let roleAssigned = false;
          for (let attempt = 1; attempt <= 3 && !roleAssigned; attempt++) {
            try {
              const { data: roleData, error: roleError } = await supabase.functions.invoke('assign-role', {
                body: { role }
              });
              
              if (roleError) {
                if (attempt < 3) {
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                }
              } else if (roleData?.success) {
                roleAssigned = true;
              }
            } catch {
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              }
            }
          }
          
          if (!roleAssigned) {
            toast({
              title: "Warning",
              description: "Account created but role wasn't saved. Please select your role again.",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "Success!",
          description: "Account created successfully.",
        });
        setLoading(false);
        navigate(redirectPath);
      } else {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          setLoading(false);
          throw error;
        }
        
        // Fetch user's role and redirect accordingly
        if (signInData.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', signInData.user.id)
            .maybeSingle();
          
          if (roleData?.role) {
            // User has a role, check for vendor profile if vendor
            let hasVendorProfile = false;
            if (roleData.role === 'vendor') {
              const { data: vendorProfile } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', signInData.user.id)
                .maybeSingle();
              hasVendorProfile = !!vendorProfile;
            }
            
            const redirectPath = getRedirectPath(roleData.role, hasVendorProfile);
            toast({
              title: "Welcome back!",
              description: "Successfully signed in.",
            });
            setLoading(false);
            navigate(redirectPath);
          } else {
            // No role found - need to select one
            toast({
              title: "Welcome back!",
              description: "Please select your role to continue.",
            });
            setLoading(false);
            setIsSignUp(true); // Show role selection
            setSearchParams({}); // Clear role param to show selection screen
          }
        }
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      setLoading(false);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: "Connection Timeout",
          description: "Request took too long. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const rawMessage = error instanceof Error ? error.message : "An error occurred. Please try again.";
      
      // Handle leaked password detection
      if (rawMessage.includes("data breach") || rawMessage.includes("leaked password") || rawMessage.includes("Password has been found in data breaches")) {
        toast({
          title: "Password Security Alert",
          description: "This password has been found in a data breach. Please choose a different, more secure password.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }
      
      const errorMessage = rawMessage.includes("Invalid login credentials")
        ? "Invalid email or password. If you recently enabled leaked-password protection, you may need to reset your password."
        : rawMessage;

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Store the selected role in localStorage so we can save it after OAuth redirect
      if (role) {
        localStorage.setItem('pending_role', role);
      }
      
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
      // Store the selected role in localStorage so we can save it after OAuth redirect
      if (role) {
        localStorage.setItem('pending_role', role);
      }
      
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

  const handleForgotPassword = () => {
    const email = form.getValues("email").trim();
    if (!email) {
      toast({
        title: "Enter your email",
        description: "Type your email above, then click Forgot password.",
        variant: "destructive",
      });
      return;
    }
    setResetEmail(email);
    setShowOTPDialog(true);
  };

  return (
    <>
      <PasswordResetOTPDialog 
        open={showOTPDialog} 
        onOpenChange={setShowOTPDialog} 
        email={resetEmail} 
      />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src={stackdLogo}
              alt="Stackd" 
              className="h-24 w-24 sm:h-32 sm:w-32 object-contain"
            />
          </div>

          {/* Glass-morphic Card */}
          <div className="p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? "Sign up to get started" : "Sign in to continue"}
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="rounded-xl border-border/50 bg-background/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="rounded-xl border-border/50 bg-background/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-border/50 bg-background/50 hover:bg-card/80 hover:scale-105 transition-all"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-border/50 bg-background/50 hover:bg-card/80 hover:scale-105 transition-all"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                >
                  <Apple className="h-5 w-5" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-border/50 bg-background/50 hover:bg-card/80 hover:scale-105 transition-all"
                  onClick={() =>
                    toast({
                      title: "Coming Soon",
                      description: "Airbnb login will be available soon.",
                    })
                  }
                >
                  <FaAirbnb className="h-5 w-5 text-[#FF5A5F]" />
                </Button>
              </div>
            </div>
          </div>

          {/* Toggle sign-up/sign-in */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                form.clearErrors();
                if (!isSignUp) {
                  setSearchParams({});
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span className="text-primary font-medium">{isSignUp ? "Sign in" : "Sign up"}</span>
            </button>
          </div>

          {/* Back to role selection (only when signing up with a role) */}
          {isSignUp && role && (
            <div className="text-center">
              <button
                onClick={() => setSearchParams({})}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to role selection
              </button>
            </div>
          )}

          {/* Back to home */}
          <div className="text-center">
            <a
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;