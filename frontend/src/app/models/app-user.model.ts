import { Role } from './auth.model';

export type DelFlag = 'A' | 'D';

export interface AppUser {
  userId: string;
  userNo: number;
  userName: string;
  role: Role;
  createdBy?: string;
  createdDate?: string;
  delFlg: DelFlag;
}

export interface AppUserUpsertRequest {
  userName: string;
 
  password?: string;
  role: Role;
 
  studentId?: string;
  studentNo?: number;
  delFlg?: DelFlag;
}
