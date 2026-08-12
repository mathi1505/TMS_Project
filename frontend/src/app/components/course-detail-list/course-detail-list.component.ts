import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CourseDetail } from '../../models/course-detail.model';
import { CourseDetailService } from '../../services/course-detail.service';
import { CourseMasterService } from '../../services/course-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-course-detail-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './course-detail-list.component.html',
  styleUrl: './course-detail-list.component.css'
})
export class CourseDetailListComponent implements OnInit, OnDestroy {

  searchCourseId = '';
  searchDetId: number | null = null;

  allRecords: CourseDetail[] = [];
  tableRecords: CourseDetail[] = [];
  showingAll = true;
  courseIdOptions: string[] = [];

  readonly paginator = new Paginator<CourseDetail>(() => this.tableRecords);

  private masterSub?: Subscription;

  constructor(
    private svc: CourseDetailService,
    private masterSvc: CourseMasterService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(rows => {
      this.allRecords = rows;
      this.tableRecords = [...rows];
    });

    this.masterSub = this.masterSvc.data$.subscribe(rows => {
      this.courseIdOptions = Array.from(new Set(rows.map(r => r.id))).sort();
    });
    this.masterSvc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.masterSub?.unsubscribe();
  }

  onSearchIdChange(value: string): void {
    this.searchCourseId = (value ?? '').toUpperCase();
    this.doSearch();
  }

  onSearchDetIdInput(): void {
    this.doSearch();
  }

  doSearch(): void {
    const cId = this.searchCourseId.trim().toUpperCase();
    const dIdStr = this.searchDetId != null ? String(this.searchDetId).trim() : '';

    if (!cId && !dIdStr) {
      this.showingAll = true;
      this.tableRecords = [...this.allRecords];
      this.paginator.reset();
      return;
    }

    this.showingAll = false;

    this.tableRecords = this.allRecords.filter(r => {
      const courseIdMatches = !cId || r.courseId.toUpperCase() === cId;
      const detIdMatches = !dIdStr || String(r.courseDetId) === dIdStr;
      return courseIdMatches && detIdMatches;
    });

    this.paginator.reset();
  }

  clearSearch(): void {
    this.searchCourseId = '';
    this.searchDetId = null;
    this.showingAll = true;
    this.tableRecords = [...this.allRecords];
    this.paginator.reset();
  }

  padId(n: number | null): string {
    return n != null ? String(n) : '—';
  }

  onNew():                   void { this.router.navigate(['/course-detail-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: CourseDetail): void { this.router.navigate(['/course-detail-form'], { queryParams: { mode: 'modify', courseId: r.courseId, detId: r.courseDetId } }); }
  onView(r: CourseDetail):   void { this.router.navigate(['/course-detail-form'], { queryParams: { mode: 'view',   courseId: r.courseId, detId: r.courseDetId } }); }

  sumField(field: 'durationWeeks' | 'hours'): number {
    return this.tableRecords.reduce((s, r) => s + (r[field] ?? 0), 0);
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): CourseDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
