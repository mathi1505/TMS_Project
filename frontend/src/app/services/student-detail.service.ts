import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { StudentDetail, TranIdCode } from '../models/student-detail.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class StudentDetailService extends CachedCrudService<StudentDetail> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/student-det`, r => r.delFlag === 'A');
  }

  padNum(n: number): string {
    return String(n);
  }

  combinedTranId(tranId: string, tranNumber: number): string {
    return `${tranId}-${this.padNum(tranNumber)}`;
  }

  getByStudentId(studentId: string, studentNumber?: number): Observable<StudentDetail[]> {
    let params = new HttpParams();
    if (studentNumber !== undefined && studentNumber !== null) {
      params = params.set('studentNumber', studentNumber);
    }
    return this.http.get<StudentDetail[]>(
      `${this.baseUrl}/student/${encodeURIComponent(studentId.trim().toUpperCase())}`, { params }
    );
  }

  getByKey(studentId: string, tranDate: string, tranId: TranIdCode, tranNumber: number,
           studentNumber?: number, entrySeq?: number): Observable<StudentDetail | undefined> {
    let params = new HttpParams()
      .set('studentId', studentId).set('tranDate', tranDate)
      .set('tranId', tranId).set('tranNumber', tranNumber);
    if (studentNumber !== undefined && studentNumber !== null) {
      params = params.set('studentNumber', studentNumber);
    }
    if (entrySeq !== undefined && entrySeq !== null) {
      params = params.set('entrySeq', entrySeq);
    }
    return undefinedOn404(this.http.get<StudentDetail>(`${this.baseUrl}/key`, { params }));
  }

  nextTranNumberAsync(studentId: string, tranId: TranIdCode, studentNumber?: number): Observable<number> {
    let params = new HttpParams().set('studentId', studentId).set('tranId', tranId);
    if (studentNumber !== undefined && studentNumber !== null) {
      params = params.set('studentNumber', studentNumber);
    }
    return this.http.get<number>(`${this.baseUrl}/next-tran-number`, { params });
  }

 create(record: StudentDetail): Observable<StudentDetail> {
  return this.postAndRefresh(this.baseUrl, record);
}

  update(record: StudentDetail): Observable<StudentDetail> {
    let params = new HttpParams()
      .set('studentId', record.studentId).set('tranDate', record.tranDate)
      .set('tranId', record.tranId).set('tranNumber', record.tranNumber);
    if (record.studentNumber !== undefined && record.studentNumber !== null) {
      params = params.set('studentNumber', record.studentNumber);
    }
    if (record.entrySeq !== undefined && record.entrySeq !== null) {
      params = params.set('entrySeq', record.entrySeq);
    }
    return this.putAndRefresh(this.baseUrl, record, params);
  }
}
