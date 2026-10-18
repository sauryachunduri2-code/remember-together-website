// Everything a teammate might need to change lives here.
export const site = {
  name: 'Remember Together',
  // Update to the real address once Vercel assigns it (used for share previews and the sitemap).
  url: 'https://remembertogether.vercel.app',
  description:
    'Remember Together is a free dementia awareness app and campaign by high school HOSA students. Learn the warning signs, find caregiver guides and helplines, and get involved.',
  email: 'remembertogetherhosa@gmail.com',
  instagram: {
    handle: 'remembertogetherhosa',
    url: 'https://www.instagram.com/remembertogetherhosa/',
  },
  // Google Apps Script web app URL that receives every form. See apps-script/README.md.
  formEndpoint: 'https://script.google.com/macros/s/AKfycbz-2-vD3FvSBpV4e1B-g6nFw7-J_7SiwGP3iutn1TDk2wTU10G4iqbDuOAUeSrPDxQ02A/exec',
  // Google Analytics 4 measurement ID, for example G-XXXXXXXXXX. Left empty, no analytics load.
  gaId: 'G-M46W867X6W',
  appStoreUrl: null as string | null,
} as const;

export const nav = [
  { href: '/learn/', label: 'Learn' },
  { href: '/caregivers/', label: 'Caregivers' },
  { href: '/resources/', label: 'Resources' },
  { href: '/stories/', label: 'Stories' },
  { href: '/get-involved/', label: 'Get involved' },
  { href: '/about/', label: 'About' },
] as const;
