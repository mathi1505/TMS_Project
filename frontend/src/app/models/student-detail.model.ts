export type TranParticular =
  | 'In Progress'
  | 'Completed'
  | 'Dropped'
  | 'Shifted to Main office'
  | 'Left'
  | 'Others';

export type DelFlag = 'A' | 'D';

export type TranIdCode = 'AS' | 'ME' | 'TR' | 'PR' | 'OT';

export interface StudentDetail {

  studentId: string;
  studentNumber?: number;
  tranDate: string;

  backValueDate: string;

  attendInTime: string;
  attendOutTime: string;

  tranId: TranIdCode;
  tranNumber: number;

 
  entrySeq?: number;

  tranParticular: string;

  courseId: string;
  courseDetId: number;

  narration: string;
  remarks: string;

  delFlag: DelFlag;

  entryBy?: string;
  entryDate?: string;

  studentName: string;
  tranName: string;
  technology: string;
}

export const DET_TRAN_ID_OPTIONS: { value: TranIdCode; label: string }[] = [
  { value: 'AS', label: 'AS – Assessor Name' },
  { value: 'ME', label: 'ME – Mentor Name'   },
  { value: 'TR', label: 'TR – Trainer Name'  },
  { value: 'PR', label: 'PR – Project Name'  },
  { value: 'OT', label: 'OT – Others'        },
];

export const TRAN_PARTICULAR_OPTIONS: TranParticular[] = [
  'In Progress',
  'Completed',
  'Dropped',
  'Shifted to Main office',
  'Left',
  'Others',
];
