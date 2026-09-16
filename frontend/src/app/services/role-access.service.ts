import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RoleAccessResponse, RoleOption, ScreenDefinition, SCREEN_CATALOG
} from '../models/role-access.model';

const SCREENS_STORAGE_PREFIX = 'tms.myScreens.';
// Must match AuthService's STORAGE_KEY — read directly rather than injecting
// AuthService, which would create a circular dependency (AuthService already
// injects this service).
const AUTH_STORAGE_KEY = 'tms.auth';

@Injectable({ providedIn: 'root' })
export class RoleAccessService {

  private readonly baseUrl = `${environment.apiUrl}/role-access`;

  /**
   * Screen codes the CURRENTLY LOGGED IN user may open.
   * null  = not loaded yet this session (guards will fetch it; canAccess()
   *         treats null as "nothing granted yet", not "everything granted").
   * ADMIN never needs this — it always has full access.
   */
  readonly myScreens = signal<string[] | null>(this.restoreMyScreens());

  constructor(private http: HttpClient) {}

  // ---------- Role Access admin screen ----------

  getScreens(): Observable<ScreenDefinition[]> {
    return this.http.get<ScreenDefinition[]>(`${this.baseUrl}/screens`);
  }

  getRoles(): Observable<RoleOption[]> {
    return this.http.get<RoleOption[]>(`${this.baseUrl}/roles`);
  }

  getAccessForRole(role: string): Observable<RoleAccessResponse> {
    return this.http.get<RoleAccessResponse>(`${this.baseUrl}/${role}`);
  }

  saveAccessForRole(role: string, screenCodes: string[]): Observable<RoleAccessResponse> {
    return this.http.put<RoleAccessResponse>(`${this.baseUrl}/${role}`, { screenCodes });
  }

  // ---------- current-user permission gate ----------

  /** Call after login (and once on app start-up if already logged in). */
  loadMyScreens(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/my-screens`).pipe(
      tap(codes => {
        this.myScreens.set(codes);
        const key = this.currentScreensKey();
        if (key) {
          localStorage.setItem(key, JSON.stringify(codes));
        }
      })
    );
  }

  /**
   * Call on logout. Sweeps every cached screen list on this browser (not
   * just the current user's key) so a stale, more-privileged list can never
   * be picked up by whoever logs in next on this device — e.g. if a prior
   * session ended without a clean logout.
   */
  clearMyScreens(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SCREENS_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    this.myScreens.set(null);
  }

  /**
   * Synchronous check for templates (sidebar). Fails CLOSED: until this
   * session's screen list has actually loaded, every gated item is hidden
   * rather than shown. Failing open here would briefly reveal every menu
   * item — including ones a role was never granted — during that window,
   * which is exactly the kind of gap that let a restricted account see
   * screens it wasn't supposed to.
   */
  canAccess(screenCode: string): boolean {
    const codes = this.myScreens();
    if (codes === null) return false;
    return codes.includes(screenCode);
  }

  fallbackCatalog(): ScreenDefinition[] {
    return SCREEN_CATALOG;
  }

  /** `${userId}-${userNo}`, scoping the cached screen list to one account. */
  private currentUserKey(): string | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw)?.user;
      if (!user?.userId || user?.userNo === undefined || user?.userNo === null) {
        return null;
      }
      return `${user.userId}-${user.userNo}`;
    } catch {
      return null;
    }
  }

  private currentScreensKey(): string | null {
    const userKey = this.currentUserKey();
    return userKey ? `${SCREENS_STORAGE_PREFIX}${userKey}` : null;
  }

  private restoreMyScreens(): string[] | null {
    const key = this.currentScreensKey();
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return null;
    }
  }
}
