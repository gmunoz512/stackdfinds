/** Exact Tailwind v3 shades, renamed as theme tokens. */
const palette = {
  brand: {
    DEFAULT: "hsl(var(--brand) / <alpha-value>)",
    "light": "hsl(var(--brand-light) / <alpha-value>)",
    "strong": "hsl(var(--brand-strong) / <alpha-value>)",
    "tint": "hsl(var(--brand-tint) / <alpha-value>)",
    "abyss": "hsl(var(--brand-abyss) / <alpha-value>)",
    "dark": "hsl(var(--brand-dark) / <alpha-value>)",
    "muted": "hsl(var(--brand-muted) / <alpha-value>)",
  },
  iris: {
    "strong": "hsl(var(--iris-strong) / <alpha-value>)",
    DEFAULT: "hsl(var(--iris) / <alpha-value>)",
    "deep": "hsl(var(--iris-deep) / <alpha-value>)",
  },
  paper: "hsl(var(--paper) / <alpha-value>)",
  success: {
    DEFAULT: "hsl(var(--success) / <alpha-value>)",
    "strong": "hsl(var(--success-strong) / <alpha-value>)",
    "deep": "hsl(var(--success-deep) / <alpha-value>)",
    "light": "hsl(var(--success-light) / <alpha-value>)",
    "tint": "hsl(var(--success-tint) / <alpha-value>)",
    "abyss": "hsl(var(--success-abyss) / <alpha-value>)",
    "dark": "hsl(var(--success-dark) / <alpha-value>)",
    "muted": "hsl(var(--success-muted) / <alpha-value>)",
  },
  ink: "hsl(var(--ink) / <alpha-value>)",
  hot: {
    DEFAULT: "hsl(var(--hot) / <alpha-value>)",
    "light": "hsl(var(--hot-light) / <alpha-value>)",
    "strong": "hsl(var(--hot-strong) / <alpha-value>)",
  },
  rating: {
    "light": "hsl(var(--rating-light) / <alpha-value>)",
    DEFAULT: "hsl(var(--rating) / <alpha-value>)",
    "strong": "hsl(var(--rating-strong) / <alpha-value>)",
  },
  rose: {
    DEFAULT: "hsl(var(--rose) / <alpha-value>)",
    "strong": "hsl(var(--rose-strong) / <alpha-value>)",
  },
  warning: {
    DEFAULT: "hsl(var(--warning) / <alpha-value>)",
    "strong": "hsl(var(--warning-strong) / <alpha-value>)",
    "light": "hsl(var(--warning-light) / <alpha-value>)",
    "abyss": "hsl(var(--warning-abyss) / <alpha-value>)",
    "tint": "hsl(var(--warning-tint) / <alpha-value>)",
    "dark": "hsl(var(--warning-dark) / <alpha-value>)",
    "muted": "hsl(var(--warning-muted) / <alpha-value>)",
  },
  info: {
    DEFAULT: "hsl(var(--info) / <alpha-value>)",
    "strong": "hsl(var(--info-strong) / <alpha-value>)",
    "light": "hsl(var(--info-light) / <alpha-value>)",
    "wash": "hsl(var(--info-wash) / <alpha-value>)",
    "abyss": "hsl(var(--info-abyss) / <alpha-value>)",
    "deep": "hsl(var(--info-deep) / <alpha-value>)",
  },
  mint: {
    "light": "hsl(var(--mint-light) / <alpha-value>)",
    "strong": "hsl(var(--mint-strong) / <alpha-value>)",
    DEFAULT: "hsl(var(--mint) / <alpha-value>)",
  },
  danger: {
    DEFAULT: "hsl(var(--danger) / <alpha-value>)",
    "soft": "hsl(var(--danger-soft) / <alpha-value>)",
    "wash": "hsl(var(--danger-wash) / <alpha-value>)",
    "light": "hsl(var(--danger-light) / <alpha-value>)",
    "strong": "hsl(var(--danger-strong) / <alpha-value>)",
    "dark": "hsl(var(--danger-dark) / <alpha-value>)",
    "deep": "hsl(var(--danger-deep) / <alpha-value>)",
    "muted": "hsl(var(--danger-muted) / <alpha-value>)",
    "tint": "hsl(var(--danger-tint) / <alpha-value>)",
    "abyss": "hsl(var(--danger-abyss) / <alpha-value>)",
  },
  slate: {
    "tint": "hsl(var(--slate-tint) / <alpha-value>)",
    "inkish": "hsl(var(--slate-inkish) / <alpha-value>)",
  },
  lagoon: {
    "wash": "hsl(var(--lagoon-wash) / <alpha-value>)",
    "abyss": "hsl(var(--lagoon-abyss) / <alpha-value>)",
    DEFAULT: "hsl(var(--lagoon) / <alpha-value>)",
    "strong": "hsl(var(--lagoon-strong) / <alpha-value>)",
  },
  indigo: {
    DEFAULT: "hsl(var(--indigo) / <alpha-value>)",
    "strong": "hsl(var(--indigo-strong) / <alpha-value>)",
  },
  neutral: {
    "tint": "hsl(var(--neutral-tint) / <alpha-value>)",
    "strong": "hsl(var(--neutral-strong) / <alpha-value>)",
    DEFAULT: "hsl(var(--neutral) / <alpha-value>)",
    "dark": "hsl(var(--neutral-dark) / <alpha-value>)",
    "muted": "hsl(var(--neutral-muted) / <alpha-value>)",
  },
  grape: {
    "strong": "hsl(var(--grape-strong) / <alpha-value>)",
    DEFAULT: "hsl(var(--grape) / <alpha-value>)",
    "deep": "hsl(var(--grape-deep) / <alpha-value>)",
  },
  cyan: "hsl(var(--cyan) / <alpha-value>)",
  ash: {
    "abyss": "hsl(var(--ash-abyss) / <alpha-value>)",
    "wash": "hsl(var(--ash-wash) / <alpha-value>)",
  },
  zinc: {
    "light": "hsl(var(--zinc-light) / <alpha-value>)",
    "dark": "hsl(var(--zinc-dark) / <alpha-value>)",
  },
  surface: {
    "raised": "hsl(var(--surface-raised) / <alpha-value>)",
  },
} as const;

export default palette;
