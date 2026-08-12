import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CourseMaster } from '../../models/course-master.model';
import { CourseMasterService } from '../../services/course-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-course-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './course-master-list.component.html',
  styleUrl: './course-master-list.component.css'
})
export class CourseMasterListComponent implements OnInit, OnDestroy {

  searchId = '';
  allRecords: CourseMaster[] = [];
  tableRecords: CourseMaster[] = [];
  showingAll = true;
  courseIdOptions: string[] = [];

  readonly paginator = new Paginator<CourseMaster>(() => this.tableRecords);

  private dataSub?: Subscription;

  constructor(private svc: CourseMasterService, private router: Router, public auth: AuthService) {}

  ngOnInit(): void {

    this.dataSub = this.svc.data$.subscribe(rows => {
      this.allRecords = rows;
      this.courseIdOptions = Array.from(new Set(rows.map(r => r.id))).sort();
      this.refreshTableFromCache();
    });
    this.svc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private refreshTableFromCache(): void {
    const id = this.searchId.trim().toUpperCase();
    this.tableRecords = id
      ? this.allRecords.filter(r => r.id.toUpperCase() === id)
      : [...this.allRecords];
  }

  onSearchIdChange(value: string): void {
    this.searchId = (value ?? '').toUpperCase();
    this.doSearch();
  }

  doSearch(): void {
    const id = this.searchId.trim().toUpperCase();
    if (!id) {
      this.clearSearch();
      return;
    }
    this.showingAll = false;
    this.refreshTableFromCache();
    this.paginator.reset();
  }

  clearSearch(): void {
    this.searchId = '';
    this.showingAll = true;
    this.refreshTableFromCache();
    this.paginator.reset();
  }

  onNew():                   void { this.router.navigate(['/course-master-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: CourseMaster): void { this.router.navigate(['/course-master-form'], { queryParams: { mode: 'modify', id: r.id } }); }
  onView(r: CourseMaster):   void { this.router.navigate(['/course-master-form'], { queryParams: { mode: 'view',   id: r.id } }); }

  sumField(field: 'durationWeeks' | 'hours'): number {
    return this.tableRecords.reduce((s, r) => s + (r[field] ?? 0), 0);
  }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): CourseMaster[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
