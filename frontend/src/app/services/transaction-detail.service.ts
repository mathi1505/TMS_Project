import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TransactionDetail, TransactionDetailType } from '../models/transaction-detail.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class TransactionDetailService extends CachedCrudService<TransactionDetail> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/trxn-det`, r => r.delFlag === 'A');
  }

  padNum(n: number): string {
    return String(n);
  }

  combinedMasterId(trxnId: string, masterNumber: number): string {
    return `${trxnId}-${this.padNum(masterNumber)}`;
  }

  combinedDetId(r: TransactionDetail): string {
    return `${r.trxnId}-${this.padNum(r.masterNumber)}`;
  }
 
  getByKey(
    trxnId: string,
    masterNumber: number,
    tranDate: string,
    valueDate: string,
    referenceNo: string
  ): Observable<TransactionDetail | undefined> {
    const params = new HttpParams()
      .set('trxnId', trxnId)
      .set('masterNumber', String(masterNumber))
      .set('tranDate', tranDate)
      .set('valueDate', valueDate)
      .set('referenceNo', referenceNo ?? '');
    return undefinedOn404(
      this.http.get<TransactionDetail>(`${this.baseUrl}/lookup`, { params })
    );
  }

  getByMasterKey(trxnId: TransactionDetailType, masterNumber: number): Observable<TransactionDetail[]> {
    return this.http.get<TransactionDetail[]>(`${this.baseUrl}/by-master/${trxnId}/${masterNumber}`);
  }

  create(record: TransactionDetail): Observable<TransactionDetail> {
    return this.postAndRefresh(this.baseUrl, record);
  }

  update(original: TransactionDetail, record: TransactionDetail): Observable<TransactionDetail> {
    const params = new HttpParams()
      .set('trxnId', original.trxnId)
      .set('masterNumber', String(original.masterNumber))
      .set('tranDate', original.tranDate)
      .set('valueDate', original.valueDate)
      .set('referenceNo', original.referenceNo ?? '');
    return this.putAndRefresh(`${this.baseUrl}/lookup`, record, params);
  }
}
