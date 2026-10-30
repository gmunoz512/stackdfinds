import React, { useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, Megaphone, Users, TrendingUp, Globe, Calendar, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

const ForVendors = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };
    setSize();

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 10000);

    const make = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        ctx.fillStyle = `rgba(250, 250, 250, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, 0.6, Math.random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  const features = [
    {
      icon: Megaphone,
      title: "Increased Visibility",
      description: "Get in front of travelers actively looking for local experiences."
    },
    {
      icon: Users,
      title: "Host Network Access",
      description: "Connect with Airbnb hosts who promote your services to guests."
    },
    {
      icon: TrendingUp,
      title: "Grow Your Bookings",
      description: "Tap into the vacation rental market with qualified leads."
    },
    {
      icon: Globe,
      title: "Reach More Tourists",
      description: "Access travelers from around the world visiting your area."
    },
    {
      icon: Calendar,
      title: "Easy Booking Management",
      description: "Manage all your bookings from host referrals in one dashboard."
    },
    {
      icon: Star,
      title: "Build Your Reputation",
      description: "Collect reviews and ratings to attract more bookings."
    }
  ];

  const steps = [
    { num: "01", title: "Create Your Profile", desc: "Sign up and showcase your business with photos and pricing." },
    { num: "02", title: "Set Commission Rate", desc: "Define the affiliate commission you'll offer hosts." },
    { num: "03", title: "Get Discovered", desc: "Local hosts browse and add you to their recommended list." },
    { num: "04", title: "Receive Bookings", desc: "Travelers book your experiences directly. Grow your business." }
  ];

  const businessTypes = [
    "Restaurants", "Tour Guides", "Adventure Sports", "Spa & Wellness",
    "Photography", "Cooking Classes", "Wine Tours", "Water Sports",
    "Hiking Tours", "Art Workshops", "Nightlife", "Transportation"
  ];

  return (
    <div className="minimal-page">
      <style>{`
        .minimal-page {
          --bg: hsl(var(--ash-abyss));
          --fg: hsl(var(--ash-wash));
          --muted: hsl(var(--zinc-light));
          --border: hsl(var(--zinc-dark));
          --card-bg: hsl(var(--surface-raised));
          
          min-height: 100vh;
          background: var(--bg);
          color: var(--fg);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        
        .particle-canvas {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.5;
          z-index: 0;
        }
        
        .page-content {
          position: relative;
          z-index: 1;
        }
        
        .minimal-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: hsl(var(--ash-abyss) / 0.9);
          backdrop-filter: blur(12px);
        }
        
        .back-btn {
          padding: 8px;
          border-radius: 8px;
          color: var(--muted);
          transition: all 0.2s;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .back-btn:hover {
          background: var(--card-bg);
          color: var(--fg);
        }
        
        .brand-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .brand-link img {
          filter: drop-shadow(0 4px 6px hsl(var(--ink) / 0.3));
        }
        .brand-text {
          font-family: 'Archivo Black', sans-serif;
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, hsl(var(--brand)), hsl(var(--hot)), hsl(var(--iris)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-section {
          padding: 80px 24px;
          text-align: center;
          border-bottom: 1px solid var(--border);
        }
        
        .hero-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          border-radius: 50%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hero-kicker {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 16px;
        }
        
        .hero-title {
          font-weight: 600;
          font-size: clamp(36px, 8vw, 72px);
          line-height: 1;
          margin: 0 0 24px;
          color: var(--fg);
        }
        
        .hero-subtitle {
          font-size: clamp(16px, 2.5vw, 20px);
          color: var(--muted);
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.5;
        }
        
        .btn-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: center;
          align-items: center;
        }
        @media (min-width: 640px) {
          .btn-group {
            flex-direction: row;
          }
        }
        
        .btn-primary {
          height: 48px;
          padding: 0 24px;
          border-radius: 12px;
          background: linear-gradient(135deg, hsl(var(--brand)), hsl(var(--hot)));
          color: white;
          font-size: 15px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(249, 115, 22, 0.5);
        }
        
        .btn-outline {
          height: 48px;
          padding: 0 24px;
          border-radius: 12px;
          background: transparent;
          color: var(--fg);
          font-size: 15px;
          font-weight: 500;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn-outline:hover {
          background: var(--card-bg);
          border-color: var(--muted);
        }
        
        .features-section {
          padding: 80px 24px;
          border-bottom: 1px solid var(--border);
        }
        
        .section-title {
          font-size: 28px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 48px;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .feature-card {
          padding: 32px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: all 0.3s;
        }
        .feature-card:hover {
          border-color: var(--muted);
          transform: translateY(-4px);
        }
        
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .feature-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .feature-desc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
        }
        
        .steps-section {
          padding: 80px 24px;
          border-bottom: 1px solid var(--border);
        }
        
        .steps-container {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .step-item {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          padding: 24px 0;
          border-bottom: 1px solid var(--border);
        }
        .step-item:last-child {
          border-bottom: none;
        }
        
        .step-num {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--brand));
          min-width: 32px;
        }
        
        .step-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .step-content p {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
        }
        
        .types-section {
          padding: 80px 24px;
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        
        .types-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .type-tag {
          padding: 10px 20px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 14px;
          transition: all 0.2s;
        }
        .type-tag:hover {
          border-color: var(--muted);
        }
        
        .cta-section {
          padding: 80px 24px;
          text-align: center;
          background: linear-gradient(180deg, transparent, rgba(249, 115, 22, 0.05));
        }
        
        .cta-title {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .cta-desc {
          font-size: 16px;
          color: var(--muted);
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.5;
        }
      `}</style>

      <canvas ref={canvasRef} className="particle-canvas" />

      <div className="page-content">
        {/* Header */}
        <header className="minimal-header">
          <button aria-label="Go back" onClick={handleBack} className="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/" className="brand-link">
            <img src={stackdLogo} alt="stackd" className="h-8 w-8" />
            <span className="brand-text">stackd</span>
          </Link>
          <div className="w-9" />
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-icon">
            <Sparkles className="h-8 w-8 text-[var(--fg)]" />
          </div>
          <div className="hero-kicker">For Vendors</div>
          <h1 className="hero-title">Reach more<br />travelers.</h1>
          <p className="hero-subtitle">
            Get additional advertising and promote your affiliate programs to reach more customers through local Airbnb hosts.
          </p>
          <Link to="/signup/vendor" className="btn-primary">Get Started as Vendor</Link>
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title">Why Vendors Choose stackd</h2>
          <div className="features-grid">
          {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon className="h-6 w-6 text-[var(--fg)]" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="steps-section">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={index} className="step-item">
                <span className="step-num">{step.num}</span>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Business Types */}
        <section className="types-section">
          <h2 className="section-title">Perfect for All Experience Types</h2>
          <div className="types-grid">
            {businessTypes.map((type) => (
              <span key={type} className="type-tag">{type}</span>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2 className="cta-title">Ready to Grow Your Business?</h2>
          <p className="cta-desc">
            Join the stackd vendor network and start reaching travelers through trusted Airbnb host recommendations.
          </p>
          <Link to="/signup/vendor" className="btn-primary">Create Your Vendor Account</Link>
        </section>
      </div>
    </div>
  );
};

export default ForVendors;
