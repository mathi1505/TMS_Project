import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentDetail } from '../../models/student-detail.model';
import { StudentDetailService } from '../../services/student-detail.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-student-detail-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './student-detail-list.component.html',
  styleUrl: './student-detail-list.component.css'
})
export class StudentDetailListComponent implements OnInit, OnDestroy {

  searchType: string = '';
  searchNumber: number | null = null;

  allRecords: StudentDetail[] = [];
  tableRecords: StudentDetail[] = [];
  showingAll = true;

  readonly paginator = new Paginator<StudentDetail>(() => this.tableRecords);

  // Populated from backend (Config Master: configMaster === 'STUD'),
  // same source used by the Student Daily Activity form.
  studentTypeOptions: { value: string; label: string }[] = [];

  private dataSub = new Subscription();

  constructor(
    private svc: StudentDetailService,
    private configDetSvc: ConfigDetailService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.svc.getAll().subscribe(rows => {
      this.allRecords = rows;
      this.tableRecords = [...rows];
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

  doSearch(): void {

    if (!this.searchType && this.searchNumber === null) {
      this.clearSearch();
      return;
    }

    this.showingAll = false;
    this.paginator.reset();

    const numberPrefix = this.searchNumber !== null ? String(this.searchNumber) : '';

    this.tableRecords = this.allRecords.filter(r => {
      if (this.searchType && this.typeOf(r.studentId) !== this.searchType) return false;
      if (numberPrefix && String(r.studentNumber) !== numberPrefix) return false;
      return true;
    });
  }

  clearSearch(): void {
    this.searchType = '';
    this.searchNumber = null;
    this.showingAll = true;
    this.tableRecords = [...this.allRecords];
    this.paginator.reset();
  }

  onNew(): void {
    this.router.navigate(['/student-detail-form'], { queryParams: { mode: 'new' } });
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

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): StudentDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}