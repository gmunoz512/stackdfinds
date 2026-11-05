import { Link } from 'react-router-dom';
import { Heart, MapPin, Store } from 'lucide-react';
import { GoogleRating } from '@/components/GoogleRating';
import type { ResolvedGoogleRating } from '@/lib/googleRating';
import type { GuideProperty } from '@/lib/hostGuide';
import { withHostRef } from '@/lib/hostGuide';
import { cn } from '@/lib/utils';

export interface GuideCardData {
  id: string;
  name: string;
  subtitle: string | null;
  photo: string | null;
  rating: ResolvedGoogleRating | null;
  avgCost: number | null;
  note?: string;
  /** Booking path; the view makes sure it carries ?host=. */
  href: string;
}

export interface PublicGuideViewProps {
  hostId: string;
  hostFirstName: string | null;
  guestName?: string | null;
  property: GuideProperty | null;
  top: GuideCardData[];
  more: GuideCardData[];
  saves: Set<string>;
  onToggleSave: (id: string) => void;
}

function SaveButton({ item, saved, onToggle }: { item: GuideCardData; saved: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.name} from saves` : `Save ${item.name}`}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 backdrop-blur"
    >
      <Heart className={cn('h-4 w-4', saved ? 'fill-primary text-primary' : 'text-foreground')} />
    </button>
  );
}

/** Public host profile: header plus a photo grid of the host's Top 8, then More picks. */
export function PublicGuideView({ hostId, hostFirstName, guestName, property, top, more, saves, onToggleSave }: PublicGuideViewProps) {
  const title = property?.name || (hostFirstName ? `${hostFirstName}'s place` : "Your host's place");
  const ownerLabel = hostFirstName ? `${hostFirstName}'s` : 'My';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl pb-16">
        <header className="flex items-center gap-4 px-4 pt-6 sm:gap-6">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-[0_10px_24px_rgba(39,66,52,.12)] sm:h-32 sm:w-32">
            {property?.photoUrl ? (
              <img src={property.photoUrl} alt={property.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-muted-foreground">
                {title.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">{title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {property?.area && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {property.area}
                </span>
              )}
              {hostFirstName && <span>Picked by {hostFirstName}</span>}
            </div>
            {guestName && (
              <p className="mt-2 text-sm text-foreground">Welcome, {guestName}. Here are my favorite spots for your stay.</p>
            )}
          </div>
        </header>

        {top.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            Your host hasn&apos;t added recommendations yet.
          </p>
        ) : (
          <section className="mt-8 px-4" aria-labelledby="top8-heading">
            <h2 id="top8-heading" className="mb-3 text-lg font-semibold text-foreground">
              {ownerLabel} Top {top.length}
            </h2>
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {top.map((item, i) => (
                <li key={item.id} className="relative overflow-hidden rounded-[18px] bg-muted shadow-[0_12px_30px_rgba(39,66,52,.10)]">
                  <SaveButton item={item} saved={saves.has(item.id)} onToggle={() => onToggleSave(item.id)} />
                  <Link to={withHostRef(item.href, hostId)} className="group block aspect-[3/4]">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading={i < 4 ? 'eager' : 'lazy'} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Store className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-3 pt-10 text-white">
                      <span className="text-[11px] font-medium opacity-80">#{i + 1}</span>
                      <p className="font-semibold leading-snug text-white">{item.name}</p>
                      {item.subtitle && <p className="truncate text-xs opacity-85">{item.subtitle}</p>}
                      <GoogleRating value={item.rating} showCount={false} className="mt-1 text-xs text-white" starClassName="h-3 w-3" />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            {top.some((t) => t.note) && (
              <div className="mt-6 space-y-2">
                {top.filter((t) => t.note).map((t) => (
                  <p key={t.id} className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground">
                    <span className="font-medium">{t.name}: </span>
                    {t.note}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {more.length > 0 && (
          <section className="mt-10 px-4" aria-labelledby="more-heading">
            <h2 id="more-heading" className="mb-3 text-base font-semibold text-foreground">More picks</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {more.map((item) => (
                <li key={item.id}>
                  <Link to={withHostRef(item.href, hostId)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2 transition-colors hover:bg-muted/50">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.photo ? <img src={item.photo} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Store className="m-4 h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{item.name}</p>
                      {item.subtitle && <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 px-4 text-center text-xs text-muted-foreground">
          Tap a pick to book it. Hearts are saved on this device, no account needed.
        </p>
      </div>
    </div>
  );
}

export default PublicGuideView;
