import { JoinRoleSelection } from '@/components/destination/JoinRoleSelection';
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startOAuth } from "@/lib/oauth";
import { Apple } from "lucide-react";
import { authSchema, type AuthFormData } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuthContext } from "@/contexts/AuthContext";
import { PasswordResetOTPDialog } from "@/components/PasswordResetOTPDialog";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get("role") as "host" | "vendor" | "user" | null;
  const returnTo = searchParams.get("returnTo");
  const stateReturnTo = typeof location.state?.returnTo === "string" ? location.state.returnTo : null;
  const effectiveReturnTo = returnTo || stateReturnTo;
  const mode = searchParams.get("mode");
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(mode !== "signin");
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
        if (effectiveReturnTo) {
          navigate(effectiveReturnTo, { replace: true, state: null });
          return;
        }
        
        if (userRole === "host") {
          navigate("/host/dashboard", { replace: true });
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
              navigate("/vendor/create-profile", { replace: true });
            }
          }
        } else if (userRole === "user") {
          navigate("/appview", { replace: true });
        }
      }
    };
    
    handleRedirect();
  }, [isAuthenticated, isLoading, userRole, navigate, effectiveReturnTo]);

  // Handle auth callback and save a pending role after OAuth sign-in.
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
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("role", selectedRole);
    nextParams.delete("mode");
    setSearchParams(nextParams);
  };

  const getRedirectPath = (selectedRole: string | null, hasVendorProfile: boolean = false) => {
    // Check for returnTo parameter first
    if (effectiveReturnTo) return effectiveReturnTo;
    if (selectedRole === "host") return "/host/dashboard";
    if (selectedRole === "vendor") return hasVendorProfile ? "/vendor/dashboard" : "/vendor/create-profile";
    return "/appview";
  };

  // Show role selection if no role is specified and user is signing up
  if (!role && isSignUp) {
    return <JoinRoleSelection onSelect={handleRoleSelect} onSignIn={() => setIsSignUp(false)} loading={loading}/>;
  }

  const handleAuth = async (data: AuthFormData) => {
    setLoading(true);
    
    try {
      if (isSignUp) {
        if (role) localStorage.setItem("pending_role", role);
        const redirectPath = getRedirectPath(role);
        const confirmationParams = new URLSearchParams({
          role: role || "user",
        });
        if (effectiveReturnTo) confirmationParams.set("returnTo", effectiveReturnTo);
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?${confirmationParams.toString()}`,
          },
        });
        
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
        
        // Confirmed-email projects return a user without a session. Wait for the
        // confirmation link before assigning the role or redirecting.
        if (!signUpData.session) {
          toast({
            title: "Check your email",
            description: "Confirm your email address to finish creating your account.",
          });
          setLoading(false);
          return;
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
          if (roleAssigned) localStorage.removeItem("pending_role");
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
      setLoading(false);
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
      await startOAuth("google", role);
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
      await startOAuth("apple", role);
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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-6">
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
                            autoComplete="email"
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
                            autoComplete={isSignUp ? "new-password" : "current-password"}
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
                  aria-label="Continue with Google"
                  title="Continue with Google"
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
                  aria-label="Continue with Apple"
                  title="Continue with Apple"
                >
                  <Apple className="h-5 w-5" />
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
                  const nextParams = new URLSearchParams();
                  if (effectiveReturnTo) nextParams.set("returnTo", effectiveReturnTo);
                  setSearchParams(nextParams);
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
                onClick={() => {
                  const nextParams = new URLSearchParams();
                  if (effectiveReturnTo) nextParams.set("returnTo", effectiveReturnTo);
                  setSearchParams(nextParams);
                }}
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
