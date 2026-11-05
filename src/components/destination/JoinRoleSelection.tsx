import { ArrowLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DestinationShell } from "./DestinationShell";
import { ReferencePhoto } from "./ReferencePhoto";
import travelerImage from "@/assets/hero-beach.jpg";
import hostImage from "@/assets/restaurants/kitchen-table-tulum.jpg";
import vendorImage from "@/assets/restaurants/hartwood-tulum.jpg";

type JoinRole = "user" | "host" | "vendor";

const roles: Array<{ id: JoinRole; title: string; copy: string; image: string }> = [
  { id: "user", title: "Traveler", copy: "Discover local eats and experiences", image: travelerImage },
  { id: "host", title: "Host", copy: "Curate favorites for your guests", image: hostImage },
  { id: "vendor", title: "Vendor", copy: "Share your services with travelers", image: vendorImage },
];

export function JoinRoleSelection({
  onSelect,
  onSignIn,
  loading,
}: {
  onSelect: (role: JoinRole) => void;
  onSignIn: () => void;
  loading: boolean;
}) {
  return (
    <DestinationShell footer={false}>
      <div className="join-page">
        <div className="join-heading">
          <h1>
            How will you use
            <br />
            stackd?
          </h1>
          <p>Find your place in Tulum.</p>
        </div>
        <div className="join-grid">
          {roles.map(({ id, title, copy, image }) => (
            <button
              type="button"
              disabled={loading}
              onClick={() => onSelect(id)}
              className="join-card"
              key={id}
            >
              <ReferencePhoto src={image} alt="" />
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
              <ChevronRight size={23} />
            </button>
          ))}
        </div>
        <div className="join-signin">
          Already have an account? <button type="button" onClick={onSignIn}>Sign in</button>
        </div>
        <Link
          to="/appview"
          className="join-back"
          aria-label="Back to Tulum home"
        >
          <ArrowLeft size={17} />
          Back to home
        </Link>
        <div className="join-page-decoration" aria-hidden="true" />
      </div>
    </DestinationShell>
  );
}
