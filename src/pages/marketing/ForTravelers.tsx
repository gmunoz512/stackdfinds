import { Compass, CreditCard, Heart, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: Compass,
    title: "Find your kind of trip",
    description: "Discover restaurants, experiences, and local favorites that fit the way you want to travel.",
  },
  {
    icon: Heart,
    title: "Save what speaks to you",
    description: "Keep the places and experiences you love together in one personal collection.",
  },
  {
    icon: CreditCard,
    title: "Book with confidence",
    description: "When a service is available to book, secure payment options are shown clearly at checkout.",
  },
];

const steps = [
  ["01", "Explore", "Start with local favorites selected for your destination."],
  ["02", "Build your list", "Save the restaurants and experiences you want to remember."],
  ["03", "Plan your days", "Turn your finds into an itinerary that feels like your trip."],
  ["04", "Go enjoy it", "Book when ready and make room for the unexpected."],
];

export default function ForTravelers() {
  return (
    <article className="tulum-partner">
      <header className="partner-intro">
        <p className="about-eyebrow">FOR TRAVELERS</p>
        <h1>Travel like you already know the place.</h1>
        <p className="partner-description">Find the local restaurants, experiences, and little discoveries that make a trip feel personal.</p>
        <Link to="/explore" className="wishlist-plan-button">Explore stackd<Compass size={18} aria-hidden="true" /></Link>
      </header>

      <section className="partner-benefits" aria-labelledby="traveler-benefits-title">
        <p className="about-eyebrow">MADE FOR THE WAY YOU TRAVEL</p>
        <h2 id="traveler-benefits-title">A better way to find your place</h2>
        <div className="partner-feature-grid">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div className="home-category partner-feature" key={title}>
              <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-category partner-steps" aria-labelledby="traveler-steps-title">
        <p className="about-eyebrow">FROM CURIOUS TO CHECKED IN</p>
        <h2 id="traveler-steps-title">Make the trip yours</h2>
        <ol>
          {steps.map(([num, title, description]) => (
            <li key={num}>
              <span className="partner-step-number" aria-hidden="true">{num}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-category partner-cta" aria-labelledby="traveler-cta-title">
        <MapPinned size={24} strokeWidth={1.5} aria-hidden="true" />
        <h2 id="traveler-cta-title">Where will stackd take you?</h2>
        <p>One destination at a time. A world of local favorites ahead.</p>
        <Link to="/explore" className="wishlist-plan-button">Start exploring<Compass size={18} aria-hidden="true" /></Link>
      </section>
    </article>
  );
}
