import { Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import Logo3DSpin from "@/components/Logo3DSpin";
import hero from "@/assets/hero-beach.jpg";
import snorkeling from "@/assets/experiences/snorkeling.jpg";
import balloon from "@/assets/experiences/balloon.jpg";
import cooking from "@/assets/experiences/cooking.jpg";
import yoga from "@/assets/experiences/yoga.jpg";
import arca from "@/assets/restaurants/arca-tulum.jpg";
import kayaking from "@/assets/experiences/kayaking.jpg";

// Real categories from the catalog — each tile deep-links into the app.
const tiles = [
  { img: snorkeling, label: "Cenotes & reef", to: "/appview" },
  { img: arca, label: "Jungle dinners", to: "/restaurants" },
  { img: balloon, label: "Sunrise flights", to: "/experiences" },
  { img: yoga, label: "Wellness", to: "/experiences" },
  { img: cooking, label: "Cook with locals", to: "/experiences" },
  { img: kayaking, label: "Lagoon paddles", to: "/experiences" },
];

const SplashPage = () => (
  <div className="min-h-screen bg-background text-foreground">
    {/* Hero: the beach photo carries the page, logo sits on top of it */}
    <section className="relative isolate min-h-[92svh] flex flex-col overflow-hidden">
      <img
        src={hero}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover scale-105 motion-safe:animate-[splashZoom_18s_ease-out_forwards]"
        fetchPriority="high"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,10,10,.55)_0%,rgba(10,10,10,.25)_40%,hsl(var(--background))_100%)]" />

      <header className="flex items-center justify-between px-5 md:px-10 pt-5">
        <span className="font-['Archivo_Black'] text-xl tracking-tight text-white">stackd</span>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/for-hosts" className="hidden sm:inline px-3 py-2 text-white/80 hover:text-white">For hosts</Link>
          <Link to="/auth" className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-white hover:bg-white/20 transition-colors">
            Sign in
          </Link>
        </nav>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <Logo3DSpin className="mb-4" desktopSize={170} mobileSize={120} />
        <h1 className="font-['Archivo_Black'] text-white text-[2.6rem] leading-[0.95] md:text-7xl max-w-3xl drop-shadow-[0_4px_30px_rgba(0,0,0,.5)]">
          Tulum, stacked.
        </h1>
        <p className="mt-4 max-w-md text-white/85 text-base md:text-lg">
          Tours, tables and local hosts worth your time. Browse free, book in a few taps.
        </p>

        <Link
          to="/appview"
          className="group mt-8 w-full max-w-md flex items-center gap-3 rounded-full bg-black/55 backdrop-blur-xl border border-white/15 pl-5 pr-1.5 py-1.5 shadow-[0_10px_40px_rgba(168,85,247,.25)] hover:border-white/30 transition-colors"
        >
          <MapPin className="h-4 w-4 text-orange-400 shrink-0" aria-hidden />
          <span className="flex-1 text-left text-white/70 text-sm">What do you want to do in Tulum?</span>
          <span className="grid place-items-center h-11 w-11 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 shadow-[0_4px_20px_rgba(168,85,247,.5)] group-hover:scale-105 transition-transform">
            <Search className="h-4 w-4 text-white" aria-hidden />
          </span>
        </Link>
        <Link to="/auth" className="mt-4 text-sm text-white/75 hover:text-white underline-offset-4 hover:underline">
          New here? Create an account
        </Link>
      </div>
    </section>

    {/* Photo rail: real inventory, not feature bullets */}
    <section className="relative -mt-10 pb-14">
      <div className="px-5 md:px-10 mb-4 flex items-end justify-between max-w-7xl mx-auto">
        <h2 className="font-['Archivo_Black'] text-2xl md:text-3xl">Start with a mood</h2>
        <Link to="/appview" className="text-sm text-muted-foreground hover:text-foreground">See everything</Link>
      </div>
      <div className="max-w-7xl mx-auto"><div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-5 md:scroll-px-10 pb-2 [scrollbar-width:none] before:content-[''] before:shrink-0 before:w-2 md:before:w-7 after:content-[''] after:shrink-0 after:w-2 md:after:w-7">
        {tiles.map((t, i) => (
          <Link
            key={t.label}
            to={t.to}
            className={`relative shrink-0 snap-start overflow-hidden rounded-[22px] group ${i === 0 ? "w-[68vw] sm:w-80 md:w-96" : "w-[44vw] sm:w-56"} aspect-[3/4]`}
          >
            <img src={t.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute left-4 bottom-4 right-4 font-semibold text-white text-base leading-tight">{t.label}</span>
          </Link>
        ))}
      </div></div>
    </section>

    <footer className="border-t border-border px-5 md:px-10 py-8 max-w-7xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-muted-foreground">
      <p>Run tours or a kitchen in Tulum? <Link to="/for-vendors" className="text-foreground underline underline-offset-4">List with stackd</Link></p>
      <div className="flex gap-5">
        <Link to="/for-hosts" className="hover:text-foreground">For hosts</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
      </div>
    </footer>
  </div>
);

export default SplashPage;
