// EN strings for v1. All UI copy lives here — never hardcoded in components.
// Future `bn/` locale adds src/i18n/bn.ts with the same Dict shape (WP rule: AGENTS.md).
export const en = {
  brand: {
    name: 'SPEEDCUBING BANGLADESH',
    // Single candidate-accurate lockup. Used by every surface (content-accuracy rule).
    status: 'Prospective WCA Regional Organization',
  },
  nav: [
    { href: '/about', label: 'About' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/records', label: 'Records' },
    { href: '/faq', label: 'FAQ' },
    { href: '/worlds-2027', label: 'Worlds 2027' },
    { href: '/contact', label: 'Contact' },
  ],
  auth: {
    login: 'WCA Login',
    loginHref: '/api/auth/login',
    logout: 'Log Out',
  },
  footer: {
    links: [
      { href: '/about', label: 'About Us' },
      { href: 'https://www.worldcubeassociation.org/regulations', label: 'WCA Regulations', external: true },
      { href: '/competitions', label: 'Competitions' },
      { href: '/records', label: 'National Records' },
      { href: '/people', label: 'Our People' },
      { href: '/news', label: 'News' },
      { href: '/sponsors', label: 'Sponsors' },
      { href: '/lost-found', label: 'Lost & Found' },
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Contact Support' },
    ],
    // Real handles as they arrive; '#' renders nothing (see Base footer).
    socials: [
      { label: 'Facebook', href: 'https://www.facebook.com/SpeedcubingBD/' },
      { label: 'Instagram', href: '#' },
      { label: 'YouTube', href: '#' },
    ],
    legal:
      '© 2026 Speedcubing Bangladesh. Prospective WCA Regional Organization. Results, records and rankings mirror the World Cube Association database.',
  },
  common: {
    verifyOnWca: 'Verify on worldcubeassociation.org',
    cachedNotice: 'Showing cached data — see WCA Live for the latest.',
  },
  home: {
    badge: 'Prospective WCA Regional Organization',
    headline: 'Fueling the Passion for Speedcubing in Bangladesh.',
    sub: 'From first sub-1-minute solves to national records — join official WCA competitions across Bangladesh.',
    ctaComps: 'View Competitions',
    ctaAbout: 'About Us',
    recordsTitle: "Bangladesh's Best Records",
    compsTitle: 'Upcoming Competitions',
    worldsTitle: 'Bangladesh to WCA World Championship 2027',
  },
} as const;

export type Dict = typeof en;
