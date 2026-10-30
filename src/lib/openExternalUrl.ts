import { Capacitor } from '@capacitor/core';

/**
 * Opens an external URL: in-app browser on native (Capacitor), new tab on web.
 * Falls back to same-tab navigation if the browser blocks the popup.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch (error) {
      console.error('In-app browser failed, falling back:', error);
    }
  }
  // Note: passing 'noopener' makes window.open always return null, so detach manually.
  const win = window.open(url, '_blank');
  if (win) {
    try { win.opener = null; } catch { /* cross-origin, ignore */ }
  } else {
    window.location.assign(url);
  }
}
