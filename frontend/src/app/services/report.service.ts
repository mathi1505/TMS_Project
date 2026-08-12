import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ExportFileResponse,
  ReportDailyActivityResponse,
  ReportDownloadFormat,
  ReportStudentSummary,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {

  private readonly baseUrl = `${environment.apiUrl}/report`;

  constructor(private http: HttpClient) {}

  searchStudents(name: string, studentType: string, studentNumber: number | null): Observable<ReportStudentSummary[]> {
    let params = new HttpParams();
    if (name?.trim()) params = params.set('name', name.trim());
    if (studentType) params = params.set('studentType', studentType);
    if (studentNumber !== null && studentNumber !== undefined) params = params.set('studentNumber', studentNumber);
    return this.http.get<ReportStudentSummary[]>(`${this.baseUrl}/students`, { params });
  }

  dailyActivity(studentId: string, studentNumber: number, month: number | null, year: number | null):
    Observable<ReportDailyActivityResponse> {
    let params = new HttpParams();
    if (month !== null) params = params.set('month', month);
    if (year !== null) params = params.set('year', year);
    return this.http.get<ReportDailyActivityResponse>(
      `${this.baseUrl}/students/${encodeURIComponent(studentId)}/${studentNumber}/daily-activity`,
      { params }
    );
  }

  exportStudents(name: string, studentType: string, studentNumber: number | null, format: ReportDownloadFormat):
    Observable<ExportFileResponse> {
    let params = new HttpParams().set('format', format);
    if (name?.trim()) params = params.set('name', name.trim());
    if (studentType) params = params.set('studentType', studentType);
    if (studentNumber !== null && studentNumber !== undefined) params = params.set('studentNumber', studentNumber);
    return this.http.get<ExportFileResponse>(`${this.baseUrl}/students/export`, { params })
      .pipe(tap(file => this.saveFile(file)));
  }

  exportDailyActivity(studentId: string, studentNumber: number, month: number | null, year: number | null,
                       format: ReportDownloadFormat): Observable<ExportFileResponse> {
    let params = new HttpParams().set('format', format);
    if (month !== null) params = params.set('month', month);
    if (year !== null) params = params.set('year', year);
    return this.http.get<ExportFileResponse>(
      `${this.baseUrl}/students/${encodeURIComponent(studentId)}/${studentNumber}/daily-activity/export`,
      { params }
    ).pipe(tap(file => this.saveFile(file)));
  }

  /** Turns a base64-wrapped file payload back into bytes and triggers a browser download. */
  private saveFile(file: ExportFileResponse): void {
    const binary = atob(file.base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: file.contentType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }
}
