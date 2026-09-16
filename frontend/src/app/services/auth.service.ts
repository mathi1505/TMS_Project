import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangePasswordRequest, CurrentUser, LoginRequest, LoginResponse } from '../models/auth.model';
import { RoleAccessService } from './role-access.service';

const STORAGE_KEY = 'tms.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<CurrentUser | null>(this.restore());
  private token: string | null = this.readToken();
  private sessionId: string | null = this.readSessionId();

  constructor(private http: HttpClient, private roleAccess: RoleAccessService) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(res => this.persist(res)),
      tap(() => this.roleAccess.loadMyScreens().subscribe())
    );
  }

  logout(): void {
    // Fire-and-forget: stamps logout_date_time on the activity_log row for
    // this session. Not awaited, since callers expect logout() to clear
    // local state synchronously regardless of network conditions.
    if (this.sessionId) {
      this.http.post(`${this.baseUrl}/logout`, null, { params: { sessionId: this.sessionId } }).subscribe({ error: () => {} });
    }

    localStorage.removeItem(STORAGE_KEY);
    this.token = null;
    this.sessionId = null;
    this.currentUser.set(null);
    this.roleAccess.clearMyScreens();
  }

  getToken(): string | null {
    return this.token;
  }

  /**
   * The session_id issued at login, echoed back on every subsequent API
   * call (via sessionInterceptor) so the backend can attribute menu
   * visits, creates and modifications to the right activity_log row.
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  isStaff(): boolean {
    return this.currentUser()?.role === 'STAFF';
  }

  isStudent(): boolean {
    return this.currentUser()?.role === 'STUDENT';
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/change-password`, request);
  }

  /**
   * Nothing is stored on the backend for this — no extra column. Instead we
   * remember, per account, on this browser only, that the "change your
   * password?" prompt has already been shown once, so it never shows again
   * on later, regular logins from here.
   */
  hasSeenChangePasswordPrompt(userId: string, userNo: number): boolean {
    return localStorage.getItem(this.promptSeenKey(userId, userNo)) === '1';
  }

  markChangePasswordPromptSeen(userId: string, userNo: number): void {
    localStorage.setItem(this.promptSeenKey(userId, userNo), '1');
  }

  private promptSeenKey(userId: string, userNo: number): string {
    return `tms.changePasswordPromptSeen.${userId}-${userNo}`;
  }

  private persist(res: LoginResponse): void {
    const user: CurrentUser = { userId: res.userId, userNo: res.userNo, userName: res.userName, role: res.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.token, sessionId: res.sessionId, user }));
    this.token = res.token;
    this.sessionId = res.sessionId;
    this.currentUser.set(user);
  }

  private restore(): CurrentUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return (JSON.parse(raw).user as CurrentUser) ?? null;
    } catch {
      return null;
    }
  }

  private readToken(): string | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw).token ?? null;
    } catch {
      return null;
    }
  }

  private readSessionId(): string | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw).sessionId ?? null;
    } catch {
      return null;
    }
  }
}
