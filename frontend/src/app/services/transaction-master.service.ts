import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransactionMaster, TransactionIdCode } from '../models/transaction-master.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class TransactionMasterService extends CachedCrudService<TransactionMaster> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/trxn-master`, r => r.delFlag === 'A');
  }

  padNum(n: number): string {
    return String(n);
  }

  getByKey(trxnId: TransactionIdCode, trxnNumber: number): Observable<TransactionMaster | undefined> {
    return undefinedOn404(
      this.http.get<TransactionMaster>(`${this.baseUrl}/${trxnId}/${trxnNumber}`)
    );
  }

  getByTrxnId(trxnId: TransactionIdCode): Observable<TransactionMaster[]> {
    return this.http.get<TransactionMaster[]>(`${this.baseUrl}/by-id/${trxnId}`);
  }

  nextNumberAsync(trxnId: TransactionIdCode): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/next-number/${trxnId}`);
  }

  create(record: Omit<TransactionMaster, 'trxnNumber'>): Observable<TransactionMaster> {
    return this.postAndRefresh(this.baseUrl, record);
  }

  update(record: TransactionMaster): Observable<TransactionMaster> {
    return this.putAndRefresh(`${this.baseUrl}/${record.trxnId}/${record.trxnNumber}`, record);
  }
}
