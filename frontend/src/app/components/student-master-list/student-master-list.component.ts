import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentMaster } from '../../models/student-master.model';
import { StudentMasterService } from '../../services/student-master.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-student-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './student-master-list.component.html',
  styleUrl: './student-master-list.component.css'
})
export class StudentMasterListComponent implements OnInit, OnDestroy {

  searchType: string = '';
  searchNumber: number | null = null;

  allRecords: StudentMaster[] = [];
  tableRecords: StudentMaster[] = [];
  showingAll = true;

  studentTypeOptions: { value: string; label: string }[] = [];

  readonly paginator = new Paginator<StudentMaster>(() => this.tableRecords);

  private dataSub?: Subscription;
  private configSub?: Subscription;

  constructor(
    private svc: StudentMasterService,
    private configDetSvc: ConfigDetailService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.dataSub = this.svc.data$.subscribe(rows => {
      this.allRecords = rows;
      this.refreshTableFromCache();
    });
    this.svc.getAll().subscribe();

    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));
    });
    this.configDetSvc.getAll().subscribe();
  }
  getBadgeColor(type: string): { bg: string; text: string; border: string } {

  const colors = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
    { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' },
    { bg: '#ecfccb', text: '#4d7c0f', border: '#bef264' },
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }
  ];

  if (!type) {
    return colors[0];
  }

  let hash = 0;

  for (let i = 0; i < type.length; i++) {
    hash += type.charCodeAt(i);
  }

  return colors[hash % colors.length];
}


getBadgeStyle(type: string) {

  const color = this.getBadgeColor(type);

  return {
    background: color.bg,
    color: color.text,
    border: `1px solid ${color.border}`
  };
}

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.configSub?.unsubscribe();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  private refreshTableFromCache(): void {
    if (!this.searchType && this.searchNumber === null) {
      this.tableRecords = [...this.allRecords];
      return;
    }

    const numberPrefix = this.searchNumber !== null ? String(this.searchNumber) : '';

    this.tableRecords = this.allRecords.filter(r => {

      if (this.searchType && !r.studentId.startsWith('LS' + this.searchType)) {
  return false;
}

      if (numberPrefix && String(r.studentNumber) !== numberPrefix) return false;

      return true;
    });
  }

  onTypeChange(): void {
    this.doSearch();
  }

  doSearch(): void {

    if (!this.searchType && this.searchNumber === null) {
      this.clearSearch();
      return;
    }

    this.showingAll  = false;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  clearSearch(): void {
    this.searchType     = '';
    this.searchNumber    = null;
    this.showingAll     = true;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  onNew():                    void { this.router.navigate(['/student-master-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: StudentMaster): void { this.router.navigate(['/student-master-form'], { queryParams: { mode: 'modify', id: r.studentId, studentNumber: r.studentNumber } }); }
  onView(r: StudentMaster):   void { this.router.navigate(['/student-master-form'], { queryParams: { mode: 'view',   id: r.studentId, studentNumber: r.studentNumber } }); }

  statusLabel(r: StudentMaster): string {
    return r.delFlag === 'A' ? 'Active' : 'De-Active';
  }

  combinedId(r: StudentMaster): string {
    return `${r.studentId}-${r.studentNumber}`;
  }

typeLabel(r: StudentMaster): string {
  const code = r.studentId.substring(2, 5);

  const found = this.studentTypeOptions.find(
    o => o.value === code
  );

  return found ? found.label : code;
}

  get searchTypeLabel(): string {
    if (!this.searchType) return '';
    const found = this.studentTypeOptions.find(o => o.value === this.searchType);
    return found ? found.label : this.searchType;
  }

  private static readonly STUDY_MODE_LABELS: Record<string, string> = {
    'On':  'On - Online',
    'Off': 'Off - Offline',
    'HYB': 'Hybrid'
  };

  studyModeLabel(r: StudentMaster): string {
    return StudentMasterListComponent.STUDY_MODE_LABELS[r.studyMode] ?? r.studyMode;
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): StudentMaster[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
