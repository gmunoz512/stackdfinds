import { Link } from 'react-router-dom';
import { Heart, MapPin, Store } from 'lucide-react';
import { GoogleRating } from '@/components/GoogleRating';
import type { ResolvedGoogleRating } from '@/lib/googleRating';
import type { GuideCategory, GuideProperty } from '@/lib/hostGuide';
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
  /** Path without the host ref; the view adds ?host=. */
  href: string;
}

export interface PublicGuideViewProps {
  hostId: string;
  hostFirstName: string | null;
  property: GuideProperty | null;
  sections: { category: GuideCategory; items: GuideCardData[] }[];
  saves: Set<string>;
  onToggleSave: (id: string) => void;
}

export function PublicGuideView({
  hostId,
  hostFirstName,
  property,
  sections,
  saves,
  onToggleSave,
}: PublicGuideViewProps) {
  const title = property?.name || (hostFirstName ? `${hostFirstName}'s guide` : "Your host's guide");
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl pb-16">

        <section className="px-4 pt-5">
          {property?.photoUrl && (
            <div className="mb-4 aspect-[16/9] overflow-hidden rounded-[20px] bg-muted">
              <img src={property.photoUrl} alt={property.name} className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Local guide</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight text-foreground">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {property?.area && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {property.area}
              </span>
            )}
            {hostFirstName && <span>Picked by {hostFirstName}</span>}
          </div>
        </section>

        {total === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            Your host hasn&apos;t added recommendations yet.
          </p>
        ) : (
          sections.map((section) => (
            <section key={section.category} className="mt-8 px-4">
              <h2 className="mb-3 text-lg font-semibold text-foreground">{section.category}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => {
                  const saved = saves.has(item.id);
                  const href = withHostRef(item.href, hostId);
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_12px_30px_rgba(39,66,52,.08)]"
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        {item.photo ? (
                          <img src={item.photo} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Store className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleSave(item.id)}
                          aria-pressed={saved}
                          aria-label={saved ? `Remove ${item.name} from saves` : `Save ${item.name}`}
                          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur"
                        >
                          <Heart className={cn('h-4 w-4', saved ? 'fill-primary text-primary' : 'text-foreground')} />
                        </button>
                      </div>
                      <div className="space-y-2 p-3">
                        <div>
                          <h3 className="font-semibold leading-snug text-foreground">{item.name}</h3>
                          {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <GoogleRating value={item.rating} className="text-xs" starClassName="h-3 w-3" />
                          {item.avgCost != null && (
                            <>
                              <span aria-hidden>·</span>
                              <span>Avg ${item.avgCost}/person</span>
                            </>
                          )}
                        </div>
                        {item.note && (
                          <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground">
                            <span className="font-medium">{hostFirstName ? `${hostFirstName}'s tip: ` : 'Host tip: '}</span>
                            {item.note}
                          </p>
                        )}
                        <Link
                          to={href}
                          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          See details
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}

        <p className="mt-10 px-4 text-center text-xs text-muted-foreground">
          Hearts are saved on this device, no account needed.
        </p>
      </div>
    </div>
  );
}

export default PublicGuideView;
