import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ShareGuideDialog } from "@/components/host/ShareGuideDialog";
import { StackdSignIn } from "@/components/stackd/StackdSignIn";
import { VendorPhoto } from "@/components/destination/VendorPhoto";
import { useStackdSession } from "@/contexts/StackdSessionContext";
import { findAirbnbExperienceById } from "@/data/airbnbCatalog";
import { mockRestaurants } from "@/data/mockRestaurants";
import { stackd } from "@/integrations/stackd/client";
import { hostEditorCommission, httpsPhotoUrl, normalizeSlug, slugError } from "@/lib/hostPage";
import { shareHostPageUrl } from "@/lib/shareGuide";
import "../auth/vendor-accounts.css";

interface ItemRow {
  item_type: "experience" | "restaurant";
  item_ref: string;
  vendor_username: string | null;
  position: number;
}

interface EditorItem extends ItemRow {
  title: string;
  photo: string | null;
  commission: string;
}

function describe(item: ItemRow): EditorItem | null {
  if (item.item_type === "experience") {
    const experience = findAirbnbExperienceById(item.item_ref);
    if (!experience) return null;
    return {
      ...item,
      title: experience.title,
      photo: experience.photos[0] ?? null,
      commission: hostEditorCommission(
        (experience as { commissionPercentage?: number | null }).commissionPercentage ?? null,
        experience.price?.amount ?? null,
      ).label,
    };
  }
  const restaurant = mockRestaurants.find((row) => row.id === item.item_ref);
  if (!restaurant) return null;
  return { ...item, title: restaurant.name, photo: restaurant.photos[0] ?? null, commission: "" };
}

export default function HostPageEditor() {
  const { configured, ready, user } = useStackdSession();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [items, setItems] = useState<EditorItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const load = async (hostId: string) => {
    if (!stackd) return;
    const { data } = await stackd.from("host_pages").select("slug, display_name, bio, photo_url").eq("host_id", hostId).maybeSingle();
    if (!data) {
      setExists(false);
      return;
    }
    setExists(true);
    setSlug(data.slug);
    setName(data.display_name);
    setBio(data.bio ?? "");
    setPhoto(data.photo_url ?? "");
    const { data: rows } = await stackd
      .from("host_page_items")
      .select("item_type, item_ref, vendor_username, position")
      .eq("host_id", hostId)
      .order("position", { ascending: true });
    setItems(((rows ?? []) as ItemRow[]).map(describe).filter((item): item is EditorItem => item !== null));
  };

  useEffect(() => {
    if (user) void load(user.id);
  }, [user]);

  const savePage = async (event: FormEvent) => {
    event.preventDefault();
    if (!stackd || !user) return;
    setError(null);
    const nextSlug = normalizeSlug(slug);
    const slugProblem = slugError(nextSlug);
    if (slugProblem) return setError(slugProblem);
    const display = name.trim();
    if (display.length < 1 || display.length > 80) return setError("Add a name, up to 80 characters.");
    if (bio.trim().length > 500) return setError("Keep the bio under 500 characters.");
    const photoUrl = photo.trim() ? httpsPhotoUrl(photo) : null;
    if (photo.trim() && !photoUrl) return setError("The photo link has to start with https://");
    setSaving(true);
    const row = { host_id: user.id, slug: nextSlug, display_name: display, bio: bio.trim() || null, photo_url: photoUrl };
    const { error: writeError } = exists
      ? await stackd.from("host_pages").update(row).eq("host_id", user.id)
      : await stackd.from("host_pages").insert(row);
    setSaving(false);
    if (writeError) {
      setError(writeError.code === "23505" ? "That page address is already taken." : "The page couldn't be saved.");
      return;
    }
    setExists(true);
    setStatus("Page saved.");
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!stackd || !user) return;
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    setItems(copy);
    await Promise.all(copy.map((entry, position) =>
      stackd.from("host_page_items").update({ position }).eq("host_id", user.id).eq("item_type", entry.item_type).eq("item_ref", entry.item_ref),
    ));
  };

  const remove = async (item: EditorItem) => {
    if (!stackd || !user) return;
    await stackd.from("host_page_items").delete().eq("host_id", user.id).eq("item_type", item.item_type).eq("item_ref", item.item_ref);
    setItems((current) => current.filter((entry) => entry.item_ref !== item.item_ref || entry.item_type !== item.item_type));
  };

  return (
    <main className="va-page">
      <div className="va-panel host-editor">
        <p className="va-wordmark">stackd</p>
        <h1 className="va-title">Your page</h1>
        <p className="va-sub">A picture-first page of your favorite experiences and restaurants. The top 8 show first.</p>
        {!ready ? <p className="va-note">Loading…</p> : null}
        {ready && !configured ? <p className="va-note" role="status">Host pages opening soon.</p> : null}
        {ready && configured && !user ? (
          <>
            <p className="va-note">
              Sign in with the Stackd host account. The page id is that account's user id. The sign-in on the rest of stackd is a different project and is not written here.
            </p>
            <StackdSignIn />
          </>
        ) : null}
        {user ? (
          <>
            <form onSubmit={savePage} noValidate>
              <label className="va-field">
                Page address
                <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="your-name" />
                <span className="va-hint">stackdfinds.com/h/{normalizeSlug(slug) || "your-name"}</span>
              </label>
              <label className="va-field">
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="va-field">
                Bio <span className="va-hint">optional</span>
                <textarea rows={3} maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} />
              </label>
              <label className="va-field">
                Photo link <span className="va-hint">optional, https only</span>
                <input value={photo} onChange={(event) => setPhoto(event.target.value)} placeholder="https://" />
              </label>
              {error ? <p className="va-status va-status-error" role="alert">{error}</p> : null}
              {status ? <p className="va-status va-status-success" role="status">{status}</p> : null}
              <button className="va-btn" type="submit" disabled={saving}>{saving ? "Saving…" : exists ? "Save page" : "Create page"}</button>
            </form>
            {exists ? (
              <button className="va-btn va-btn-ghost" type="button" onClick={() => setShareOpen(true)}>Share by text</button>
            ) : null}
            <h2 className="host-editor-heading">Picks</h2>
            {items.length === 0 ? <p className="va-note">Add experiences and restaurants from their pages. The button shows for signed-in hosts.</p> : null}
            <ol className="host-editor-list">
              {items.map((item, index) => (
                <li key={`${item.item_type}:${item.item_ref}`}>
                  <VendorPhoto src={item.photo} name={item.title} frameClassName="host-editor-photo" />
                  <div>
                    <p className="host-editor-title">{item.title}</p>
                    <p className="va-hint">{index < 8 ? `Top ${index + 1}` : "More"}{item.item_type === "restaurant" ? " · Recommendation" : ""}</p>
                    {item.item_type === "experience" ? <p className="va-hint">Commission {item.commission}</p> : null}
                    <div className="booking-request-actions">
                      <button type="button" className="va-copy" onClick={() => void move(index, -1)} disabled={index === 0}>Up</button>
                      <button type="button" className="va-copy" onClick={() => void move(index, 1)} disabled={index === items.length - 1}>Down</button>
                      <button type="button" className="va-copy" onClick={() => void remove(item)}>Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="va-note"><Link to="/experiences">Browse experiences</Link></p>
            {exists ? (
              <ShareGuideDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                hostId={user.id}
                propertyName={name}
                urlFor={(hostId, guestName) => shareHostPageUrl(normalizeSlug(slug), hostId, guestName)}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
