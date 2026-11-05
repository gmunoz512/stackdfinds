import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Camera, ExternalLink, Loader2, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import HostBottomNav from '@/components/HostBottomNav';
import { HostCommissionBadge } from '@/components/host/HostCommissionBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSmartBack } from '@/hooks/use-smart-back';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  GUIDE_CATEGORIES,
  NOTE_MAX,
  defaultGuideCategory,
  guidePath,
  moveEntry,
  parseGuide,
  serializeGuide,
  TOP_PICKS,
  type GuideCategory,
  type GuideEntry,
  type GuideProperty,
} from '@/lib/hostGuide';

export interface BuilderVendor {
  id: string;
  name: string;
  category: string | null;
  photo: string | null;
  commission: number | null;
}

export interface BuilderRow {
  entry: GuideEntry;
  vendor: BuilderVendor;
}

export interface GuideEditorProps {
  property: GuideProperty;
  onPropertyChange: (p: GuideProperty) => void;
  onPhotoSelected?: (file: File) => void;
  uploadingPhoto?: boolean;
  rows: BuilderRow[];
  onRowsChange: (rows: BuilderRow[]) => void;
  hiddenCount: number;
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
  guideUrl: string | null;
  onBack?: () => void;
}

/** Presentational editor so it can be rendered without a live session. */
export function GuideEditor({
  property,
  onPropertyChange,
  onPhotoSelected,
  uploadingPhoto,
  rows,
  onRowsChange,
  hiddenCount,
  saving,
  dirty,
  onSave,
  guideUrl,
  onBack,
}: GuideEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const update = (i: number, patch: Partial<GuideEntry>) =>
    onRowsChange(rows.map((r, idx) => (idx === i ? { ...r, entry: { ...r.entry, ...patch } } : r)));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your guest guide</h1>
            <p className="text-sm text-muted-foreground">Set up your place, then order your picks and add a tip for each.</p>
          </div>
          {guideUrl && (
            <Link to={guideUrl} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              View your profile
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold text-foreground">Your property</h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!onPhotoSelected || uploadingPhoto}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted"
            aria-label="Upload property photo"
          >
            {property.photoUrl ? (
              <img src={property.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : uploadingPhoto ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                <Camera className="h-5 w-5" />
                Photo
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && onPhotoSelected) onPhotoSelected(f);
              e.target.value = '';
            }}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="property-name">Property name</Label>
              <Input
                id="property-name"
                value={property.name}
                maxLength={80}
                placeholder="e.g. Casa Sol"
                onChange={(e) => onPropertyChange({ ...property, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-area">Area</Label>
              <Input
                id="property-area"
                value={property.area}
                maxLength={80}
                placeholder="e.g. Aldea Zama, Tulum"
                onChange={(e) => onPropertyChange({ ...property, area: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Your picks ({rows.length})</h2>
          <Link to="/host/marketplace" className="text-sm font-medium text-primary hover:underline">
            Add from marketplace
          </Link>
        </div>

        {rows.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No vendors in your guide yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add local businesses from the marketplace and they will show up here.</p>
          </Card>
        ) : (
          rows.map((row, i) => (
            <div key={row.vendor.id} className="space-y-3">
            {i === 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground">Top {TOP_PICKS}</p>
                <p className="text-xs text-muted-foreground">Your first {TOP_PICKS} picks show as big photo tiles on your profile. Use the arrows to reorder.</p>
              </div>
            )}
            {i === TOP_PICKS && (
              <div className="pt-2">
                <p className="text-sm font-semibold text-foreground">More picks</p>
                <p className="text-xs text-muted-foreground">These show in a smaller list below your Top {TOP_PICKS}.</p>
              </div>
            )}
            <Card className={i < TOP_PICKS ? 'space-y-3 border-primary/40 p-3' : 'space-y-3 p-3'}>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {row.vendor.photo ? (
                    <img src={row.vendor.photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center"><Store className="h-5 w-5 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    <span className="mr-1.5 text-muted-foreground">{i < TOP_PICKS ? `#${i + 1}` : `${i + 1}.`}</span>
                    {row.vendor.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{row.vendor.category || 'Local business'}</p>
                  <HostCommissionBadge commission={row.vendor.commission} showEarnings className="mt-1 items-start" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === 0} onClick={() => onRowsChange(moveEntry(rows, i, i - 1))} aria-label={`Move ${row.vendor.name} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={i === rows.length - 1} onClick={() => onRowsChange(moveEntry(rows, i, i + 1))} aria-label={`Move ${row.vendor.name} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onRowsChange(rows.filter((_, idx) => idx !== i))} aria-label={`Hide ${row.vendor.name} from guide`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
                <select
                  value={row.entry.category ?? defaultGuideCategory(row.vendor.category)}
                  onChange={(e) => update(i, { category: e.target.value as GuideCategory })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  aria-label={`Section for ${row.vendor.name}`}
                >
                  {GUIDE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Textarea
                  value={row.entry.note ?? ''}
                  maxLength={NOTE_MAX}
                  rows={2}
                  placeholder="Your tip for guests (optional)"
                  onChange={(e) => update(i, { note: e.target.value })}
                  aria-label={`Tip for ${row.vendor.name}`}
                />
              </div>
            </Card>
            </div>
          ))
        )}
        {hiddenCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {hiddenCount} saved vendor{hiddenCount === 1 ? ' is' : 's are'} not published right now and won&apos;t show to guests.
          </p>
        )}
      </div>

      <div>
        <Button className="w-full" disabled={saving || !dirty || !property.name.trim()} onClick={onSave}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {dirty ? 'Save guide' : 'Saved'}
        </Button>
        {!property.name.trim() && <p className="mt-1 text-center text-xs text-muted-foreground">Add a property name to save.</p>}
      </div>
    </div>
  );
}

const isMissingRelation = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message || ''));

/** /host/guide — property profile + ordered vendor picks with notes and sections. */
const HostGuideBuilder = () => {
  const goBack = useSmartBack('/host/dashboard');
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [property, setProperty] = useState<GuideProperty>({ name: '', area: '', photoUrl: null });
  const [rows, setRows] = useState<BuilderRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hostGuideBuilder', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [{ data: profile }, links] = await Promise.all([
        supabase.from('profiles').select('recommendations').eq('user_id', uid).maybeSingle(),
        supabase.from('host_vendor_links').select('vendor_profile_id').eq('host_user_id', uid),
      ]);
      if (links.error && !isMissingRelation(links.error)) console.error('host_vendor_links read failed', links.error);
      const raw = profile?.recommendations ?? null;
      const guide = parseGuide(raw);
      const linkedIds = (links.data || []).map((l) => l.vendor_profile_id);
      const ids = Array.from(new Set([...linkedIds, ...guide.entries.filter((e) => e.type !== 'restaurant').map((e) => e.id)]));
      let vendors: BuilderVendor[] = [];
      if (ids.length) {
        const { data: vrows } = await supabase
          .from('vendor_profiles')
          .select('id,name,category,photos,commission_percentage')
          .in('id', ids)
          .eq('is_published', true);
        vendors = (vrows || []).map((v) => ({ id: v.id, name: v.name, category: v.category, photo: v.photos?.[0] ?? null, commission: v.commission_percentage ?? null }));
      }
      return { raw, guide, linkedIds, vendors, hiddenCount: ids.length - vendors.length };
    },
  });

  useEffect(() => {
    if (!data) return;
    const byId = new Map(data.vendors.map((v) => [v.id, v]));
    const ordered: BuilderRow[] = [];
    const used = new Set<string>();
    // Saved guide order first (only vendors still linked from the marketplace).
    const linked = new Set(data.linkedIds);
    for (const e of data.guide.entries) {
      const v = byId.get(e.id);
      if (e.type !== 'restaurant' && v && linked.has(e.id) && !used.has(e.id)) {
        ordered.push({ entry: e, vendor: v });
        used.add(e.id);
      }
    }
    // Newly added from the marketplace go to the end.
    for (const id of data.linkedIds) {
      const v = byId.get(id);
      if (v && !used.has(id)) {
        ordered.push({ entry: { id, type: 'vendor', addedAt: new Date().toISOString() }, vendor: v });
        used.add(id);
      }
    }
    setRows(ordered);
    setProperty(data.guide.property ?? { name: '', area: '', photoUrl: null });
    setDirty(false);
  }, [data]);

  const restaurantEntries = useMemo(() => data?.guide.entries.filter((e) => e.type === 'restaurant') ?? [], [data]);

  const handlePhoto = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please pick a photo under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${user.id}/property-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('vendor-photos').upload(path, file);
      if (error) throw error;
      const { data: pub } = supabase.storage.from('vendor-photos').getPublicUrl(path);
      setProperty((p) => ({ ...p, photoUrl: pub.publicUrl }));
      setDirty(true);
    } catch (e) {
      console.error('property photo upload failed', e);
      toast.error('Could not upload that photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const entries = [...rows.map((r) => r.entry), ...restaurantEntries];
    const { error } = await supabase
      .from('profiles')
      .update({ recommendations: serializeGuide({ property, entries }) as unknown as Json })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      console.error('save guide failed', error);
      toast.error('Could not save your guide');
      return;
    }
    toast.success('Guide saved');
    setDirty(false);
    queryClient.invalidateQueries({ queryKey: ['hostGuideBuilder'] });
    queryClient.invalidateQueries({ queryKey: ['hostProfileComplete'] });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <GuideEditor
          property={property}
          onPropertyChange={(p) => { setProperty(p); setDirty(true); }}
          onPhotoSelected={handlePhoto}
          uploadingPhoto={uploading}
          rows={rows}
          onRowsChange={(r) => { setRows(r); setDirty(true); }}
          hiddenCount={data?.hiddenCount ?? 0}
          saving={saving}
          dirty={dirty}
          onSave={handleSave}
          guideUrl={user ? guidePath(user.id) : null}
          onBack={goBack}
        />
      )}
      <HostBottomNav />
    </div>
  );
};

export default HostGuideBuilder;
