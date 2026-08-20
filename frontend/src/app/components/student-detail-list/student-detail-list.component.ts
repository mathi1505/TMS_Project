import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentDetail, TRAN_PARTICULAR_OPTIONS } from '../../models/student-detail.model';
import { StudentDetailService } from '../../services/student-detail.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { ReportService } from '../../services/report.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';
import { ReportDownloadFormat, REPORT_DOWNLOAD_OPTIONS } from '../../models/report.model';

/**
 * Reports Dash Board activity tiles use merged/synthetic status codes
 * (Left + Dropped combined into one tile, "Others" has no tile). This maps
 * those codes back to the raw Tran_particular values stored on each record,
 * and to the label shown in the "Results for" strip.
 */
const ACTIVITY_BUCKETS: Record<string, { label: string; values: string[] }> = {
  IN_PROGRESS: { label: 'In Progress', values: ['In Progress'] },
  COMPLETED: { label: 'Completed', values: ['Completed'] },
  LEFT_DROPPED: { label: 'Left / Dropped', values: ['Left', 'Dropped'] },
  SHIFTED: { label: 'Shifted to Main office', values: ['Shifted to Main office'] },
};

@Component({
  selector: 'app-student-detail-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './student-detail-list.component.html',
  styleUrl: './student-detail-list.component.css'
})
export class StudentDetailListComponent implements OnInit, OnDestroy {

  searchType: string = '';
  searchParticular: string = '';
  searchNumber: number | null = null;

  readonly particularOptions = TRAN_PARTICULAR_OPTIONS;

  /** Set only when arriving from a Reports Dash Board activity tile. */
  private dashboardBucketCode: string | null = null;

  allRecords: StudentDetail[] = [];
  tableRecords: StudentDetail[] = [];
  showingAll = true;

  readonly paginator = new Paginator<StudentDetail>(() => this.tableRecords);

  // Populated from backend (Config Master: configMaster === 'STUD'),
  // same source used by the Student Daily Activity form.
  studentTypeOptions: { value: string; label: string }[] = [];

  downloadOptions = REPORT_DOWNLOAD_OPTIONS;
  downloadFormat: ReportDownloadFormat | '' = '';

  private dataSub = new Subscription();

  constructor(
    private svc: StudentDetailService,
    private configDetSvc: ConfigDetailService,
    private reportSvc: ReportService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Arriving from the Reports Dash Board with an activity-status tile clicked.
    const incomingParticular = this.route.snapshot.queryParamMap.get('tranParticular');
    if (incomingParticular && ACTIVITY_BUCKETS[incomingParticular]) {
      this.dashboardBucketCode = incomingParticular;
    }

    this.svc.getAll().subscribe(rows => {
      this.allRecords = rows;
      this.tableRecords = [...rows];
      if (this.dashboardBucketCode) {
        this.doSearch();
      }
    });

    this.dataSub.add(this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));
    }));
    this.configDetSvc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.dataSub.unsubscribe();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  private typeOf(studentId: string): string {
    const id = studentId.toUpperCase();
    const match = this.studentTypeOptions.find(o => id.startsWith('LS' + o.value.toUpperCase()));
    return match ? match.value : '';
  }

  onTypeChange(): void {
    this.doSearch();
  }

  /** Manual dropdown selection always overrides whatever the dashboard tile passed in. */
  onParticularChange(): void {
    this.dashboardBucketCode = null;
    this.doSearch();
  }

  doSearch(): void {

    const particularValues = this.dashboardBucketCode
      ? ACTIVITY_BUCKETS[this.dashboardBucketCode].values
      : (this.searchParticular ? [this.searchParticular] : null);

    if (!this.searchType && !particularValues && this.searchNumber === null) {
      this.clearSearch();
      return;
    }

    this.showingAll = false;
    this.paginator.reset();

    const numberPrefix = this.searchNumber !== null ? String(this.searchNumber) : '';

    this.tableRecords = this.allRecords.filter(r => {
      if (this.searchType && this.typeOf(r.studentId) !== this.searchType) return false;
      if (particularValues && !particularValues.includes((r.tranParticular ?? '').trim())) return false;
      if (numberPrefix && String(r.studentNumber) !== numberPrefix) return false;
      return true;
    });
  }

  clearSearch(): void {
    this.searchType = '';
    this.searchParticular = '';
    this.searchNumber = null;
    this.dashboardBucketCode = null;
    this.showingAll = true;
    this.tableRecords = [...this.allRecords];
    this.paginator.reset();
  }

  onNew(): void {
    this.router.navigate(['/student-detail-form'], { queryParams: { mode: 'new' } });
  }

  onDownload(): void {
    if (this.downloadFormat !== 'excel' && this.downloadFormat !== 'pdf') {
      this.toast.error('Invalid download option. Please choose Excel or PDF.');
      return;
    }

    const particularValues = this.dashboardBucketCode
      ? ACTIVITY_BUCKETS[this.dashboardBucketCode].values
      : (this.searchParticular ? [this.searchParticular] : []);

    this.reportSvc.exportActivities(
      this.searchType, particularValues.join(','), this.searchNumber, this.downloadFormat
    ).subscribe({
      next: () => this.toast.success('Download started.'),
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  onView(r: StudentDetail): void {
    this.router.navigate(['/student-detail-form'], {
      queryParams: {
        mode: 'view',
        studentId: r.studentId,
        studentNumber: r.studentNumber,
        tranDate: r.tranDate,
        tranId: r.tranId,
        tranNumber: r.tranNumber
      }
    });
  }

  onModify(r: StudentDetail): void {
    this.router.navigate(['/student-detail-form'], {
      queryParams: {
        mode: 'modify',
        studentId: r.studentId,
        studentNumber: r.studentNumber,
        tranDate: r.tranDate,
        tranId: r.tranId,
        tranNumber: r.tranNumber
      }
    });
  }

  combinedTranId(r: StudentDetail): string {
    return this.svc.combinedTranId(r.tranId, r.tranNumber);
  }

  combinedStudentId(r: StudentDetail): string {
    return `${r.studentId}-${r.studentNumber}`;
  }

  statusLabel(r: StudentDetail): string {
    return r.delFlag === 'A' ? 'Active' : 'De-Active';
  }

  get searchTypeLabel(): string { 
    const match = this.studentTypeOptions.find(o => o.value === this.searchType);
    return match ? match.label : '';
  }

  /** What to show in the "Results for ..." strip when filtered by particular/status. */
  get searchParticularLabel(): string {
    if (this.dashboardBucketCode) return ACTIVITY_BUCKETS[this.dashboardBucketCode].label;
    return this.searchParticular;
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): StudentDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}