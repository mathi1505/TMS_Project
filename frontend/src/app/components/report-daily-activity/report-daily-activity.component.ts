import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ReportService } from '../../services/report.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';
import {
  ReportDailyActivityHeader,
  ReportDailyActivityListRow,
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
export class ReportDailyActivityComponent implements OnInit, OnDestroy {


  listMode = false;

  returnTo = '/report';

  downloadOptions = REPORT_DOWNLOAD_OPTIONS;
  downloadFormat: ReportDownloadFormat | '' = '';

  loading = true;

  studentId = '';
  studentNumber = 0;

  
  filterParticular = '';

  header: ReportDailyActivityHeader | null = null;
  allActivities: ReportDailyActivityRow[] = [];
  activities: ReportDailyActivityRow[] = [];

  selectedRow: ReportDailyActivityRow | null = null;

  monthOptions = REPORT_MONTH_OPTIONS;
  yearOptions: number[] = [];
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  notFound = false;

  readonly paginator = new Paginator<ReportDailyActivityRow>(() => this.activities);

  searchType = '';
  searchParticular = '';
  searchNumber: number | null = null;
  currentDayOnly = false;

  studentTypeOptions: { value: string; label: string }[] = [];
  particularOptions: string[] = [];

  listRows: ReportDailyActivityListRow[] = [];
  selectedListRow: ReportDailyActivityListRow | null = null;

  readonly listPaginator = new Paginator<ReportDailyActivityListRow>(() => this.listRows);

  private configSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportSvc: ReportService,
    private configDetSvc: ConfigDetailService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const now = new Date();

  
    this.selectedMonth = null;
    this.selectedYear = null;

    const currentYear = now.getFullYear();
    this.yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));

      this.particularOptions = rows
        .filter(r => r.configMaster === 'TRAN')
        .map(r => r.configName);
    });
    this.configDetSvc.getAll().subscribe();

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id') ?? '';
      const num = params.get('studentNumber');

      this.returnTo = params.get('returnTo') ?? '/report';

      if (id && num) {
       
        this.listMode = false;
        this.studentId = id;
        this.studentNumber = Number(num);
        this.filterParticular = params.get('tranParticular') ?? '';
        this.load();
      } else {
       
        this.listMode = true;
        this.searchType = params.get('studentType') ?? '';
        this.searchParticular = params.get('tranParticular') ?? '';
        const incomingNumber = params.get('studentNumber');
        this.searchNumber = incomingNumber ? Number(incomingNumber) : null;
        this.currentDayOnly = params.get('currentDayOnly') === 'true';
        this.search();
      }
    });
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
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
        this.allActivities = res.activities;
        this.activities = this.applyParticularFilter(res.activities);
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

 
  private applyParticularFilter(rows: ReportDailyActivityRow[]): ReportDailyActivityRow[] {
    if (!this.filterParticular) return rows;
    return rows.filter(r => r.tranParticular === this.filterParticular);
  }

  onFilterChange(): void {
    this.load();
  }


  clearParticularFilter(): void {
    this.filterParticular = '';
    this.activities = this.allActivities;
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
        entrySeq: row.entrySeq,
        returnTo: this.currentSingleStudentUrl()
      }
    });
  }

  
  private currentSingleStudentUrl(): string {
    const params = new URLSearchParams();
    params.set('id', this.studentId);
    params.set('studentNumber', String(this.studentNumber));
    if (this.filterParticular) params.set('tranParticular', this.filterParticular);
    params.set('returnTo', this.returnTo);
    return `/report-daily-activity?${params.toString()}`;
  }

  closeDetails(): void {
    this.selectedRow = null;
  }



  onListFilterChange(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.listPaginator.reset();
    this.reportSvc.dailyActivityList(this.searchType, this.searchParticular, this.searchNumber, this.currentDayOnly)
      .subscribe({
        next: rows => {
          this.listRows = rows;
          this.loading = false;
        },
        error: (err: Error) => { this.loading = false; this.toast.error(err.message); }
      });
  }

  clearListSearch(): void {
    this.searchType = '';
    this.searchParticular = '';
    this.searchNumber = null;
    this.currentDayOnly = false;
    this.search();
  }

  onViewListDetails(row: ReportDailyActivityListRow): void {
    this.selectedListRow = row;
  }

  closeListDetails(): void {
    this.selectedListRow = null;
  }

 

  onBack(): void {
    this.router.navigateByUrl(this.returnTo);
  }

  onDownload(): void {
    if (this.downloadFormat !== 'excel' && this.downloadFormat !== 'pdf') {
      this.toast.error('Invalid download option. Please choose Excel or PDF.');
      return;
    }
    if (this.listMode) {
      this.reportSvc.exportActivities(this.searchType, this.searchParticular, this.searchNumber, this.downloadFormat)
        .subscribe({
          next: () => this.toast.success('Download started.'),
          error: (err: Error) => this.toast.error(err.message)
        });
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

  get listCurrentPage(): number { return this.listPaginator.currentPage; }
  get listTotalPages(): number { return this.listPaginator.totalPages; }
  get pagedListRows(): ReportDailyActivityListRow[] { return this.listPaginator.paged; }
  get listRangeStart(): number { return this.listPaginator.rangeStart; }
  get listRangeEnd(): number { return this.listPaginator.rangeEnd; }

  goToListPage(p: number): void { this.listPaginator.goToPage(p); }
}
