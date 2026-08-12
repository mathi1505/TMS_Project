import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function undefinedOn404<T>(source: Observable<T>): Observable<T | undefined> {
  return source.pipe(
    catchError((err: Error & { status?: number }) => {
      if (err.status === 404) {
        return of(undefined);
      }
      throw err;
    })
  );
}
