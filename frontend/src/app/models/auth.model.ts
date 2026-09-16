import { ConfigDetail } from './config-master.model';


export type Role = string;


export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'ADMIN',   label: 'Administrator' },
  { value: 'STAFF',   label: 'Staff' },
  { value: 'STUDENT', label: 'Student' }
];

export function roleLabel(role: Role): string {
  return ROLE_OPTIONS.find(o => o.value === role)?.label ?? role;
}


const LEGACY_LABEL_TO_CODE: Record<string, Role> = {
  ADMINISTRATOR: 'ADMIN',
  STUDENTS: 'STUDENT'
};

function splitConfigEntry(configName: string): { code: string; label: string } {
  const name = (configName ?? '').trim();
  const dashIdx = name.search(/[-–—]/);
  if (dashIdx > 0) {
    const code = name.slice(0, dashIdx).trim().toUpperCase();
    const label = name.slice(dashIdx + 1).trim();
    if (code) return { code, label: label || code };
  }
  const bareCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return { code: LEGACY_LABEL_TO_CODE[bareCode] ?? bareCode, label: name };
}


export function roleOptionsFromConfig(rows: ConfigDetail[]): { value: Role; label: string }[] {
  const roleRows = rows.filter(r => r.configMaster === 'ROLE');
  const resolved = roleRows
    .map(r => splitConfigEntry(r.configName))
    .filter(x => !!x.code)
    .map(({ code, label }) => ({ value: code, label }));
  return resolved.length ? resolved : ROLE_OPTIONS;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  userNo: number;
  userName: string;
  role: Role;
  sessionId: string;
}

export interface CurrentUser {
  userId: string;
  userNo: number;
  userName: string;
  role: Role;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
