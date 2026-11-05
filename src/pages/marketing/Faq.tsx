import { Link } from "react-router-dom";
import { ChevronDown, Mail } from "lucide-react";

const groups = [
  {
    title: "Exploring Tulum",
    questions: [
      { question: "What is stackd?", answer: <>stackd brings local restaurants, experiences, and trip planning together so you can discover your kind of Tulum.</> },
      { question: "How do I save a restaurant or experience?", answer: <>Tap the heart on any listing to add it to your wishlist. Tap it again to remove it. Open the listing itself to see its details and photos.</> },
      { question: "Where can I find my saved favorites?", answer: <>Your collection appears in My Wishlists on the home page and in <Link to="/wishlists">My stackd</Link> in the bottom navigation. In this preview, favorites are saved in this browser on this device.</> },
      { question: "How do I start planning my trip?", answer: <>Tap Plan in the bottom navigation or Plan your trip below your wishlist. Choose your dates, travelers, and budget in the <Link to="/trip-planner">trip planner</Link>, then select which saved favorites to include. Your trip brief is saved on this device.</> },
      { question: "Can I make a booking in this preview?", answer: <>Bookings, payments, and AI itinerary generation aren’t connected in this preview. You can browse listings, explore photos, save favorites, and save a trip brief on this device.</> },
      { question: "What do experience prices mean?", answer: <>Experience cards show the listed price per person. The price meter on an experience’s detail page shows an average-price comparison when comparison data is available; otherwise, it is marked unavailable. Confirm final pricing with the provider before booking.</> },
    ],
  },
  {
    title: "Our local community",
    questions: [
      { question: "How can I join as a host?", answer: <>Visit <Link to="/for-hosts">For hosts</Link> to learn about local vendor partnerships, guest recommendations, and the host sign-up path.</> },
      { question: "How can I list my business or experience?", answer: <>Visit <Link to="/for-vendors">For vendors</Link> to learn about showcasing your business and connecting with local hosts.</> },
    ],
  },
];

export default function Faq() {
  return (
    <article className="tulum-about tulum-faq">
      <header className="about-intro">
        <p className="about-eyebrow">A LITTLE HELP ALONG THE WAY</p>
        <h1>Frequently asked questions</h1>
        <p>Good to know before your Tulum adventure.</p>
      </header>
      {groups.map(({ title, questions }, groupIndex) => (
        <section className="faq-group" key={title} aria-labelledby={`faq-group-${groupIndex}`}>
          <h2 id={`faq-group-${groupIndex}`}>{title}</h2>
          {questions.map(({ question, answer }) => (
            <details className="home-category faq-item" key={question}>
              <summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
      ))}
      <section className="home-category about-panel">
        <h2>Still have a question?</h2>
        <p>We’d love to hear from you.</p>
        <a className="about-contact-link" href="mailto:support@stackd.com"><Mail size={18} aria-hidden="true" />support@stackd.com</a>
      </section>
    </article>
  );
}
