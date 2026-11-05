import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Contact, Copy, MessageSquare, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { defaultShareMessage, shareGuideUrl, shareText, smsHref } from '@/lib/shareGuide';

interface ContactsManager {
  select: (props: string[], opts?: { multiple?: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]>;
}

export interface ShareGuideFormProps {
  hostId: string;
  propertyName: string;
  initialGuestName?: string;
}

/** The share form, usable inside a dialog or rendered on its own. */
export function ShareGuideForm({ hostId, propertyName, initialGuestName = '' }: ShareGuideFormProps) {
  const [guestName, setGuestName] = useState(initialGuestName);
  const [phone, setPhone] = useState('');
  const [arrival, setArrival] = useState('');
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => shareGuideUrl(hostId, guestName), [hostId, guestName]);
  const message = customMessage ?? defaultShareMessage({ guestName, propertyName, arrivalDate: arrival });
  const body = shareText(message, url);

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  const canShare = !!nav && typeof nav.share === 'function';
  const contacts = (nav as (Navigator & { contacts?: ContactsManager }) | undefined)?.contacts;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Press and hold the link to copy it.');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: propertyName || 'My Tulum guide', text: message, url });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') toast.error('Sharing is not available here. Copy the link instead.');
    }
  };

  const pickContact = async () => {
    if (!contacts) return;
    try {
      const [c] = await contacts.select(['name', 'tel'], { multiple: false });
      if (c?.name?.[0]) setGuestName(c.name[0]);
      if (c?.tel?.[0]) setPhone(c.tel[0]);
    } catch {
      /* host cancelled */
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="share-guest">Guest name</Label>
          <Input id="share-guest" value={guestName} maxLength={40} placeholder="e.g. Sarah" onChange={(e) => setGuestName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="share-phone">Phone (optional)</Label>
          <Input id="share-phone" type="tel" inputMode="tel" value={phone} placeholder="+52 984 000 0000" onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="share-arrival">Arrival date (optional)</Label>
          <Input id="share-arrival" type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} />
        </div>
        {contacts && (
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full gap-2" onClick={pickContact}>
              <Contact className="h-4 w-4" />
              Pick from contacts
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="share-message">Message</Label>
          {customMessage !== null && (
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => setCustomMessage(null)}>
              Reset
            </button>
          )}
        </div>
        <Textarea id="share-message" rows={4} value={message} onChange={(e) => setCustomMessage(e.target.value)} />
        <p className="break-all text-xs text-muted-foreground">Link added at the end: {url}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button asChild className="gap-2">
          <a href={smsHref(body, phone)}>
            <MessageSquare className="h-4 w-4" />
            Share by text
          </a>
        </Button>
        {canShare && (
          <Button type="button" variant="outline" className="gap-2" onClick={nativeShare}>
            <Share2 className="h-4 w-4" />
            More options
          </Button>
        )}
        <Button type="button" variant="outline" className="gap-2" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share by text opens your messages app with this ready to go. Nothing is sent until you hit send there.
      </p>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
        <div className="rounded-lg bg-white p-2">
          <QRCodeSVG value={url} size={96} fgColor="#1f3d2b" bgColor="#ffffff" />
        </div>
        <p className="text-sm text-muted-foreground">Guests standing next to you can scan this with their camera to open your guide.</p>
      </div>
    </div>
  );
}

export function ShareGuideDialog({ open, onOpenChange, ...props }: ShareGuideFormProps & { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share with a guest</DialogTitle>
          <DialogDescription>Send your guide by text. Bookings through this link count toward your commission.</DialogDescription>
        </DialogHeader>
        <ShareGuideForm {...props} />
      </DialogContent>
    </Dialog>
  );
}
