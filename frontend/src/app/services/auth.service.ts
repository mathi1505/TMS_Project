import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CurrentUser, LoginRequest, LoginResponse } from '../models/auth.model';

const STORAGE_KEY = 'tms.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<CurrentUser | null>(this.restore());
  private token: string | null = this.readToken();

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(res => this.persist(res))
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.token = null;
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return this.token;
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

  private persist(res: LoginResponse): void {
    const user: CurrentUser = { userId: res.userId, userNo: res.userNo, userName: res.userName, role: res.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: res.token, user }));
    this.token = res.token;
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
}
