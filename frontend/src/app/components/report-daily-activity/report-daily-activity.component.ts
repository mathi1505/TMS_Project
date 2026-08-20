import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ReportService } from '../../services/report.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';
import {
  ReportDailyActivityHeader,
  ReportDailyActivityRow,
  ReportDownloadFormat,
  REPORT_DOWNLOAD_OPTIONS,
  REPORT_MONTH_OPTIONS,
} from '../../models/report.model';

@Component({
  selector: 'app-report-daily-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './report-daily-activity.component.html',
  styleUrl: './report-daily-activity.component.css'
})
export class ReportDailyActivityComponent implements OnInit {

  studentId = '';
  studentNumber = 0;

  header: ReportDailyActivityHeader | null = null;
  activities: ReportDailyActivityRow[] = [];

  monthOptions = REPORT_MONTH_OPTIONS;
  yearOptions: number[] = [];
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  downloadOptions = REPORT_DOWNLOAD_OPTIONS;
  downloadFormat: ReportDownloadFormat | '' = '';

  loading = true;
  notFound = false;

  readonly paginator = new Paginator<ReportDailyActivityRow>(() => this.activities);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportSvc: ReportService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    const currentYear = now.getFullYear();
    this.yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    this.route.queryParamMap.subscribe(params => {
      this.studentId = params.get('id') ?? '';
      this.studentNumber = Number(params.get('studentNumber') ?? 0);
      this.load();
    });
  }

  private load(): void {
    if (!this.studentId || !this.studentNumber) {
      this.loading = false;
      this.notFound = true;
      return;
    }
    this.loading = true;
    this.paginator.reset();
    this.reportSvc.dailyActivity(this.studentId, this.studentNumber, this.selectedMonth, this.selectedYear).subscribe({
      next: res => {
        this.header = res.header;
        this.activities = res.activities;
        this.notFound = false;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.notFound = true;
        this.toast.error(err.message);
      }
    });
  }

  onFilterChange(): void {
    this.load();
  }

  onBack(): void {
    this.router.navigate(['/report']);
  }

  onViewDetails(row: ReportDailyActivityRow): void {
  
    this.router.navigate(['/student-detail-form'], {
      queryParams: {
        mode: 'view',
        studentId: this.studentId,
        studentNumber: this.studentNumber,
        tranDate: row.tranDate,
        tranId: row.tranId,
        tranNumber: row.tranNumber,
        returnTo: `/report-daily-activity?id=${encodeURIComponent(this.studentId)}&studentNumber=${this.studentNumber}`
      }
    });
  }

  onDownload(): void {
    if (this.downloadFormat !== 'excel' && this.downloadFormat !== 'pdf') {
      this.toast.error('Invalid download option. Please choose Excel or PDF.');
      return;
    }
    this.reportSvc.exportDailyActivity(
      this.studentId, this.studentNumber, this.selectedMonth, this.selectedYear, this.downloadFormat
    ).subscribe({
      next: () => this.toast.success('Download started.'),
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRows(): ReportDailyActivityRow[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
