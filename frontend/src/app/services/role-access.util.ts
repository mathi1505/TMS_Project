/** Screen code -> the route it opens. Keep in sync with app.routes.ts. */
export const SCREEN_ROUTES: Record<string, string> = {
  DASH: '/dashboard',
  CRSM: '/course-master',
  STDM: '/student-master',
  TRXM: '/transaction-master',
  CFGM: '/config-master',
  CRSD: '/course-detail',
  STDD: '/student-detail',
  TRXD: '/transaction-detail',
  RPTS: '/report',
  RPTA: '/report-activity',
  RPTD: '/report-daily-activity',
  USRM: '/user-master',
  MYAC: '/my-activity',
};

/** Priority order used to pick a landing page when a user is denied a route. */
const FALLBACK_ORDER = [
  'DASH', 'MYAC', 'CRSM', 'STDM', 'TRXM', 'CFGM',
  'CRSD', 'STDD', 'TRXD', 'RPTS', 'RPTA', 'RPTD', 'USRM'
];

/** First route (in FALLBACK_ORDER) the given screen codes allow, or null if none. */
export function firstAccessibleRoute(codes: string[]): string | null {
  for (const code of FALLBACK_ORDER) {
    if (codes.includes(code)) return SCREEN_ROUTES[code];
  }
  return null;
}
