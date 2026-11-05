import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

type PartnerPageProps = {
  audience: string;
  title: string;
  description: string;
  signup: string;
  featuresTitle: string;
  features: { icon: LucideIcon; title: string; description: string }[];
  steps: { num: string; title: string; desc: string }[];
  businessTypes?: string[];
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
};

export function PartnerPage({ audience, title, description, signup, featuresTitle, features, steps, businessTypes, ctaTitle, ctaDescription, ctaLabel }: PartnerPageProps) {
  return (
    <article className="tulum-partner">
      <header className="partner-intro">
        <p className="about-eyebrow">{audience}</p>
        <h1>{title}</h1>
        <p className="partner-description">{description}</p>
      </header>

      <section className="partner-benefits" aria-labelledby="partner-benefits-title">
        <p className="about-eyebrow">BETTER TOGETHER</p>
        <h2 id="partner-benefits-title">{featuresTitle}</h2>
        <div className="partner-feature-grid">
          {features.map(({ icon: FeatureIcon, title: featureTitle, description: featureDescription }) => (
            <div className="home-category partner-feature" key={featureTitle}>
              <FeatureIcon size={23} strokeWidth={1.5} aria-hidden="true" />
              <h3>{featureTitle}</h3>
              <p>{featureDescription}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-category partner-steps" aria-labelledby="partner-steps-title">
        <p className="about-eyebrow">A LITTLE CONNECTION GOES A LONG WAY</p>
        <h2 id="partner-steps-title">How it works</h2>
        <ol>
          {steps.map(({ num, title: stepTitle, desc }) => (
            <li key={num}>
              <span className="partner-step-number" aria-hidden="true">{num}</span>
              <div><h3>{stepTitle}</h3><p>{desc}</p></div>
            </li>
          ))}
        </ol>
      </section>

      {businessTypes && <section className="partner-types" aria-labelledby="partner-types-title">
        <p className="about-eyebrow">LOCAL TALENT. ENDLESS POSSIBILITIES.</p>
        <h2 id="partner-types-title">Every kind of experience</h2>
        <ul>{businessTypes.map(type => <li key={type}>{type}</li>)}</ul>
      </section>}

      <section className="home-category partner-cta" aria-labelledby="partner-cta-title">
        <h2 id="partner-cta-title">{ctaTitle}</h2>
        <p>{ctaDescription}</p>
        <Link to={signup} className="wishlist-plan-button">{ctaLabel}<ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </article>
  );
}
