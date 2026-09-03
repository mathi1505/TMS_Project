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

 
  particularOptions: string[] = TRAN_PARTICULAR_OPTIONS;

  private dashboardParticular: string | null = null;

  allRecords: StudentDetail[] = [];
  tableRecords: StudentDetail[] = [];
  showingAll = true;

  readonly paginator = new Paginator<StudentDetail>(() => this.tableRecords);

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
   const incomingParticular =
  this.route.snapshot.queryParamMap.get('tranParticular');

if (incomingParticular) {
  this.dashboardParticular = incomingParticular.trim();
  this.searchParticular = this.dashboardParticular;
}

    this.svc.getAll().subscribe(rows => {
      this.allRecords = rows;
      this.tableRecords = [...rows];
     if (this.dashboardParticular) {
  this.doSearch();
}
    });

    this.dataSub.add(this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));

    
      const live = rows
        .filter(r => r.configMaster === 'TRAN')
        .map(r => r.configName);

      this.particularOptions = live.length ? live : TRAN_PARTICULAR_OPTIONS;

      if (this.searchParticular && !this.particularOptions.includes(this.searchParticular)) {
        this.particularOptions = [...this.particularOptions, this.searchParticular];
      }
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

 onParticularChange(): void {
  this.dashboardParticular = null;
  this.doSearch();
}
doSearch(): void {

  const particularValue =
    this.dashboardParticular ?? this.searchParticular.trim();

  if (
    !this.searchType &&
    !particularValue &&
    this.searchNumber === null
  ) {
    this.clearSearch();
    return;
  }

  this.showingAll = false;
  this.paginator.reset();

  const numberPrefix =
    this.searchNumber !== null
      ? String(this.searchNumber)
      : '';

  this.tableRecords = this.allRecords.filter(r => {

   
    if (
      this.searchType &&
      this.typeOf(r.studentId) !== this.searchType
    ) {
      return false;
    }

    if (
      particularValue &&
      (r.tranParticular ?? '').trim() !== particularValue
    ) {
      return false;
    }

  
    if (
      numberPrefix &&
      String(r.studentNumber) !== numberPrefix
    ) {
      return false;
    }

    return true;
  });
}

 clearSearch(): void {
  this.searchType = '';
  this.searchParticular = '';
  this.searchNumber = null;
  this.dashboardParticular = null;
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

const particularValues =
  this.dashboardParticular
    ? [this.dashboardParticular]
    : this.searchParticular.trim()
      ? [this.searchParticular.trim()]
      : [];

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
        tranNumber: r.tranNumber,
        entrySeq: r.entrySeq
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
        tranNumber: r.tranNumber,
        entrySeq: r.entrySeq
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

 get searchParticularLabel(): string {
  return this.dashboardParticular ?? this.searchParticular;
}

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): StudentDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}