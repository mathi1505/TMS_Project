import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoleAccessService } from '../services/role-access.service';
import { firstAccessibleRoute } from '../services/role-access.util';

/**
 * Guards a route behind a Role Access screen code (see ScreenCatalog.java /
 * role-access.model.ts). ADMIN always passes, EXCEPT for 'MYAC' (My Daily
 * Activity) — that screen is a student's own self-entry log and is
 * deliberately kept out of admin's access, so it falls through to the
 * normal codes-based check below (the backend also excludes MYAC from
 * ADMIN's screen list, so that check will correctly deny it).
 * Every other role is checked against whatever the admin configured on the
 * Role Access screen.
 *
 * Replaces the old fixed adminGuard/studentGuard/notStudentGuard checks for
 * screen *visibility* — write-level adminGuard checks on the "-form" routes
 * are left in place alongside this guard, unchanged.
 */
export function screenGuard(screenCode: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const roleAccess = inject(RoleAccessService);
    const router = inject(Router);

    if (auth.isAdmin() && screenCode !== 'MYAC') return true;

    const cached = roleAccess.myScreens();
    if (cached !== null) {
      return decide(cached, screenCode, router);
    }

    return roleAccess.loadMyScreens().pipe(
      map(codes => decide(codes, screenCode, router)),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
}

function decide(codes: string[], screenCode: string, router: Router): boolean {
  if (codes.includes(screenCode)) return true;

  const fallback = firstAccessibleRoute(codes);
  if (fallback) {
    router.navigate([fallback]);
  } else {
    router.navigate(['/login']);
  }
  return false;
}
