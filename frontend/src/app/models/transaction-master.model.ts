// Historically a fixed set of 2-char codes. Now driven by Configuration Master
// (categories TRXN / EXP / INC), so this is kept loose as a plain string.
export type TransactionIdCode = string;
export type DelFlag = 'A' | 'D';

/** Config Master categories whose entries feed the Transaction ID dropdown. */
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

// Legacy fallback labels only — used if a saved record's code is no longer
// present as an active Configuration Master entry. The dropdown itself is
// now populated from Configuration Master (see TRXN_ID_SOURCE_CATEGORIES).
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
