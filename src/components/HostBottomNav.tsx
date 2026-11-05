import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const HostBottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { 
      name: "Dashboard", 
      path: "/host/dashboard", 
      icon: LayoutDashboard 
    },
    { 
      name: "Vendors", 
      path: "/host/vendors", 
      icon: Users 
    },
    { 
      name: "Profile", 
      path: "/host/profile", 
      icon: UserCircle 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Glass effect container */}
      <div className="relative">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-paper/10 dark:border-paper/5" />
        
        {/* Gradient glow effect */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        {/* Content */}
        <div className="relative flex justify-around items-center h-16 max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== "/host/dashboard" && location.pathname.startsWith(item.path));

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
                    layoutId="hostNavIndicator"
                    className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
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

export default HostBottomNav;
