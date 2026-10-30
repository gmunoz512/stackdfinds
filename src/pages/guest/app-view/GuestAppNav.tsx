import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heart, User, Sparkles } from "lucide-react";
import type { UserRole } from "@/types";

export function GuestAppNav({
  favorites, profileRoute, role, location
}: {
  favorites: number[];
  profileRoute: string;
  role: UserRole | null;
  location: { pathname: string };
}) {
  return (
    <>
        {/* Bottom nav on mobile; top desktop nav on lg+ */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 pb-safe lg:fixed lg:bottom-auto lg:top-0 lg:pb-0 lg:z-[60]">
          {/* Glass effect container */}
          <div className="relative">
            {/* Frosted glass background */}
            <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-paper/10 dark:border-paper/5 lg:border-t-0 lg:border-b" />
            
            {/* Gradient glow effect */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:top-auto lg:-bottom-px" />
            
            {/* Content */}
            <div className="relative flex justify-around items-center h-14 lg:max-w-6xl lg:mx-auto lg:justify-center lg:gap-2">
              {[
                { to: "/wishlists", icon: Heart, label: "Wishlists", badge: favorites.length },
                { to: "/trip-planner", icon: Sparkles, label: "AI" },
                { to: profileRoute, icon: User, label: "Profile", roleBadge: role },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-300",
                      "active:scale-90 touch-manipulation lg:flex-none lg:flex-row lg:gap-2 lg:px-8",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        layoutId="appNavIndicator"
                        className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary lg:top-auto lg:bottom-1"
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
                      
                      {/* Favorites badge */}
                      {item.badge !== undefined && item.badge > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-2 h-3.5 w-3.5 bg-gradient-to-r from-brand to-hot rounded-full text-[7px] text-paper font-bold flex items-center justify-center"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </motion.div>
                      )}
                      
                      {/* Role badge */}
                      {item.roleBadge && (
                        <span className={cn(
                          "absolute -bottom-0.5 -right-1.5 text-[6px] font-bold px-0.5 rounded-full",
                          item.roleBadge === 'host' ? "bg-brand text-paper" :
                          item.roleBadge === 'vendor' ? "bg-iris text-paper" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {item.roleBadge === 'host' ? 'H' : item.roleBadge === 'vendor' ? 'V' : 'U'}
                        </span>
                      )}
                    </motion.div>
                    
                    <span className={cn(
                      "text-[9px] transition-all duration-200 lg:text-sm",
                      isActive ? "font-semibold" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
    </>
  );
}
