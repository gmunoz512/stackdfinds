import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { cleanGuestName } from '@/lib/shareGuide';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PublicGuideView, type GuideCardData } from '@/components/guide/PublicGuideView';
import { supabase } from '@/integrations/supabase/client';
import { resolveGoogleRating } from '@/lib/googleRating';
import {
  defaultGuideCategory,
  bookingHrefFor,
  splitTopPicks,
  parseGuide,
  readGuideSaves,
  toggleGuideSave,
  type GuideCategory,
  type ParsedGuide,
} from '@/lib/hostGuide';

interface VendorRow {
  id: string;
  name: string;
  category: string | null;
  price_per_person: number | null;
  photos: string[] | null;
  google_rating: number | null;
}

type GuideCardRow = GuideCardData & { category?: GuideCategory; fallback: GuideCategory };

const deviceStorage = () => (typeof window !== 'undefined' ? window.localStorage : null);

/** Public guest guide at /guide/:hostId. No login required. */
const GuestGuide = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const [searchParams] = useSearchParams();
  const guestName = cleanGuestName(searchParams.get('guest')) || null;
  const [hostName, setHostName] = useState<string | null>(null);
  const [guide, setGuide] = useState<ParsedGuide | null>(null);
  const [vendors, setVendors] = useState<Map<string, VendorRow>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saves, setSaves] = useState<Set<string>>(() => readGuideSaves(deviceStorage()));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hostId) {
        setError('This guide link is not valid.');
        setIsLoading(false);
        return;
      }
      try {
        const { data, error: fnError } = await supabase.functions.invoke('host-guide', { body: { hostId } });
        if (cancelled) return;
        if (fnError || !data) {
          setError('We could not find this guide.');
          return;
        }
        const parsed = parseGuide(data.recommendations ?? null);
        setHostName(typeof data.full_name === 'string' ? data.full_name : null);
        setGuide(parsed);

        const vendorIds = parsed.entries.filter((e) => e.type !== 'restaurant').map((e) => e.id);
        if (vendorIds.length) {
          const { data: rows } = await supabase
            .from('vendor_profiles')
            .select('id,name,category,price_per_person,photos,google_rating')
            .in('id', vendorIds)
            .eq('is_published', true);
          if (!cancelled && rows) setVendors(new Map(rows.map((r) => [r.id, r as VendorRow])));
        }
      } catch {
        if (!cancelled) setError('Something went wrong loading this guide.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hostId]);

  const sections = useMemo(() => {
    if (!guide) return { top: [] as GuideCardRow[], more: [] as GuideCardRow[] };
    const cards: GuideCardRow[] = guide.entries.flatMap((entry): GuideCardRow[] => {
      // Restaurant entries pointed at built-in sample data; skip them until
      // restaurants come from a real source. Vendors are the guide.
      if (entry.type === 'restaurant') return [];
      const v = vendors.get(entry.id);
      if (!v) return [];
      return [{
        id: v.id,
        name: v.name,
        subtitle: v.category,
        photo: v.photos?.[0] ?? null,
        rating: resolveGoogleRating({ googleRating: v.google_rating }),
        avgCost: v.price_per_person,
        note: entry.note,
        href: bookingHrefFor(entry, hostId ?? ''),
        category: entry.category,
        fallback: defaultGuideCategory(v.category),
      }];
    });
    return splitTopPicks(cards);
  }, [guide, vendors, hostId]);

  const propertyName = guide?.property?.name;
  useEffect(() => {
    if (!propertyName) return;
    const prev = document.title;
    document.title = `${propertyName} · Local picks on stackd`;
    return () => {
      document.title = prev;
    };
  }, [propertyName]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hostId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-sm p-8 text-center">
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Link to="/" className="text-sm text-primary hover:underline">Go to stackd</Link>
        </Card>
      </div>
    );
  }

  return (
    <PublicGuideView
      hostId={hostId}
      hostFirstName={hostName?.trim().split(/\s+/)[0] || null}
      property={guide?.property ?? null}
      guestName={guestName}
      top={sections.top}
      more={sections.more}
      saves={saves}
      onToggleSave={(id) => setSaves(new Set(toggleGuideSave(deviceStorage(), id)))}
    />
  );
};

export default GuestGuide;
