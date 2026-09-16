import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { RoleAccessService } from './services/role-access.service';
import { ToastMessage, ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  sidebarCollapsed = false;
  toast: ToastMessage | null = null;
  toastVisible = false;
  private toastTimer: any;

  isLoginPage = false;

  constructor(public auth: AuthService, public roleAccess: RoleAccessService, private router: Router, toastService: ToastService) {
    this.isLoginPage = this.isBareRoute(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this.isLoginPage = this.isBareRoute(e.urlAfterRedirects);
      });

    // Refresh the permission cache in the background on a hard page reload
    // (already-logged-in session) so an admin's Role Access changes are
    // picked up without forcing everyone to log out and back in.
    if (this.auth.isLoggedIn() && !this.auth.isAdmin()) {
      this.roleAccess.loadMyScreens().subscribe({ error: () => {} });
    }

    toastService.messages$.subscribe(msg => this.showToast(msg));
  }

  private isBareRoute(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/change-password');
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  private showToast(msg: ToastMessage): void {
    clearTimeout(this.toastTimer);
    this.toast = msg;

    setTimeout(() => { this.toastVisible = true; }, 20);
    this.toastTimer = setTimeout(() => { this.dismissToast(); }, 3500);
  }

  dismissToast(): void {
    this.toastVisible = false;
    setTimeout(() => { this.toast = null; }, 350);
  }
}
