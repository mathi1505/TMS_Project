import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CourseMaster } from '../models/course-master.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class CourseMasterService extends CachedCrudService<CourseMaster> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/course-master`, r => r.delFlag === 'A');
  }

  getById(id: string): Observable<CourseMaster | undefined> {
    return undefinedOn404(
      this.http.get<CourseMaster>(`${this.baseUrl}/${encodeURIComponent(id.trim().toUpperCase())}`)
    );
  }

  create(record: CourseMaster): Observable<CourseMaster> {
    const payload = { ...record, id: record.id.trim().toUpperCase() };
    return this.postAndRefresh(this.baseUrl, payload);
  }

  update(record: CourseMaster): Observable<CourseMaster> {
    const id = record.id.trim().toUpperCase();
    return this.putAndRefresh(`${this.baseUrl}/${encodeURIComponent(id)}`, record);
  }
}
