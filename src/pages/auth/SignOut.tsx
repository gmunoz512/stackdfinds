import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSignup } from "@/contexts/SignupContext";
import { useToast } from "@/hooks/use-toast";

const SignOut = () => {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const { clearSignupData } = useSignup();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    clearSignupData();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
          <LogOut className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Sign Out?</h1>
          <p className="text-muted-foreground">
            Are you sure you want to sign out of your account?
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/appview')}
          >
            Cancel
          </Button>
          <Button 
            variant="gradient" 
            className="flex-1"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SignOut;
