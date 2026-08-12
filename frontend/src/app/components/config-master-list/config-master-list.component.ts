import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigDetail, ConfigMasterCode, CONFIG_MASTER_OPTIONS, configMasterLabel } from '../../models/config-master.model';
import { ConfigDetailService } from '../../services/config-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-config-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './config-master-list.component.html',
  styleUrl:    './config-master-list.component.css'
})
export class ConfigMasterListComponent implements OnInit, OnDestroy {

  searchConfigMaster: ConfigMasterCode | '' = '';
  searchId: number | null = null;

  allRecords: ConfigDetail[] = [];
  tableRecords: ConfigDetail[] = [];
  showingAll = true;

  get configMasterOptions(): { value: ConfigMasterCode; label: string }[] {
    const seen = new Set<string>();
    const options: { value: ConfigMasterCode; label: string }[] = [];

    for (const opt of CONFIG_MASTER_OPTIONS) {
      if (this.allRecords.some(r => r.configMaster === opt.value)) {
        seen.add(opt.value);
        options.push({ value: opt.value, label: opt.label });
      }
    }
    for (const r of this.allRecords) {
      if (!seen.has(r.configMaster)) {
        seen.add(r.configMaster);
        options.push({ value: r.configMaster, label: this.masterLabel(r.configMaster) });
      }
    }
    return options;
  }

  readonly paginator = new Paginator<ConfigDetail>(() => this.tableRecords);

  private dataSub?: Subscription;

  constructor(private svc: ConfigDetailService, private router: Router, public auth: AuthService) {}

  ngOnInit(): void {

    this.dataSub = this.svc.data$.subscribe(rows => {
      this.allRecords = rows;
      this.refreshTableFromCache();
    });
    this.svc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }

  private refreshTableFromCache(): void {
    const master = this.searchConfigMaster;
    const id     = this.searchId;
    if (!master && !id) {
      this.tableRecords = [...this.allRecords];
      return;
    }
    this.tableRecords = this.allRecords.filter(r => {
      const matchMaster = master ? r.configMaster === master : true;
      const matchId     = id     ? r.configId === id : true;
      return matchMaster && matchId;
    });
  }

  doSearch(): void {
    const master = this.searchConfigMaster;
    const id      = this.searchId;
    if (!master && !id) {
      this.clearSearch();
      return;
    }

    this.showingAll  = false;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  clearSearch(): void {
    this.searchConfigMaster = '';
    this.searchId   = null;
    this.showingAll = true;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  padNum(n: number): string { return this.svc.padNum(n); }

  combinedId(r: ConfigDetail): string { return `${r.configMaster}-${this.padNum(r.configId)}`; }

  masterLabel(code: ConfigMasterCode): string {

  // Existing fixed categories
  const staticLabel = configMasterLabel(code);

  if (staticLabel !== code) {
    return staticLabel;
  }

  // New categories from database
  const record = this.allRecords.find(
    r => r.configMaster === code
  );

  if (record?.configMasterName) {
    return `${code} – ${record.configMasterName}`;
  }

  return code;
}

  get searchMasterLabel(): string {
    return this.searchConfigMaster ? this.masterLabel(this.searchConfigMaster) : '';
  }

  onNew():               void { this.router.navigate(['/config-master-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: ConfigDetail): void { this.router.navigate(['/config-master-form'], { queryParams: { mode: 'modify', configMaster: r.configMaster, id: r.configId } }); }
  onView(r: ConfigDetail):   void { this.router.navigate(['/config-master-form'], { queryParams: { mode: 'view',   configMaster: r.configMaster, id: r.configId } }); }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): ConfigDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
