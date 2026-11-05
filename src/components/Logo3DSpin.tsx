import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import stackdLogo from "@/assets/stackd-logo-new.png";

interface Logo3DSpinProps {
  className?: string;
  desktopSize?: number;
  mobileSize?: number;
  alt?: string;
}

const Logo3DSpin = ({
  className = "",
  desktopSize = 220,
  mobileSize = 160,
  alt = "stackd logo",
}: Logo3DSpinProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  const size = isMobile ? mobileSize : desktopSize;

  // Static render for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src={stackdLogo}
          alt={alt}
          width={size}
          height={size}
          className="drop-shadow-2xl"
        />
      </div>
    );
  }

  // Animation configuration based on device - floating only, no spin
  const config = isMobile
    ? {
        scale: [1, 1.02, 1],
        y: [0, -6, 0],
        duration: 3.5,
      }
    : {
        scale: [1, 1.03, 1],
        y: [0, -10, 0],
        duration: 3,
      };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.img
        src={stackdLogo}
        alt={alt}
        width={size}
        height={size}
        className="drop-shadow-2xl"
        style={{
          willChange: "transform",
        }}
        animate={
          isHovering && !isMobile
            ? {
                scale: 1.05,
                y: -12,
              }
            : {
                scale: config.scale,
                y: config.y,
              }
        }
        transition={
          isHovering && !isMobile
            ? {
                duration: 0.3,
                ease: "easeOut",
              }
            : {
                scale: {
                  duration: config.duration,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
                y: {
                  duration: config.duration,
                  ease: "easeInOut",
                  repeat: Infinity,
                },
              }
        }
        onMouseEnter={() => !isMobile && setIsHovering(true)}
        onMouseLeave={() => !isMobile && setIsHovering(false)}
      />
      {/* Subtle shadow that moves with float */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: size * 0.6,
          height: size * 0.1,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
          filter: "blur(10px)",
          bottom: isMobile ? -8 : -15,
        }}
        animate={
          isHovering && !isMobile
            ? { scale: 1.15, opacity: 0.25 }
            : { scale: [1, 0.95, 1], opacity: [0.3, 0.35, 0.3] }
        }
        transition={{
          duration: config.duration,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export default Logo3DSpin;
