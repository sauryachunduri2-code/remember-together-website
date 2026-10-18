// Our own visit counter. Sends one anonymous ping per page view to the team's Apps Script:
// the page path, and whether this is the first page of a new browser session.
// No cookies, no IDs, no personal details. Not a known tracker, so ad blockers let it through.
import { site } from '../site.config';

export function countVisit(page: string) {
  const host = window.location.hostname;
  if (!site.formEndpoint || host === 'localhost' || host === '127.0.0.1' || navigator.webdriver) return;

  // The flag stays on this device for this tab only and is never sent anywhere.
  let newVisit = '0';
  try {
    if (!sessionStorage.getItem('rt-visit')) {
      sessionStorage.setItem('rt-visit', '1');
      newVisit = '1';
    }
  } catch {
    newVisit = '1';
  }

  const body = JSON.stringify({ form: 'visit', page, newVisit });
  try {
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    if (navigator.sendBeacon?.(site.formEndpoint, blob)) return;
  } catch {}
  fetch(site.formEndpoint, { method: 'POST', mode: 'no-cors', keepalive: true, body }).catch(() => {});
}
