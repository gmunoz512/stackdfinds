import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className="flex items-center space-x-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-2 border border-border/50 shadow-md">
      <Sun className="h-4 w-4 text-foreground" />
      <Switch
        id="theme-toggle"
        checked={isDarkMode}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="h-4 w-4 text-foreground" />
      <Label htmlFor="theme-toggle" className="sr-only">
        Toggle dark mode
      </Label>
    </div>
  );
}
