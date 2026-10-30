import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
  badgeContent?: React.ReactNode;
}

interface GlassBottomNavProps {
  items: NavItem[];
  maxWidth?: string;
}

const GlassBottomNav = ({ items, maxWidth = "max-w-[375px] md:max-w-3xl lg:max-w-5xl" }: GlassBottomNavProps) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Glass effect container */}
      <div className="relative">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-paper/10 dark:border-paper/5" />
        
        {/* Gradient glow effect */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Content */}
        <div className={cn("relative flex justify-around items-center h-16 mx-auto", maxWidth)}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300",
                  "active:scale-90 touch-manipulation",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  
                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 h-4 min-w-4 px-1 bg-gradient-to-r from-brand to-hot rounded-full text-[9px] text-paper font-bold flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.div>
                  )}
                  {item.badgeContent}
                </motion.div>
                
                <span className={cn(
                  "text-[10px] transition-all duration-200",
                  isActive ? "font-semibold" : "font-medium"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default GlassBottomNav;
