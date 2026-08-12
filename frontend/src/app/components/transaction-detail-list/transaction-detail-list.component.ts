import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionDetail, TRANSACTION_DETAIL_TYPE_OPTIONS, TransactionDetailType } from '../../models/transaction-detail.model';
import { TransactionDetailService } from '../../services/transaction-detail.service';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { Paginator } from '../../services/paginator';

@Component({
  selector: 'app-transaction-detail-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './transaction-detail-list.component.html',
  styleUrl: './transaction-detail-list.component.css'
})
export class TransactionDetailListComponent implements OnInit {

  searchTrxnId = '' as TransactionDetailType | '';
  searchTransactionId = '';

  allRecords: TransactionDetail[] = [];
  tableRecords: TransactionDetail[] = [];
  showingAll = true;
  

  readonly typeOptions = TRANSACTION_DETAIL_TYPE_OPTIONS;

  readonly paginator = new Paginator<TransactionDetail>(() => this.tableRecords);

  private trxnNameByKey = new Map<string, string>();

  private static readonly TYPE_DISPLAY_ORDER: Record<string, number> = { IN: 0, EX: 1 };

  private sortForDisplay(rows: TransactionDetail[]): TransactionDetail[] {
    return [...rows].sort((a, b) => {
      const orderA = TransactionDetailListComponent.TYPE_DISPLAY_ORDER[a.trxnId] ?? 2;
      const orderB = TransactionDetailListComponent.TYPE_DISPLAY_ORDER[b.trxnId] ?? 2;
      if (orderA !== orderB) return orderA - orderB;
      return a.masterNumber - b.masterNumber;
    });
  }

  constructor(
    public svc: TransactionDetailService,
    private masterSvc: TransactionMasterService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {

  this.masterSvc.getAll().subscribe(masters => {
    this.trxnNameByKey = new Map(
      masters.map(m => [`${m.trxnId}-${m.trxnNumber}`, m.trxnName])
    );
  });

  this.svc.getAll().subscribe(rows => {

    this.allRecords = rows;
    console.log(this.allRecords);

    this.tableRecords = this.sortForDisplay(this.allRecords);


  });

}
  doSearch(): void {

  const tid = this.searchTrxnId;
  const txnRaw = this.searchTransactionId.trim().toLowerCase();

  if (!tid && !txnRaw) {
    this.clearSearch();
    return;
  }

  this.showingAll = false;
  this.paginator.reset();

  let matchId = txnRaw;

  if (txnRaw && tid && !txnRaw.includes('-')) {
    matchId = `${tid}-${txnRaw}`.toLowerCase();
  }

  this.tableRecords = this.sortForDisplay(
    this.allRecords.filter(r => {

      const matchTid = tid ? r.trxnId === tid : true;

      const matchTxn = matchId
        ? this.combinedDetId(r).toLowerCase() === matchId
        : true;

      return matchTid && matchTxn;
    })
  );

}

  clearSearch(): void {

  this.searchTrxnId = '';
  this.searchTransactionId = '';
  this.showingAll = true;

  this.tableRecords = this.sortForDisplay(this.allRecords);

  this.paginator.reset();
}

  onNew(): void {
    this.router.navigate(['/transaction-detail-form'], { queryParams: { mode: 'new' } });
  }

  onView(r: TransactionDetail): void {
    this.router.navigate(['/transaction-detail-form'], {
      queryParams: {
        mode: 'view',
        trxnId: r.trxnId,
        masterNumber: r.masterNumber,
        tranDate: r.tranDate,
        valueDate: r.valueDate,
        referenceNo: r.referenceNo ?? ''
      }
    });
  }

  onModify(r: TransactionDetail): void {
    this.router.navigate(['/transaction-detail-form'], {
      queryParams: {
        mode: 'modify',
        trxnId: r.trxnId,
        masterNumber: r.masterNumber,
        tranDate: r.tranDate,
        valueDate: r.valueDate,
        referenceNo: r.referenceNo ?? ''
      }
    });
  }

  combinedMasterId(r: TransactionDetail): string { return this.svc.combinedMasterId(r.trxnId, r.masterNumber); }
  combinedDetId(r: TransactionDetail): string { return this.svc.combinedDetId(r); }

  typeLabel(r: TransactionDetail): string { return r.trxnId === 'EX' ? 'EXP' : 'INC'; }

  get searchTypeLabel(): string {
    if (!this.searchTrxnId) return '';
    return this.typeOptions.find(o => o.value === this.searchTrxnId)?.label ?? this.searchTrxnId;
  }
  statusLabel(r: TransactionDetail): string { return r.delFlag === 'A' ? 'Active' : 'De-Active'; }
trxnName(row: TransactionDetail): string {
  return this.trxnNameByKey.get(`${row.trxnId}-${row.masterNumber}`) ?? '';
}
  get currentPage(): number { return this.paginator.currentPage; }
  get totalPages(): number { return this.paginator.totalPages; }
  get pagedRecords(): TransactionDetail[] { return this.paginator.paged; }
  get rangeStart(): number { return this.paginator.rangeStart; }
  get rangeEnd(): number { return this.paginator.rangeEnd; }

  goToPage(p: number): void { this.paginator.goToPage(p); }
}
