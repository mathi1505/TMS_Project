import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ReportService } from '../../services/report.service';
import { StudentMasterService } from '../../services/student-master.service';
import { ToastService } from '../../services/toast.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';
import {
  ReportDailyActivityHeader,
  ReportDailyActivityRow,
  REPORT_MONTH_OPTIONS,
} from '../../models/report.model';


const STUDY_MODE_LABELS: Record<string, string> = {
  On:  'Online',
  Off: 'Offline',
  HYB: 'Hybrid'
};


@Component({
  selector: 'app-student-my-activity-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './student-my-activity-list.component.html',
  styleUrl: './student-my-activity-list.component.css'
})
export class StudentMyActivityListComponent implements OnInit {

  loading = true;
  notFound = false;

  studentId = '';
  studentNumber = 0;

  header: ReportDailyActivityHeader | null = null;
  studyModeLabel = '';

  activities: ReportDailyActivityRow[] = [];
  selectedRow: ReportDailyActivityRow | null = null;

  monthOptions = REPORT_MONTH_OPTIONS;
  yearOptions: number[] = [];
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  readonly paginator = new Paginator<ReportDailyActivityRow>(() => this.activities);

  constructor(
    public auth: AuthService,
    private reportSvc: ReportService,
    private studentSvc: StudentMasterService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    this.yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

    const user = this.auth.currentUser();
    if (!user) {
      this.loading = false;
      this.notFound = true;
      return;
    }

    // For a STUDENT-role login, userId/userNo ARE the Student_id/Student_no.
    this.studentId = user.userId;
    this.studentNumber = user.userNo;

    this.studentSvc.getByIdAndNumber(this.studentId, this.studentNumber).subscribe(m => {
      this.studyModeLabel = m ? (STUDY_MODE_LABELS[m.studyMode] ?? m.studyMode) : '';
    });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.paginator.reset();
    this.reportSvc.dailyActivity(this.studentId, this.studentNumber, this.selectedMonth, this.selectedYear)
      .subscribe({
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

  onAddNew(): void {
    this.router.navigate(['/my-activity-form']);
  }

  onViewDetails(row: ReportDailyActivityRow): void {
    this.selectedRow = row;
  }

  closeDetails(): void {
    this.selectedRow = null;
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRows(): ReportDailyActivityRow[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
