import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransactionMaster, TransactionIdCode, TRXN_ID_SOURCE_CATEGORIES, transactionIdLabel } from '../../models/transaction-master.model';
import { parseCodeLabel } from '../../models/config-master.model';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

type TrxnIdOption = { value: string; label: string; description: string };

@Component({
  selector: 'app-transaction-master-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './transaction-master-list.component.html',
  styleUrl:    './transaction-master-list.component.css'
})
export class TransactionMasterListComponent implements OnInit, OnDestroy {

  searchTrxnId: TransactionIdCode | '' = '';
  searchNumber: number | null = null;

  allRecords: TransactionMaster[] = [];
  tableRecords: TransactionMaster[] = [];
  showingAll = true;

  
  trxnIdOptions: TrxnIdOption[] = [];

  readonly paginator = new Paginator<TransactionMaster>(() => this.tableRecords);

  private dataSub?: Subscription;
  private configSub?: Subscription;

  constructor(
    private svc: TransactionMasterService,
    private configSvc: ConfigDetailService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {

    this.dataSub = this.svc.data$.subscribe(rows => {
      this.allRecords = rows;
      this.refreshTableFromCache();
    });
    this.svc.getAll().subscribe();

    this.configSub = this.configSvc.activeData$.subscribe(rows => {
      const seen = new Map<string, TrxnIdOption>();
      const order = TRXN_ID_SOURCE_CATEGORIES;
      rows
        .filter(r => (order as readonly string[]).includes(r.configMaster))
        .sort((a, b) => {
          const ca = order.indexOf(a.configMaster as any);
          const cb = order.indexOf(b.configMaster as any);
          return ca !== cb ? ca - cb : a.configId - b.configId;
        })
        .forEach(r => {
          const { code, label } = parseCodeLabel(r.configName);
          if (code && !seen.has(code)) {
            seen.set(code, { value: code, label, description: label });
          }
        });
      this.trxnIdOptions = Array.from(seen.values());
    });
    this.configSvc.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.configSub?.unsubscribe();
  }

  private refreshTableFromCache(): void {
    const id  = this.searchTrxnId;
    const num = this.searchNumber;
    if (!id && !num) {
      this.tableRecords = [...this.allRecords];
      return;
    }
    this.tableRecords = this.allRecords.filter(r => {
      const matchId  = id  ? r.trxnId === id : true;
      const matchNum = num ? r.trxnNumber === num : true;
      return matchId && matchNum;
    });
  }

  doSearch(): void {
    const id  = this.searchTrxnId;
    const num = this.searchNumber;
    if (!id && !num) {
      this.clearSearch();
      return;
    }

    this.showingAll  = false;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  clearSearch(): void {
    this.searchTrxnId = '';
    this.searchNumber = null;
    this.showingAll   = true;
    this.paginator.reset();
    this.refreshTableFromCache();
  }

  padNum(n: number): string { return this.svc.padNum(n); }

  combinedId(r: TransactionMaster): string { return `${r.trxnId}-${this.padNum(r.trxnNumber)}`; }

  trxnLabel(id: TransactionIdCode): string {
    const found = this.trxnIdOptions.find(o => o.value === id);
    return found ? found.label : transactionIdLabel(id);
  }

  get searchTrxnLabel(): string {
    return this.searchTrxnId ? this.trxnLabel(this.searchTrxnId) : '';
  }

  onNew():                void { this.router.navigate(['/transaction-master-form'], { queryParams: { mode: 'new' } }); }
  onModify(r: TransactionMaster): void { this.router.navigate(['/transaction-master-form'], { queryParams: { mode: 'modify', trxnId: r.trxnId, num: r.trxnNumber } }); }
  onView(r: TransactionMaster):   void { this.router.navigate(['/transaction-master-form'], { queryParams: { mode: 'view',   trxnId: r.trxnId, num: r.trxnNumber } }); }

  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): TransactionMaster[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
