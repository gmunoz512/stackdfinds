import { useState } from "react";
import "@/pages/auth/vendor-accounts.css";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStackdSession } from "@/contexts/StackdSessionContext";
import { StackdSignIn } from "@/components/stackd/StackdSignIn";
import { stackd } from "@/integrations/stackd/client";
import { canOfferHostPage, type HostPageItemType } from "@/lib/hostPage";
import { toast } from "@/hooks/use-toast";

export function AddToHostPage({
  itemType,
  itemRef,
  vendorUsername,
}: {
  itemType: HostPageItemType;
  itemRef: string;
  vendorUsername?: string | null;
}) {
  const { role, isAuthenticated } = useAuthContext();
  const { configured, ready, user } = useStackdSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const visible = canOfferHostPage(isAuthenticated ? role : null, user?.app_metadata);
  if (!ready || !visible) return null;

  const add = async () => {
    setMessage(null);
    if (!configured || !stackd) {
      setMessage("Host pages opening soon.");
      setOpen(true);
      return;
    }
    if (!user) {
      setOpen(true);
      return;
    }
    setSaving(true);
    const { data: page, error: pageError } = await stackd
      .from("host_pages")
      .select("host_id")
      .eq("host_id", user.id)
      .maybeSingle();
    if (pageError) {
      setSaving(false);
      setMessage("Your page couldn't be opened.");
      setOpen(true);
      return;
    }
    if (!page) {
      setSaving(false);
      setMessage("Create your page first, then add picks to it.");
      setOpen(true);
      return;
    }
    const { data: existing } = await stackd
      .from("host_page_items")
      .select("position")
      .eq("host_id", user.id);
    const position = (existing ?? []).reduce((max, row) => Math.max(max, Number(row.position) || 0), -1) + 1;
    const { error } = await stackd.from("host_page_items").insert({
      host_id: user.id,
      item_type: itemType,
      item_ref: itemRef,
      vendor_username: itemType === "experience" ? vendorUsername ?? null : null,
      position,
    });
    setSaving(false);
    if (error) {
      setMessage(error.code === "23505" ? "That's already on your page." : "That couldn't be added.");
      setOpen(true);
      return;
    }
    toast({ title: "Added to your page" });
  };

  return (
    <>
      <button type="button" className="add-to-page" onClick={() => void add()} disabled={saving}>
        {saving ? "Adding…" : "Add to my page"}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="booking-sheet">
          <SheetHeader>
            <SheetTitle className="booking-sheet-title">Your page</SheetTitle>
            <SheetDescription className="booking-sheet-copy">
              Save experiences and restaurants to your own page to share with guests.
            </SheetDescription>
          </SheetHeader>
          {message ? <p className="va-note" role="status">{message}</p> : null}
          {!user ? <StackdSignIn onSignedIn={() => setOpen(false)} /> : null}
          <p className="va-note">
            <Link to="/host/page">Open your page</Link> to name it, arrange the top 8, and share it.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}
