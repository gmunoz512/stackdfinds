import { describe, expect, it } from 'vitest';
import { cleanGuestName, defaultShareMessage, shareGuideUrl, shareText, smsHref } from '@/lib/shareGuide';

describe('share guide by text', () => {
  it('builds the personalized guide link with host ref', () => {
    expect(shareGuideUrl('h1')).toBe('https://stackdfinds.com/guide/h1?host=h1');
    expect(shareGuideUrl('h1', 'Rental Home Guest')).toBe('https://stackdfinds.com/guide/h1?host=h1&guest=Rental+Home+Guest');
  });
  it('cleans guest names', () => {
    expect(cleanGuestName('  <Sarah>  ')).toBe('Sarah');
    expect(cleanGuestName('x'.repeat(80))).toHaveLength(40);
  });
  it('writes a friendly default message', () => {
    const m = defaultShareMessage({ guestName: 'Sarah', propertyName: 'Casa Sol', arrivalDate: '2026-12-10' });
    expect(m).toContain('Hey Sarah!');
    expect(m).toContain('at Casa Sol');
    expect(m).toContain('December 10');
  });
  it('builds an sms link with an encoded body', () => {
    const body = shareText('Hi!', 'https://stackdfinds.com/guide/h1?host=h1');
    const href = smsHref(body, '+1 (555) 010-2000');
    expect(href.startsWith('sms:+15550102000?&body=')).toBe(true);
    expect(decodeURIComponent(href.split('body=')[1])).toBe(body);
    expect(smsHref('a').startsWith('sms:?&body=')).toBe(true);
  });
});
