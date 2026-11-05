import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DestinationShell } from "./DestinationShell";

// One visitor frame owns navigation, artwork, and palette across routes.
// Operational dashboards keep their existing layout.
export function DestinationRouteFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const management =
    /^\/(host|admin)(\/|$)/.test(pathname) ||
    /^\/vendor\/(dashboard|settings|profile|payment-settings|payout-history|ratings|bookings|services|create-profile|upload-photos|add-service)(\/|$)/.test(
      pathname,
    );
  useEffect(() => {
    if (management) return;
    const previous = document.documentElement.getAttribute("data-stackd-theme");
    document.documentElement.setAttribute("data-stackd-theme", "tulum");
    return () => {
      if (previous)
        document.documentElement.setAttribute("data-stackd-theme", previous);
      else document.documentElement.removeAttribute("data-stackd-theme");
    };
  }, [management]);
  if (management) return <>{children}</>;
  return (
    <DestinationShell
      className="destination-unified"
      footer={
        pathname !== "/trip-planner" &&
        !/^\/(restaurant|experience|vendor)\//.test(pathname)
      }
    >
      <div className="destination-route-content">{children}</div>
    </DestinationShell>
  );
}
