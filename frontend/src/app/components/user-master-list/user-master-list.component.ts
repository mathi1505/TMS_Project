import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppUser } from '../../models/app-user.model';
import { Role, ROLE_OPTIONS, roleLabel, roleOptionsFromConfig } from '../../models/auth.model';
import { AppUserService } from '../../services/app-user.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-user-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './user-master-list.component.html',
  styleUrl:    './user-master-list.component.css'
})
export class UserMasterListComponent implements OnInit, OnDestroy {

  searchRole: Role | '' = '';
  searchUserId = '';

  allRecords: AppUser[] = [];
  tableRecords: AppUser[] = [];
  showingAll = true;


  roleOptions = ROLE_OPTIONS;
  readonly roleLabel = roleLabel;

  readonly paginator = new Paginator<AppUser>(() => this.tableRecords);

  private dataSub?: Subscription;
  private configSub?: Subscription;

  constructor(
    private svc: AppUserService,
    private router: Router,
    public auth: AuthService,
    private configDetSvc: ConfigDetailService
  ) {}

  ngOnInit(): void {
    this.dataSub = this.svc.data$.subscribe(rows => {
      this.allRecords = rows;
      this.refreshTableFromCache();
    });
    this.svc.getAll().subscribe();

   
    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.roleOptions = roleOptionsFromConfig(rows);
    });
    this.configDetSvc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.configSub?.unsubscribe();
  }

  private refreshTableFromCache(): void {
    const role = this.searchRole;
    const id   = this.searchUserId.trim().toUpperCase();
    if (!role && !id) {
      this.tableRecords = [...this.allRecords];
      return;
    }
    this.tableRecords = this.allRecords.filter(r => {
      const matchRole = role ? r.role === role : true;
      const matchId   = id   ? r.userId.toUpperCase().includes(id) : true;
      return matchRole && matchId;
    });
  }

  doSearch(): void {
    if (!this.searchRole && !this.searchUserId.trim()) {
      this.clearSearch();
      return;
    }
    this.showingAll = false;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  clearSearch(): void {
    this.searchRole = '';
    this.searchUserId = '';
    this.showingAll = true;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  combinedId(r: AppUser): string { return `${r.userId}-${r.userNo}`; }

  onNew():             void { this.router.navigate(['/user-master-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: AppUser): void { this.router.navigate(['/user-master-form'], { queryParams: { mode: 'modify', userId: r.userId, userNo: r.userNo } }); }
  onView(r: AppUser):   void { this.router.navigate(['/user-master-form'], { queryParams: { mode: 'view',   userId: r.userId, userNo: r.userNo } }); }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): AppUser[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
