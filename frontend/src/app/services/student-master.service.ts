import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StudentMaster } from '../models/student-master.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class StudentMasterService extends CachedCrudService<StudentMaster> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/student-master`, r => r.delFlag === 'A');
  }

  getById(id: string): Observable<StudentMaster | undefined> {
    return undefinedOn404(
      this.http.get<StudentMaster>(`${this.baseUrl}/${encodeURIComponent(id.trim().toUpperCase())}`)
    );
  }

  getByIdAndNumber(id: string, studentNumber: number): Observable<StudentMaster | undefined> {
    return undefinedOn404(
      this.http.get<StudentMaster>(
        `${this.baseUrl}/${encodeURIComponent(id.trim().toUpperCase())}/${studentNumber}`
      )
    );
  }

  searchByName(name: string): Observable<StudentMaster[]> {
    const params = new HttpParams().set('name', name.trim());
    return this.http.get<StudentMaster[]>(`${this.baseUrl}/search`, { params });
  }

  previewNextId(type: string): Observable<string> {
    const params = new HttpParams().set('type', type);
    return this.http.get(`${this.baseUrl}/preview-next-id`, { params, responseType: 'text' });
  }

  previewNextNumber(type: string): Observable<number> {
    const params = new HttpParams().set('type', type);
    return this.http.get<number>(`${this.baseUrl}/preview-next-number`, { params });
  }
create(record: StudentMaster, typeCode: string): Observable<StudentMaster> {
  const params = new HttpParams().set('typeCode', typeCode);
  return this.postAndRefresh(this.baseUrl, record, params);
}

  update(record: StudentMaster): Observable<StudentMaster> {
    return this.putAndRefresh(
      `${this.baseUrl}/${encodeURIComponent(record.studentId)}/${record.studentNumber}`,
      record
    );
  }
}
