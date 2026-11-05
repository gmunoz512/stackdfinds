import { Navigate, Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isValidHostId } from "@/lib/guestBooking";

/**
 * Old /experience/:id and /booking/:id links used built-in sample listings.
 * Real listings are vendor profiles, so send UUIDs to the vendor pages and
 * show an honest empty state for anything else.
 */
const RetiredListing = ({ mode }: { mode: "details" | "book" }) => {
  const { id } = useParams();
  const [params] = useSearchParams();
  if (isValidHostId(id)) {
    const qs = params.toString();
    return <Navigate replace to={`/vendor/${id}${mode === "book" ? "/book" : ""}${qs ? `?${qs}` : ""}`} />;
  }
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <h1 className="text-xl font-medium">This listing isn't available</h1>
        <p className="text-sm text-muted-foreground">
          It may have moved or been taken down. Browse what local vendors are offering right now.
        </p>
        <Button asChild variant="outline">
          <Link to="/experiences">See experiences</Link>
        </Button>
      </div>
    </main>
  );
};

export default RetiredListing;
