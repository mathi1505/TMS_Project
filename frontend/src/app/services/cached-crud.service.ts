import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export abstract class CachedCrudService<T> {

  private readonly dataSubject = new BehaviorSubject<T[]>([]);

  readonly data$ = this.dataSubject.asObservable();

  readonly activeData$: Observable<T[]> = this.data$.pipe(map(rows => rows.filter(this.isActive)));

  protected constructor(
    protected readonly http: HttpClient,
    protected readonly baseUrl: string,
    private readonly isActive: (record: T) => boolean
  ) {}

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl).pipe(tap(rows => this.dataSubject.next(rows)));
  }

  refresh(): void {
    this.getAll().subscribe();
  }

  protected postAndRefresh<R = T>(url: string, payload: unknown, params?: HttpParams): Observable<R> {
    return this.http.post<R>(url, payload, { params }).pipe(tap(() => this.refresh()));
  }

  protected putAndRefresh<R = T>(url: string, payload: unknown, params?: HttpParams): Observable<R> {
    return this.http.put<R>(url, payload, { params }).pipe(tap(() => this.refresh()));
  }
}
