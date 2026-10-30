 import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { FaUtensils, FaStar, FaCamera, FaGlassCheers, FaLeaf } from 'react-icons/fa';

interface PhotoOption {
  title: string;
  description?: string;
  image: string;
}

interface InteractiveSelectorProps {
  photos: string[];
  titles?: string[];
  icons?: ReactNode[];
}

const defaultIcons = [
  <FaUtensils size={20} className="text-paper" />,
  <FaStar size={20} className="text-paper" />,
  <FaCamera size={20} className="text-paper" />,
  <FaGlassCheers size={20} className="text-paper" />,
  <FaLeaf size={20} className="text-paper" />,
];

const InteractiveSelector = ({ photos, titles, icons }: InteractiveSelectorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);
   const containerRef = useRef<HTMLDivElement>(null);
   const touchStartX = useRef<number>(0);
   const touchEndX = useRef<number>(0);
  
  const options: PhotoOption[] = photos.map((photo, index) => ({
    title: titles?.[index] || `Photo ${index + 1}`,
    image: photo,
  }));

  // When there are many photos (common on restaurants via Google), the fixed strip width
  // can crowd out the expanded photo. Make the inactive strips slimmer and give the
  // active image more flex so the first photo is clearly visible.
  const inactiveMinWidth = options.length > 8 ? 8 : options.length > 6 ? 10 : options.length > 4 ? 14 : 20;
  const activeFlexGrow = options.length > 6 ? 15 : 10;

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

   const handleTouchStart = (e: React.TouchEvent) => {
     touchStartX.current = e.touches[0].clientX;
   };
 
   const handleTouchMove = (e: React.TouchEvent) => {
     touchEndX.current = e.touches[0].clientX;
   };
 
   const handleTouchEnd = () => {
     const diff = touchStartX.current - touchEndX.current;
     const threshold = 50; // minimum swipe distance
 
     if (Math.abs(diff) > threshold) {
       if (diff > 0 && activeIndex < options.length - 1) {
         // Swipe left - go to next
         setActiveIndex(prev => prev + 1);
       } else if (diff < 0 && activeIndex > 0) {
         // Swipe right - go to previous
         setActiveIndex(prev => prev - 1);
       }
     }
     
     // Reset
     touchStartX.current = 0;
     touchEndX.current = 0;
   };
 
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    
    options.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions(prev => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [options.length]);

  if (photos.length === 0) return null;

  return (
    <div className="relative flex flex-col items-center justify-center py-4 bg-background">
      {/* Options Container */}
      <div 
         ref={containerRef}
        className="flex w-full max-w-[375px] h-[280px] mx-auto items-stretch overflow-hidden relative rounded-xl"
         style={{ minWidth: '300px', touchAction: 'pan-y' }}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
      >
        {options.map((option, index) => (
          <div
            key={index}
            className="relative flex flex-col justify-end overflow-hidden transition-all duration-700 ease-in-out cursor-pointer"
            style={{
              backgroundImage: `url('${option.image}')`,
              backgroundSize: activeIndex === index ? 'cover' : 'cover',
              backgroundPosition: 'center',
              backfaceVisibility: 'hidden',
              opacity: animatedOptions.includes(index) ? 1 : 0,
              transform: animatedOptions.includes(index) ? 'translateX(0)' : 'translateX(-60px)',
              minWidth: activeIndex === index ? 0 : inactiveMinWidth,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: activeIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              backgroundColor: 'hsl(var(--muted))',
              boxShadow: activeIndex === index 
                ? '0 20px 60px rgba(0,0,0,0.50)' 
                : '0 10px 30px rgba(0,0,0,0.30)',
              flex: activeIndex === index ? `${activeFlexGrow} 1 0%` : '1 1 0%',
              zIndex: activeIndex === index ? 10 : 1,
              willChange: 'flex-grow, box-shadow, background-size'
            }}
            onClick={() => handleOptionClick(index)}
          >
            {/* Shadow overlay */}
            <div 
              className="absolute left-0 right-0 pointer-events-none transition-all duration-700 ease-in-out"
              style={{
                bottom: activeIndex === index ? '0' : '-40px',
                height: '120px',
                background: activeIndex === index 
                  ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)' 
                  : 'transparent'
              }}
            />
            
            {/* Label with icon and info */}
            <div className="absolute left-0 right-0 bottom-3 flex items-center justify-start h-10 z-10 pointer-events-none px-3 gap-2 w-full">
              <div 
                className="min-w-[36px] max-w-[36px] h-[36px] flex items-center justify-center rounded-full backdrop-blur-sm shadow-md border border-paper/20 flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                {icons?.[index] || defaultIcons[index % defaultIcons.length]}
              </div>
              <div className="text-paper whitespace-pre relative overflow-hidden">
                <div 
                  className="font-semibold text-sm transition-all duration-700 ease-in-out drop-shadow-lg"
                  style={{
                    opacity: activeIndex === index ? 1 : 0,
                    transform: activeIndex === index ? 'translateX(0)' : 'translateX(25px)'
                  }}
                >
                  {option.title}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Photo indicator */}
      <div className="flex gap-1.5 mt-3">
        {options.map((_, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex === index 
                ? 'bg-primary w-6' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveSelector;
