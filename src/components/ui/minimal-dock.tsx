'use client'
import React, { useState } from 'react';
import { Search, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
}

const dockItems: DockItem[] = [
  { id: 'search', icon: <Search size={18} />, label: 'Explore', href: '/appview' },
  { id: 'favorites', icon: <Heart size={18} />, label: 'Wishlists', href: '/wishlists' },
];

interface DockItemProps {
  item: DockItem;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

const DockItemComponent: React.FC<DockItemProps> = ({ item, isHovered, onHover }) => {
  const content = (
    <div
      className={`
        relative flex items-center justify-center
        w-8 h-8 rounded-full
        transition-all duration-300 ease-out
        cursor-pointer
        ${isHovered 
          ? 'scale-110 bg-muted' 
          : 'hover:scale-105 hover:bg-muted/50'
        }
      `}
    >
      <div className="text-foreground transition-all duration-300">
        {item.icon}
      </div>
    </div>
  );

  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {item.href ? (
        <Link to={item.href}>{content}</Link>
      ) : (
        content
      )}
      
      {/* Tooltip */}
      <div className={`
        absolute -top-10 left-1/2 transform -translate-x-1/2
        px-2.5 py-1 rounded-md
        bg-popover backdrop-blur
        text-popover-foreground text-xs font-normal
        border border-border
        transition-all duration-200
        pointer-events-none
        whitespace-nowrap
        ${isHovered 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-1'
        }
        shadow-sm
        z-50
      `}>
        {item.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-popover rotate-45 border-r border-b border-border"></div>
        </div>
      </div>
    </div>
  );
};

const MinimalDock: React.FC = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Dock Container */}
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-md">
        {dockItems.map((item) => (
          <DockItemComponent
            key={item.id}
            item={item}
            isHovered={hoveredItem === item.id}
            onHover={setHoveredItem}
          />
        ))}
      </div>
    </div>
  );
};

export default MinimalDock;
