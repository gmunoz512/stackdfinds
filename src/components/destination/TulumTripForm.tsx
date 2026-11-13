import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Heart, MapPin, Palmtree, Tag, User, Utensils, Waves } from "lucide-react";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { useTripPlannerChatContext } from "@/features/trip-planner/context";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import coast from "@/assets/tulum-coast.png";

const DRAFT_KEY = "stackdTripBrief";
type TripDraft = { start: string; end: string; travelers: string; budget: string; wish: string; interests: string[]; excluded: string[] };
function readDraft(): TripDraft {
  const empty = { start: "", end: "", travelers: "2", budget: "Any budget", wish: "", interests: [], excluded: [] };
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!value || typeof value !== "object") return empty;
    return { ...empty, ...Object.fromEntries(Object.keys(empty).map(key => [key, Array.isArray(empty[key as keyof TripDraft]) ? (Array.isArray(value[key]) ? value[key].filter((v: unknown) => typeof v === "string") : []) : (typeof value[key] === "string" ? value[key] : empty[key as keyof TripDraft])])) };
  } catch { return empty; }
}
export function TulumTripForm() {
  const { items } = useLocalWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const include = searchParams.get("include");
  const { sendMessage, isLoading } = useTripPlannerChatContext();
  const [draft, setDraft] = useState<TripDraft>(readDraft);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    if (!include) return;
    setDraft(old => ({ ...old, excluded: old.excluded.filter(key => key !== include) }));
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete("include"); return next; }, { replace: true });
  }, [include, setSearchParams]);
  const selected = items.filter(item => !draft.excluded.includes(`${item.kind}:${item.id}`));
  const update = (patch: Partial<TripDraft>) => { setDraft(old => ({ ...old, ...patch })); setSaved(false); setError(""); };
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [draft]);
  const build = (event: FormEvent) => {
    event.preventDefault();
    if ((draft.start && !draft.end) || (!draft.start && draft.end)) { setError("Choose both dates, or leave both blank if you’re still deciding."); return; }
    if (draft.start && draft.end < draft.start) { setError("Your departure date must be on or after your arrival date."); return; }
    if (!isSupabaseConfigured) { setSaved(true); return; }
    void sendMessage(`Help plan my trip to Tulum. Dates: ${draft.start ? `${draft.start} to ${draft.end}` : "flexible"}. ${draft.travelers} travelers. Budget: ${draft.budget}. Interests: ${draft.interests.join(", ") || "local favorites"}. ${draft.wish} Saved favorites to include: ${selected.map(item => `${item.name} (${item.kind})`).join(", ") || "none selected"}.`);
  };
  return (
    <div className="reference-planner">
      <div className="planner-scenic-hero" style={{ backgroundImage: `url(${coast})` }}>
        <div className="planner-hero-copy"><h1>Your Tulum,<br />your way.</h1><p>A few details. Your favorite finds.<br />A trip that feels like you.</p></div>
      </div>
      <form onSubmit={build} className="reference-plan-form trip-steps-form">
        <section className="home-category trip-step" aria-labelledby="trip-basics">
          <p className="about-eyebrow">01 · THE BASICS</p><h2 id="trip-basics">When and with whom?</h2>
          <p className="trip-step-hint">Dates can stay flexible while you explore.</p>
          <div className="trip-date-fields">
            <label><span><CalendarDays size={15} />Arrive</span><input type="date" aria-label="Arrival date" value={draft.start} onChange={e => update({ start: e.target.value, end: draft.end && e.target.value > draft.end ? "" : draft.end })} /></label>
            <label><span><CalendarDays size={15} />Leave</span><input type="date" aria-label="Departure date" min={draft.start} value={draft.end} onChange={e => update({ end: e.target.value })} /></label>
          </div>
          <div className="trip-basics-selects">
            <label><span><User size={15} />Travelers</span><select aria-label="Travelers" value={draft.travelers} onChange={e => update({ travelers: e.target.value })}>{[1,2,3,4,5,6,7,8,9,10,12].map(v => <option key={v} value={v}>{v} {v === 1 ? "traveler" : "travelers"}</option>)}</select></label>
            <label><span><Tag size={15} />Budget</span><select aria-label="Budget" value={draft.budget} onChange={e => update({ budget: e.target.value })}>{["Any budget", "Economy", "Moderate", "Premium"].map(v => <option key={v}>{v}</option>)}</select></label>
          </div>
          {error && <p ref={errorRef} tabIndex={-1} className="trip-validation" role="alert">{error}</p>}
        </section>
        <section className="home-category trip-step" aria-labelledby="trip-favorites">
          <p className="about-eyebrow">02 · YOUR FAVORITE FINDS</p><h2 id="trip-favorites">Make room for these.</h2>
          <p className="trip-step-hint">Choose what to include. Your wishlist stays saved.</p>
          {items.length ? <div className="trip-favorite-options">{items.map(item => {
            const key = `${item.kind}:${item.id}`;
            const priceNote = item.priceLabel && item.priceLabel !== "Price on request" ? ` · ${item.priceLabel}/person` : item.price != null ? ` · $${item.price}/person` : "";
            return <label className="trip-favorite-option" key={key}><input type="checkbox" checked={!draft.excluded.includes(key)} onChange={e => update({ excluded: e.target.checked ? draft.excluded.filter(v => v !== key) : [...draft.excluded, key] })} /><span><strong>{item.name}</strong><small>{item.kind === "restaurant" ? "Restaurant" : "Experience"}{item.kind === "experience" ? priceNote : ""}</small></span></label>;
          })}<p className="trip-selection-count" role="status">{selected.length} of {items.length} favorites selected</p></div> : <div className="trip-empty-favorites"><Heart size={23} /><p>Save a few local finds, or start with your trip details.</p></div>}
          <div className="trip-explore-links"><Link to="/restaurants">Find restaurants <ArrowRight size={14} /></Link><Link to="/experiences">Find experiences <ArrowRight size={14} /></Link></div>
        </section>
        <section className="home-category trip-step" aria-labelledby="trip-style">
          <p className="about-eyebrow">03 · YOUR KIND OF TRIP</p><h2 id="trip-style">What feels like you?</h2>
          <div className="trip-interest-chips">{[[Utensils,"Great food"],[MapPin,"Hidden gems"],[Waves,"Cenotes"],[Palmtree,"Beach days"]].map(([Icon,label]) => {
            const Glyph = Icon as typeof Utensils; const value = label as string;
            return <button key={value} type="button" aria-pressed={draft.interests.includes(value)} onClick={() => update({ interests: draft.interests.includes(value) ? draft.interests.filter(v => v !== value) : [...draft.interests, value] })}><Glyph size={16} />{value}</button>;
          })}</div>
          <label className="trip-notes-label" htmlFor="trip-wish">Anything else? <span>Optional</span></label>
          <textarea id="trip-wish" value={draft.wish} onChange={e => update({ wish: e.target.value })} placeholder="Slow mornings, a special dinner, time by the water…" />
        </section>
        <section className="home-category trip-step trip-brief" aria-labelledby="trip-brief-title">
          <p className="about-eyebrow">YOUR TRIP BRIEF</p><h2 id="trip-brief-title">A little Tulum taking shape.</h2>
          <dl><div><dt>Dates</dt><dd>{draft.start ? `${draft.start} → ${draft.end || "Choose departure"}` : "Flexible"}</dd></div><div><dt>Travelers</dt><dd>{draft.travelers}</dd></div><div><dt>Budget</dt><dd>{draft.budget}</dd></div><div><dt>Favorites</dt><dd>{selected.length} selected</dd></div></dl>
          {selected.length > 0 && <ul className="trip-brief-favorites">{selected.map(item => <li key={`${item.kind}:${item.id}`}><Check size={14} aria-hidden="true" />{item.name}</li>)}</ul>}
          <button disabled={isLoading} type="submit" className="build-plan-button">{isLoading ? "Building your plan…" : isSupabaseConfigured ? "Build my plan" : "Save my trip brief"}<ArrowRight size={18} /></button>
          {!isSupabaseConfigured && <p className="trip-preview-note">AI itinerary generation and bookings aren’t connected yet. Save your trip brief to return to it on this device.</p>}
          {saved && <p className="planner-preview-notice" role="status">{storageError ? "Your trip brief is ready below, but this browser couldn’t save it. Keep this page open to retain your choices." : "Trip brief saved. Your dates, preferences, and selected favorites will be here when you return on this device."}</p>}
          {storageError && !saved && <p role="alert" className="trip-validation">This browser couldn’t save your changes. Keep this page open to retain them.</p>}
        </section>
      </form>
    </div>
  );
}
