import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { decryptText, encryptText } from '../services/crypto.util';

export const encryptionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const key = environment.encryptionKey;



  const textReq = req.clone({ responseType: 'text' });
  const hasBody = req.body !== null && req.body !== undefined;

  const outgoing$ = hasBody
    ? from(encryptText(JSON.stringify(req.body), key)).pipe(
        switchMap((encryptedBody) =>
          next(
            textReq.clone({
              body: encryptedBody,
              headers: textReq.headers.set('Content-Type', 'text/plain'),
            })
          )
        )
      )
    : next(textReq);

  return outgoing$.pipe(
    switchMap((event) => {
      if (!(event instanceof HttpResponse)) {
        return of(event);
      }
      const rawBody = event.body;
      if (typeof rawBody !== 'string' || rawBody.length === 0) {
        return of(event);
      }
      return from(decryptText(rawBody, key)).pipe(map((decryptedText) => event.clone({ body: parseIfJson(decryptedText) })));
    }),
    catchError((err: HttpErrorResponse) => {



      if (typeof err.error === 'string' && err.error.length > 0) {
        return from(decryptText(err.error, key)).pipe(
          map(
            (decryptedText) =>
              new HttpErrorResponse({
                error: parseIfJson(decryptedText),
                headers: err.headers,
                status: err.status,
                statusText: err.statusText,
                url: err.url ?? undefined,
              })
          ),
          switchMap((decryptedErr) => throwError(() => decryptedErr)),
          catchError(() => throwError(() => err))
        );
      }
      return throwError(() => err);
    })
  );
};

function parseIfJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {

    return text;
  }
}