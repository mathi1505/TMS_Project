import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConfigDetail, ConfigMasterCode } from '../models/config-master.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class ConfigDetailService extends CachedCrudService<ConfigDetail> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/config-det`, r => r.delFlag === 'A');
  }

  padNum(n: number): string {
    return String(n);
  }

  getByKey(configMaster: ConfigMasterCode, configId: number): Observable<ConfigDetail | undefined> {
    return undefinedOn404(
      this.http.get<ConfigDetail>(`${this.baseUrl}/${configMaster}/${configId}`)
    );
  }

  getByConfigMaster(configMaster: ConfigMasterCode): Observable<ConfigDetail[]> {
    return this.http.get<ConfigDetail[]>(`${this.baseUrl}/by-master/${configMaster}`);
  }

  nextIdAsync(configMaster: ConfigMasterCode): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/next-id/${configMaster}`);
  }

  create(record: Omit<ConfigDetail, 'configId'>): Observable<ConfigDetail> {
    return this.postAndRefresh(this.baseUrl, record);
  }

  update(record: ConfigDetail): Observable<ConfigDetail> {
    return this.putAndRefresh(`${this.baseUrl}/${record.configMaster}/${record.configId}`, record);
  }
}
