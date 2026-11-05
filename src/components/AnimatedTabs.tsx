import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  name: string;
  icon?: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "pills" | "underline" | "gradient";
}

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "gradient",
}: AnimatedTabsProps) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeTabEl = tabsRef.current[activeIndex];
    
    if (activeTabEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();
      
      setIndicatorStyle({
        left: tabRect.left - containerRect.left + containerRef.current.scrollLeft,
        width: tabRect.width,
      });
    }
  }, [activeTab, tabs]);

  // Scroll active tab into view
  useEffect(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
    const activeTabEl = tabsRef.current[activeIndex];
    
    if (activeTabEl) {
      activeTabEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTab, tabs]);

  if (variant === "underline") {
    return (
      <div className={cn("relative", className)}>
        <div
          ref={containerRef}
          className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => (tabsRef.current[index] = el)}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon && <span className="text-base">{tab.icon}</span>}
              <span>{tab.name}</span>
            </button>
          ))}
          
          {/* Animated Underline */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-brand to-iris-strong rounded-full"
            initial={false}
            animate={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        </div>
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative flex gap-1 overflow-x-auto pb-2 scrollbar-hide p-1 bg-muted/50 rounded-full",
          className
        )}
      >
        {/* Animated Pill Background */}
        <motion.div
          className="absolute top-1 bottom-1 bg-background rounded-full shadow-sm border border-border/50"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
        
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative z-10 flex items-center gap-1.5 px-4 py-2 whitespace-nowrap text-sm font-medium transition-colors rounded-full",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <span className="text-base">{tab.icon}</span>}
            <span>{tab.name}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default: gradient variant
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex gap-2 overflow-x-auto pb-2 scrollbar-hide",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2 rounded-full border whitespace-nowrap text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
              isActive
                ? "text-paper border-transparent shadow-lg"
                : "bg-card border-border/50 hover:border-iris/30 hover:shadow-md"
            )}
          >
            {/* Animated Gradient Background */}
            {isActive && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-gradient-to-r from-brand to-iris-strong rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
            
            <span className="relative z-10 text-base">{tab.icon}</span>
            <span className="relative z-10 font-medium">{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnimatedTabs;
