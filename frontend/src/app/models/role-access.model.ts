export interface ScreenDefinition {
  code: string;
  name: string;
  group: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

export interface RoleAccessResponse {
  role: string;
  fullAccess: boolean;
  screenCodes: string[];
}

/**
 * Kept only as a client-side fallback (e.g. transient network hiccup right
 * after login) so the shell doesn't render a completely empty sidebar.
 * The backend ScreenCatalog in ScreenCatalog.java is the source of truth —
 * codes here must match it exactly.
 */
export const SCREEN_CATALOG: ScreenDefinition[] = [
  { code: 'DASH', name: 'Reports Dash Board',                group: 'Reports' },
  { code: 'CRSM', name: 'Course Master',                     group: 'Masters' },
  { code: 'STDM', name: 'Student Master',                    group: 'Masters' },
  { code: 'TRXM', name: 'Transaction Master',                group: 'Masters' },
  { code: 'CFGM', name: 'Configuration Master',              group: 'Masters' },
  { code: 'CRSD', name: 'Course Detail',                     group: 'Detailed' },
  { code: 'STDD', name: 'Student Daily Activity',             group: 'Detailed' },
  { code: 'TRXD', name: 'Daily Transaction Entry',            group: 'Detailed' },
  { code: 'RPTS', name: 'Student Information Report',         group: 'Reports' },
  { code: 'RPTA', name: 'Student Activity Dashboard Report',  group: 'Reports' },
  { code: 'RPTD', name: 'Student Daily Activity Report',      group: 'Reports' },
  { code: 'USRM', name: 'User Maintenance',                   group: 'Administration' },
  { code: 'MYAC', name: 'My Daily Activity',                  group: 'My Activity' },
];
