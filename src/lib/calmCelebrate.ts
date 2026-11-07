import confetti from "canvas-confetti";

/** One short pine-and-cream burst. Skipped when the visitor asks for less motion. */
export function calmCelebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({
    particleCount: 22,
    spread: 48,
    startVelocity: 16,
    origin: { y: 0.28 },
    colors: ["#153d30", "#d5e4d2", "#f8f3e7", "#c4a574"],
    disableForReducedMotion: true,
    ticks: 80,
  });
}
