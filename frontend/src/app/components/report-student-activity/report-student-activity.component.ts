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
  ReportDownloadFormat,
  ReportStudentActivitySummary,
  REPORT_DOWNLOAD_OPTIONS,
} from '../../models/report.model';

@Component({
  selector: 'app-report-student-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './report-student-activity.component.html',
  styleUrl: './report-student-activity.component.css'
})
export class ReportStudentActivityComponent implements OnInit, OnDestroy {

  searchType = '';
  searchParticular = '';
  searchNumber: number | null = null;

 
  currentDayOnly = false;

  studentTypeOptions: { value: string; label: string }[] = [];
  particularOptions: string[] = [];
  downloadOptions = REPORT_DOWNLOAD_OPTIONS;
  downloadFormat: ReportDownloadFormat | '' = '';

  records: ReportStudentActivitySummary[] = [];
  loading = false;

  
  returnTo = '/dashboard';

  readonly paginator = new Paginator<ReportStudentActivitySummary>(() => this.records);

  private configSub?: Subscription;

  constructor(
    private reportSvc: ReportService,
    private configDetSvc: ConfigDetailService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    
    const incomingParticular = this.route.snapshot.queryParamMap.get('tranParticular');
    if (incomingParticular) {
      this.searchParticular = incomingParticular;
    }
    const incomingType = this.route.snapshot.queryParamMap.get('studentType');
    if (incomingType) {
      this.searchType = incomingType;
    }
    const incomingReturnTo = this.route.snapshot.queryParamMap.get('returnTo');
    if (incomingReturnTo) {
      this.returnTo = incomingReturnTo;
    }
    const incomingNumber = this.route.snapshot.queryParamMap.get('searchNumber');
    if (incomingNumber) {
      this.searchNumber = Number(incomingNumber);
    }
    const incomingCurrentDayOnly = this.route.snapshot.queryParamMap.get('currentDayOnly');
    if (incomingCurrentDayOnly === 'true') {
      this.currentDayOnly = true;
    }

    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));

      
      this.particularOptions = rows
        .filter(r => r.configMaster === 'TRAN')
        .map(r => r.configName);
    });
    this.configDetSvc.getAll().subscribe();

    this.search();
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  onFilterChange(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.paginator.reset();
    this.reportSvc.searchActivities(this.searchType, this.searchParticular, this.searchNumber, this.currentDayOnly)
      .subscribe({
        next: rows => {
          this.records = rows;
          this.loading = false;
        },
        error: (err: Error) => { this.loading = false; this.toast.error(err.message); }
      });
  }

  clearSearch(): void {
    this.searchType = '';
    this.searchParticular = '';
    this.searchNumber = null;
    this.currentDayOnly = false;
    this.search();
  }

  typeLabel(row: ReportStudentActivitySummary): string {
    const found = this.studentTypeOptions.find(o => o.value === row.studentType);
    return found ? found.label : row.studentType;
  }

  particularBadgeClass(particular: string): string {
    if (!particular) return '';
    const p = particular.toLowerCase();
    if (p.includes('progress')) return 'status-in-progress';
    if (p.includes('complet')) return 'status-completed';
    if (p.includes('left') || p.includes('drop')) return 'status-left';
    if (p.includes('shift')) return 'status-transferred';
    return 'status-transferred';
  }


  onViewDetail(row: ReportStudentActivitySummary): void {
    this.router.navigate(['/student-detail-form'], {
      queryParams: {
        mode: 'view',
        studentId: row.studentId,
        studentNumber: row.studentNumber,
        tranDate: row.tranDate,
        tranId: row.tranId,
        tranNumber: row.tranNumber,
        entrySeq: row.entrySeq,
        returnTo: this.currentUrl()
      }
    });
  }

  onBack(): void {
    this.router.navigateByUrl(this.returnTo);
  }

 
  onRowDailyActivity(row: ReportStudentActivitySummary): void {
    this.router.navigate(['/report-daily-activity'], {
      queryParams: {
        id: row.studentId,
        studentNumber: row.studentNumber,
        tranParticular: this.searchParticular || null,
        returnTo: this.currentUrl()
      }
    });
  }


  private currentUrl(): string {
    const params = new URLSearchParams();
    if (this.searchType) params.set('studentType', this.searchType);
    if (this.searchParticular) params.set('tranParticular', this.searchParticular);
    if (this.searchNumber !== null && this.searchNumber !== undefined) {
      params.set('searchNumber', String(this.searchNumber));
    }
    if (this.currentDayOnly) params.set('currentDayOnly', 'true');
    params.set('returnTo', this.returnTo);
    const query = params.toString();
    return query ? `/report-activity?${query}` : '/report-activity';
  }

  onDownload(): void {
    if (this.downloadFormat !== 'excel' && this.downloadFormat !== 'pdf') {
      this.toast.error('Invalid download option. Please choose Excel or PDF.');
      return;
    }
    this.reportSvc.exportActivities(this.searchType, this.searchParticular, this.searchNumber, this.downloadFormat)
      .subscribe({
        next: () => this.toast.success('Download started.'),
        error: (err: Error) => this.toast.error(err.message)
      });
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): ReportStudentActivitySummary[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
