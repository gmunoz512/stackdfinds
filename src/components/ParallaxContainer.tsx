import { useRef, useEffect, useState, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface ParallaxContainerProps {
  children: ReactNode;
  className?: string;
  speed?: number; // -1 to 1 (negative = slower, positive = faster)
  direction?: "up" | "down";
  offset?: [string, string]; // viewport offset for scroll tracking
}

export const ParallaxContainer = ({
  children,
  className = "",
  speed = 0.3,
  direction = "up",
  offset = ["start end", "end start"],
}: ParallaxContainerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const multiplier = direction === "up" ? -1 : 1;
  const yRange = useTransform(
    scrollYProgress,
    [0, 1],
    [0, 100 * speed * multiplier]
  );
  const y = useSpring(yRange, { stiffness: 100, damping: 30 });

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

interface ParallaxImageProps {
  src: string;
  alt?: string;
  className?: string;
  speed?: number;
  scale?: boolean;
  overlay?: boolean;
  overlayClassName?: string;
}

export const ParallaxImage = ({
  src,
  alt = "",
  className = "",
  speed = 0.2,
  scale = true,
  overlay = false,
  overlayClassName = "bg-ink/30",
}: ParallaxImageProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  
  const scaleValue = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1.05, 1.1]);
  const smoothScale = useSpring(scaleValue, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={{
          y: smoothY,
          scale: scale ? smoothScale : 1,
        }}
        className="w-full h-full"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </motion.div>
      {overlay && (
        <div className={`absolute inset-0 ${overlayClassName}`} />
      )}
    </div>
  );
};

interface ParallaxCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  hoverLift?: boolean;
}

export const ParallaxCard = ({
  children,
  className = "",
  index = 0,
  hoverLift = true,
}: ParallaxCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hoverLift ? { y: -8, transition: { duration: 0.2 } } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ParallaxHeroProps {
  backgroundImage: string;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  minHeight?: string;
}

export const ParallaxHero = ({
  backgroundImage,
  children,
  className = "",
  overlayClassName = "bg-background/60 dark:bg-background/70",
  minHeight = "100vh",
}: ParallaxHeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Parallax Background */}
      <motion.div
        style={{
          y: smoothY,
          scale: smoothScale,
        }}
        className="absolute inset-0 -top-[10%] -bottom-[10%]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            filter: "blur(2px)",
          }}
        />
      </motion.div>

      {/* Overlay */}
      <motion.div
        style={{ opacity: smoothOpacity }}
        className={`absolute inset-0 ${overlayClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
};
