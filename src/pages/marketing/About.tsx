import { Link } from "react-router-dom";
import { ArrowRight, Compass, Mail, Sparkles, Utensils, CalendarCheck } from "lucide-react";

const offers = [
  { Icon: Utensils, text: "Curated local restaurants and dining experiences" },
  { Icon: Compass, text: "Adventure activities and tours from trusted vendors" },
  { Icon: Sparkles, text: "AI-powered trip planning assistance" },
  { Icon: CalendarCheck, text: "Seamless booking and reservation management" },
];

export default function About() {
  return (
    <article className="tulum-about">
      <header className="about-intro">
        <p className="about-eyebrow">LOCAL FINDS. MEANINGFUL CONNECTIONS.</p>
        <h1>About stackd</h1>
        <p>Your one-stop platform for discovering local experiences, dining, and adventures.</p>
      </header>
      <section className="home-category about-panel" aria-labelledby="about-mission">
        <h2 id="about-mission">Our Mission</h2>
        <p>We connect travelers with unforgettable local experiences while empowering hosts and vendors to grow their businesses through meaningful partnerships.</p>
      </section>
      <section className="home-category about-panel" aria-labelledby="about-offer">
        <h2 id="about-offer">What We Offer</h2>
        <ul>{offers.map(({Icon,text}) => <li key={text}><Icon size={20} aria-hidden="true"/><span>{text}</span></li>)}</ul>
      </section>
      <section className="home-category about-panel" aria-labelledby="about-contact">
        <h2 id="about-contact">Get in Touch</h2>
        <p>Have questions or feedback? We’d love to hear from you.</p>
        <a className="about-contact-link" href="mailto:support@stackd.com"><Mail size={18} aria-hidden="true"/>support@stackd.com</a>
      </section>
      <Link className="wishlist-plan-button" to="/appview">Explore Tulum <ArrowRight size={18}/></Link>
    </article>
  );
}
