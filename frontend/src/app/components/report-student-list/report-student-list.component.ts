import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ReportService } from '../../services/report.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';
import { ReportDownloadFormat, ReportStudentSummary, REPORT_DOWNLOAD_OPTIONS } from '../../models/report.model';

@Component({
  selector: 'app-report-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './report-student-list.component.html',
  styleUrl: './report-student-list.component.css'
})
export class ReportStudentListComponent implements OnInit, OnDestroy {

  // Search inputs
  searchName = '';
  searchType = '';
  searchNumber: number | null = null;

  studentTypeOptions: { value: string; label: string }[] = [];
  downloadOptions = REPORT_DOWNLOAD_OPTIONS;
  downloadFormat: ReportDownloadFormat | '' = '';

  records: ReportStudentSummary[] = [];
  loading = false;

  // Name suggestions dropdown
  nameSuggestions: ReportStudentSummary[] = [];
  showNameSuggestions = false;
  private readonly MAX_SUGGESTIONS = 8;

  readonly paginator = new Paginator<ReportStudentSummary>(() => this.records);

  private readonly nameInput$ = new Subject<string>();
  private nameSub?: Subscription;
  private configSub?: Subscription;

  constructor(
    private reportSvc: ReportService,
    private configDetSvc: ConfigDetailService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));
    });
    this.configDetSvc.getAll().subscribe();

    // Name filter starts filtering as the user types (debounced).
    this.nameSub = this.nameInput$.pipe(debounceTime(250), distinctUntilChanged()).subscribe(() => this.search());

    this.search();
  }

  ngOnDestroy(): void {
    this.nameSub?.unsubscribe();
    this.configSub?.unsubscribe();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  onNameChange(): void {
    this.nameInput$.next(this.searchName);
  }

  onNameFocus(): void {
    this.showNameSuggestions = true;
  }

  onNameBlur(): void {
    // Delay so a click on a suggestion registers before the list is hidden.
    setTimeout(() => { this.showNameSuggestions = false; }, 150);
  }

  selectSuggestion(row: ReportStudentSummary): void {
    this.searchName = row.studentName;
    this.showNameSuggestions = false;
    this.search();
  }

  onFilterChange(): void {
    this.search();
  }

  search(): void {
    this.loading = true;
    this.paginator.reset();
    this.reportSvc.searchStudents(this.searchName, this.searchType, this.searchNumber).subscribe({
      next: rows => {
        this.records = rows;
        this.loading = false;
        this.nameSuggestions = this.searchName.trim()
          ? rows.slice(0, this.MAX_SUGGESTIONS)
          : [];
      },
      error: (err: Error) => { this.loading = false; this.toast.error(err.message); }
    });
  }

  clearSearch(): void {
    this.searchName = '';
    this.searchType = '';
    this.searchNumber = null;
    this.nameSuggestions = [];
    this.showNameSuggestions = false;
    this.search();
  }

  typeLabel(row: ReportStudentSummary): string {
    const found = this.studentTypeOptions.find(o => o.value === row.studentType);
    return found ? found.label : row.studentType;
  }

  statusBadgeClass(status: string): string {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('progress')) return 'status-in-progress';
    if (s.includes('left')) return 'status-left';
    return 'status-transferred';
  }

  onFullView(row: ReportStudentSummary): void {
    // Open the real Student Master page in read-only "view" mode, instead of
    // a separate report page, so this always reflects the actual master record.
    this.router.navigate(['/student-master-form'], {
      queryParams: { mode: 'view', id: row.studentId, studentNumber: row.studentNumber, returnTo: '/report' }
    });
  }

  onDailyActivity(row: ReportStudentSummary): void {
    this.router.navigate(['/report-daily-activity'], {
      queryParams: { id: row.studentId, studentNumber: row.studentNumber }
    });
  }

  onDownload(): void {
    if (this.downloadFormat !== 'excel' && this.downloadFormat !== 'pdf') {
      this.toast.error('Invalid download option. Please choose Excel or PDF.');
      return;
    }
    this.reportSvc.exportStudents(this.searchName, this.searchType, this.searchNumber, this.downloadFormat).subscribe({
      next: () => this.toast.success('Download started.'),
      error: (err: Error) => this.toast.error(err.message)
    });
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): ReportStudentSummary[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
