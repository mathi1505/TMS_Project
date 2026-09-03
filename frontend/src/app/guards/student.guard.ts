import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


export const studentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isStudent()) return true;

  router.navigate(['/dashboard']);
  return false;
};

export const notStudentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isStudent()) {
    router.navigate(['/my-activity']);
    return false;
  }

  return true;
};
