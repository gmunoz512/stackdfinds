import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInPromptProps {
  title?: string;
  description?: string;
}

/**
 * Consistent signed-out screen for account pages.
 * Shows a friendly prompt instead of silently redirecting.
 */
export const SignInPrompt = ({
  title = "Sign in to continue",
  description = "You need an account to view this page.",
}: SignInPromptProps) => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/appview");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] md:max-w-xl lg:max-w-2xl mx-auto px-4 py-6 space-y-6">
        <button
          onClick={goBack}
          aria-label="Go back"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="text-center space-y-4 py-12">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <LogIn className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button onClick={() => navigate("/auth")} variant="gradient">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignInPrompt;
