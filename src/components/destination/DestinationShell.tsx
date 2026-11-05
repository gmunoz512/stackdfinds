import { useContext, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Compass,
  Heart,
  Sparkles,
  User,
  Utensils,
  Waves,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
} from "lucide-react";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { useTheme } from "next-themes";
import { useAuthContext } from "@/contexts/AuthContext";
import coast from "@/assets/tulum-coast.png";
import "./destination.css";

import { DestinationShellContext } from "./DestinationShellContext";

export function TulumSketch() {
  return (
    <svg
      className="tulum-mascot"
      viewBox="0 0 125 86"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="palm-sway">
        <path
          pathLength="1"
          d="M24 68Q32 42 36 18M29 67Q37 43 39 18M37 18Q24 5 14 13Q27 10 37 18M37 18Q48 4 59 12Q47 11 37 18M37 18Q55 14 59 28Q49 20 37 18M37 18Q22 19 17 32Q26 23 37 18M37 18Q31 6 35 3Q42 10 37 18"
        />
      </g>
      {/* Clean lounge chair frame with a separate seat and supports. */}
      <path pathLength="1" d="M50 42L62 67H101L114 56M62 67L57 79M96 67L103 79M54 79H64M99 79H109" />
      <path pathLength="1" d="M62 56Q81 59 101 56M67 67L98 77M98 67L67 77" />
      {/* Simple reclining figure with clear head, torso, arm and bent legs. */}
      <circle pathLength="1" cx="62" cy="34" r="4.5" />
      <path pathLength="1" strokeWidth="2.5" d="M63 39Q69 47 78 53Q88 56 96 50L104 43M72 45Q78 46 83 51M78 53Q88 54 98 57" />
      <path pathLength="1" className="sea-wave" d="M105 72q7-4 13 0t12 0M15 78q17-4 33 0" />
    </svg>
  );
}
function BackgroundArt() {
  return (
    <>
      <svg
        className="destination-art"
        viewBox="0 0 1440 1100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="sand-wash">
            <stop stopColor="#a6baa2" stopOpacity=".36" />
            <stop offset="1" stopColor="#a6baa2" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="water-wash">
            <stop stopColor="#76b9af" stopOpacity=".3" />
            <stop offset="1" stopColor="#76b9af" stopOpacity="0" />
          </radialGradient>
          <g id="palm-tree" fill="none" stroke="#667a5c" strokeWidth="1.1">
            <path
              pathLength="1"
              d="M85 590Q130 350 100 160M94 590Q142 350 104 160M100 160Q18 65 0 155Q50 110 100 160M100 160Q172 65 218 145Q160 114 100 160M100 160Q191 142 220 215Q156 164 100 160M100 160Q21 139 0 228Q46 168 100 160M100 160Q124 67 161 54Q144 114 100 160"
            />
            {Array.from({ length: 9 }, (_, i) => (
              <path
                pathLength="1"
                key={i}
                d={`M${16 + i * 9} ${143 - i * 2}l-8 29m${91 + i * 9} ${146 + i * 2}l18 22M${99 + i * 3} ${195 + i * 38}l16 -3`}
              />
            ))}
          </g>
        </defs>
        <ellipse fill="url(#sand-wash)" cx="55" cy="420" rx="230" ry="490" />
        <ellipse fill="url(#water-wash)" cx="1340" cy="800" rx="330" ry="380" />
        <g className="scenic-lines" opacity=".55">
          <use href="#palm-tree" x="-20" y="-5" />
          <use
            href="#palm-tree"
            transform="translate(1440 270) scale(-.85 .85)"
          />
          <g fill="none" stroke="#7c9e94" strokeWidth="1.1">
            <path
              pathLength="1"
              d="M0 760Q95 690 185 748T430 770M0 802Q150 748 300 790T580 812M1020 925Q1220 850 1440 910M890 965Q1190 900 1440 960M0 990Q180 920 355 980"
            />
            <path
              pathLength="1"
              d="M0 650q90-40 155-14l80 85M1280 780l42-65 118-8M1310 751v-60h100v45m-110-45h120m-99 0v-20h74v20"
            />
          </g>
        </g>
      </svg>
      <svg
        className="destination-art destination-art-mobile"
        viewBox="0 0 430 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <ellipse fill="url(#sand-wash)" cx="10" cy="230" rx="120" ry="300" />
        <ellipse fill="url(#water-wash)" cx="420" cy="650" rx="150" ry="300" />
        <g opacity=".6">
          <use href="#palm-tree" transform="translate(-8 -75) scale(.6 .7)" />
          <use href="#palm-tree" transform="translate(450 300) scale(-.6 .7)" />
          <g fill="none" stroke="#7c9e94" strokeWidth="1">
            <path
              pathLength="1"
              d="M0 680q70-30 140 0t150 0 140 0M0 710q80-30 160 0t160 0 110 0M0 820q90-25 180 0t180 0 70 0"
            />
          </g>
        </g>
      </svg>
    </>
  );
}
export function DestinationShell({
  children,
  className = "",
  footer = true,
}: {
  children: ReactNode;
  className?: string;
  footer?: boolean;
}) {
  const { items: wishlistItems } = useLocalWishlist();
  const { resolvedTheme, setTheme } = useTheme();
  const isNight = resolvedTheme === "dark";
  const insideShell = useContext(DestinationShellContext);
  const { pathname } = useLocation();
  const { isAuthenticated, role } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const home =
    pathname === "/" || pathname === "/appview" || pathname === "/explore";
  const join = pathname.startsWith("/auth") || pathname === "/signin";
  const profile = !isAuthenticated
    ? "/auth"
    : role === "host"
      ? "/host/dashboard"
      : role === "vendor"
        ? "/vendor/dashboard"
        : "/profile";

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnScroll = () => setMenuOpen(false);
    const closeOnOutsideTap = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest(".reference-menu, .menu-toggle")) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("scroll", closeOnScroll, { passive: true });
    document.addEventListener("pointerdown", closeOnOutsideTap);
    document.addEventListener("touchmove", closeOnScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", closeOnScroll);
      document.removeEventListener("pointerdown", closeOnOutsideTap);
      document.removeEventListener("touchmove", closeOnScroll);
    };
  }, [menuOpen]);

  if (insideShell) return <>{children}</>;
  return (
    <DestinationShellContext.Provider value={true}>
      <div
        className={`destination-shell destination-intro ${join ? "destination-join" : ""} ${className}`}
      >
        <BackgroundArt />
        <div className="destination-paper">
          <svg
            className="page-border"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="1"
              width="calc(100% - 2px)"
              height="calc(100% - 2px)"
              rx="24"
              pathLength="1"
            />
          </svg>
          <header
            className={`destination-header ${!home && !join ? "inner-header" : ""}`}
          >
            {!home && !join && (
              <Link
                to="/appview"
                aria-label="Back to Tulum home"
                className="header-back"
              >
                <ArrowLeft size={20} />
              </Link>
            )}
            <Link
              to="/appview"
              className="destination-brand"
                aria-label="stackd home"
            >
              <span>stackd</span>
              <TulumSketch />
            </Link>
                <button type="button" className="night-mode-toggle" role="switch" aria-checked={isNight} aria-label="Night mode" title={isNight ? "Switch to day mode" : "Switch to night mode"} onClick={() => setTheme(isNight ? "light" : "dark")}>
                  {isNight ? <Sun size={19} /> : <Moon size={19} />}
                  <span className="night-mode-track"><span /></span>
                </button>
            {!join && (
              <>
                <button
                  className="menu-toggle"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            )}
            {menuOpen && (
              <nav className="reference-menu" aria-label="App menu">
                {[
                  { to: "/for-travelers", label: "For travelers" },
                  { to: "/for-hosts", label: "For hosts" },
                  { to: "/for-vendors", label: "For vendors" },
                  { to: "/about", label: "About" },
                  { to: "/faq", label: "FAQ" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </nav>
            )}
          </header>
          {!join && <nav className="tulum-category-tabs" aria-label="Tulum catalogs"><NavLink to="/restaurants"><Utensils size={16}/>Restaurants</NavLink><NavLink to="/experiences"><Waves size={17}/>Experiences</NavLink></nav>}
          <main className="destination-main">{children}</main>
          {!join && (
            <nav
              className="destination-mobile-nav"
              aria-label="Mobile navigation"
            >
              <NavLink
                to="/appview"
                className={home ? "active" : ""}
              >
                <Compass />
                <span>Home</span>
              </NavLink>
              <NavLink to="/trip-planner">
                <Sparkles />
                <span>Plan</span>
              </NavLink>
              <NavLink to="/wishlists">
                <span className="footer-wishlist-icon"><Heart />{wishlistItems.length > 0 && <span className="footer-wishlist-count" aria-hidden="true">{wishlistItems.length}</span>}</span>
                <span>My stackd<span className="sr-only">, {wishlistItems.length} saved favorites</span></span>
              </NavLink>
              <Link to={profile}>
                <User />
                <span>Account</span>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </DestinationShellContext.Provider>
  );
}
export function DestinationHero({
  planner = false,
  children,
}: {
  planner?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`destination-hero ${planner ? "planner-hero" : ""}`}>
      <img
        className="hero-coast"
        src={coast}
        alt="Turquoise Caribbean water and the coastal ruins of Tulum"
        fetchPriority="high"
      />
      <div className="hero-copy">
        <span className="destination-eyebrow">TULUM, MÉXICO</span>
        <h1>
          {planner ? (
            <>
              Your Tulum,
              <br />
              your way.
            </>
          ) : (
            <>
              Your Tulum
              <br />
              starts here.
            </>
          )}
        </h1>
        <p>
          {planner
            ? "Tell us what you love. Let’s plan your trip."
            : "Local favorites. Your kind of trip."}
        </p>
        {children}
      </div>
    </section>
  );
}
