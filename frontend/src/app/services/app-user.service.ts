import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUser, AppUserUpsertRequest } from '../models/app-user.model';
import { undefinedOn404 } from './http.util';
import { CachedCrudService } from './cached-crud.service';

@Injectable({ providedIn: 'root' })
export class AppUserService extends CachedCrudService<AppUser> {

  constructor(http: HttpClient) {
    super(http, `${environment.apiUrl}/app-user`, r => r.delFlg === 'A');
  }

  getByKey(userId: string, userNo: number): Observable<AppUser | undefined> {
    return undefinedOn404(
      this.http.get<AppUser>(`${this.baseUrl}/${userId}/${userNo}`)
    );
  }

  create(record: AppUserUpsertRequest): Observable<AppUser> {
    return this.postAndRefresh(this.baseUrl, record);
  }

  update(userId: string, userNo: number, record: AppUserUpsertRequest): Observable<AppUser> {
    return this.putAndRefresh(`${this.baseUrl}/${userId}/${userNo}`, record);
  }
}
