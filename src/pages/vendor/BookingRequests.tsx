import { Link } from "react-router-dom";
import { BookingRequestsPanel } from "@/components/vendor/BookingRequestsPanel";
import "../auth/vendor-accounts.css";

export default function VendorBookingRequests() {
  return (
    <main className="va-page">
      <div className="va-panel">
        <Link to="/vendor/dashboard" className="va-back">← Dashboard</Link>
        <BookingRequestsPanel />
      </div>
    </main>
  );
}
