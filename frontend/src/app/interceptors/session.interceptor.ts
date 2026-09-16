import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Echoes the session_id issued at login back to the backend on every API
 * call, via the X-Session-Id header. The backend's ActivityAuditInterceptor
 * uses this to attribute menu visits, creates and modifications to the
 * right activity_log row (spec 2.2.3). Auth endpoints are skipped since
 * there's no session yet at login time, and the logout call sends its own
 * sessionId explicitly as a query param.
 */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const sessionId = inject(AuthService).getSessionId();
  const reqWithSession = sessionId ? req.clone({ setHeaders: { 'X-Session-Id': sessionId } }) : req;

  return next(reqWithSession);
};
