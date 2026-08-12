export type TransactionDetailType = 'EX' | 'IN';
export type DrCrFlag = 'D' | 'C';
export type DelFlag = 'A' | 'D';

export interface TransactionDetail {

  trxnId: TransactionDetailType;
  masterNumber: number;

  tranDate: string;
  valueDate: string;

  referenceNo?: string;
  studentName?: string;
  description?: string;

  drCrFlag: DrCrFlag;

  amount: number;

  delFlag: DelFlag;

  entryBy?: string;
  entryDate?: string;
}

export const TRANSACTION_DETAIL_TYPE_OPTIONS: { value: TransactionDetailType; label: string }[] = [
  { value: 'EX', label: 'EXP – Expenses' },
  { value: 'IN', label: 'INC – Income' },
];

export function drCrForType(t: TransactionDetailType): DrCrFlag {
  return t === 'EX' ? 'D' : 'C';
}

export function drCrLabel(flag: DrCrFlag): string {
  return flag === 'D' ? 'Debit (D)' : 'Credit (C)';
}
