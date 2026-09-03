
export type TransactionIdCode = string;
export type DelFlag = 'A' | 'D';

export const TRXN_ID_SOURCE_CATEGORIES = ['TRXN', 'EXP', 'INC'] as const;

export interface TransactionMaster {
  trxnId: TransactionIdCode;
  trxnNumber: number;
  trxnName: string;
  trxnDescription?: string;
  delFlag: DelFlag;

  entryBy?: string;
  entryDate?: string;
}


export const TRANSACTION_ID_OPTIONS: { value: TransactionIdCode; label: string; description: string }[] = [
  { value: 'AS', label: 'AS – Assessor Name',  description: 'Assessment done by'                        },
  { value: 'TR', label: 'TR – Trainer Name',   description: 'Trainer to be assigned for the student'    },
  { value: 'ME', label: 'ME – Mentor Name',    description: 'Mentor to be assigned for the student'     },
  { value: 'PR', label: 'PR – Project Name',   description: 'Project name assigned to the student'      },
  { value: 'OT', label: 'OT – Others',         description: 'Any others'                                },
  { value: 'EX', label: 'EX – Expenses',       description: 'General Expenses'                          },
  { value: 'IN', label: 'IN – Income',         description: 'General Income - Revenue'                  },
];

export function transactionIdDescription(id: TransactionIdCode): string {
  return TRANSACTION_ID_OPTIONS.find(o => o.value === id)?.description ?? '';
}

export function transactionIdLabel(id: TransactionIdCode): string {
  return TRANSACTION_ID_OPTIONS.find(o => o.value === id)?.label ?? id;
}
