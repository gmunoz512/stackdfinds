import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlurImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  blurAmount?: number;
  transitionDuration?: number;
  onLoad?: () => void;
}

export const BlurImage = ({
  src,
  alt,
  className,
  containerClassName,
  blurAmount = 20,
  transitionDuration = 0.6,
  onLoad,
}: BlurImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset state when src changes
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {/* Placeholder with blur effect */}
      <motion.div
        className="absolute inset-0 bg-muted"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: transitionDuration * 0.5 }}
      >
        {/* Shimmer effect while loading */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-paper/10 to-transparent animate-shimmer" />
      </motion.div>

      {/* Actual image with blur transition */}
      <motion.img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        initial={{ filter: `blur(${blurAmount}px)`, scale: 1.1 }}
        animate={{
          filter: isLoaded ? 'blur(0px)' : `blur(${blurAmount}px)`,
          scale: isLoaded ? 1 : 1.1,
        }}
        transition={{
          duration: transitionDuration,
          ease: [0.4, 0, 0.2, 1],
        }}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
};

// Progressive image that loads a tiny placeholder first
interface ProgressiveBlurImageProps extends BlurImageProps {
  placeholderSrc?: string;
}

export const ProgressiveBlurImage = ({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  transitionDuration = 0.8,
  onLoad,
}: ProgressiveBlurImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighResLoaded(true);
      onLoad?.();
    };
  }, [src, onLoad]);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <motion.img
        src={currentSrc || src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        initial={{ filter: 'blur(20px)', scale: 1.1 }}
        animate={{
          filter: isHighResLoaded ? 'blur(0px)' : 'blur(20px)',
          scale: isHighResLoaded ? 1 : 1.1,
        }}
        transition={{
          duration: transitionDuration,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </div>
  );
};

export default BlurImage;
