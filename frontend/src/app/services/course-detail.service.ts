import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CourseDetail } from '../models/course-detail.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class CourseDetailService extends CachedCrudService<CourseDetail> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/course-detail`, r => r.delFlag === 'A');
  }

  getByCourseId(courseId: string): Observable<CourseDetail[]> {
    return this.http.get<CourseDetail[]>(`${this.baseUrl}/course/${encodeURIComponent(courseId.trim().toUpperCase())}`);
  }

  getByKey(courseId: string, courseDetId: number): Observable<CourseDetail | undefined> {
    return undefinedOn404(
      this.http.get<CourseDetail>(
        `${this.baseUrl}/${encodeURIComponent(courseId.trim().toUpperCase())}/${courseDetId}`
      )
    );
  }

  create(record: CourseDetail): Observable<CourseDetail> {
    const payload = { ...record, courseId: record.courseId.trim().toUpperCase() };
    return this.postAndRefresh(this.baseUrl, payload);
  }

  update(record: CourseDetail): Observable<CourseDetail> {
    const courseId = record.courseId.trim().toUpperCase();
    return this.putAndRefresh(`${this.baseUrl}/${encodeURIComponent(courseId)}/${record.courseDetId}`, record);
  }

  nextDetIdAsync(courseId: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/next-id/${encodeURIComponent(courseId.trim().toUpperCase())}`);
  }
}
