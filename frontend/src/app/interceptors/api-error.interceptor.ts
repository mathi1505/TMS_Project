import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'Something went wrong. Please try again.';

      if (err.error && typeof err.error === 'object' && 'message' in err.error) {
        message = (err.error as { message: string }).message;
      } else if (typeof err.error === 'string' && err.error.trim()) {
        message = err.error;
      } else if (err.status === 0) {
        message = 'Cannot reach the server. Please check that the backend is running.';
      } else if (err.message) {
        message = err.message;
      }

      const normalized = new Error(message) as Error & { status?: number };
      normalized.status = err.status;
      return throwError(() => normalized);
    })
  );
};
