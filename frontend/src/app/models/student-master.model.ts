


export type StudyMode = 'On' | 'Off' | 'HYB';
export type StdStatus = 'In Progress' | 'Left' | 'Transferred to HO';
export type PaidStatus = 'Y' | 'N';
export type DurationFrequency = 'W' | 'M' | 'H' | 'Q' | 'Y';
export type DelFlag = 'A' | 'D';

export interface StudentMaster {

  
  studentId: string;
  studentNumber: number;

  studentName: string;
  studyMode: StudyMode;
  assignedStaff: string;
  batch: number;
  nativePlace: string;
  joiningDate: string;

  mobileNo: number;
  emergencyContactNo: number;
  relationship: string;
  emailId: string;

  qualification: string;
  collegeName: string;
  passoutYear: number;

  experience: string;
  referenceBy: string;

  paidStatus: PaidStatus;
  totalAgreedFee: number;
  durationFrequency: DurationFrequency;
  totalDuration: number;

  stdStatus: StdStatus;

  delFlag: DelFlag;

  entryBy?: string;
  entryDate?: string;
}

export function studentKey(studentId: string, studentNumber: number): string {
  return `${studentId}::${studentNumber}`;
}

export function parseStudentKey(key: string): { studentId: string; studentNumber: number } | null {
  const idx = key.lastIndexOf('::');
  if (idx <= 0) return null;
  const studentNumber = Number(key.slice(idx + 2));
  if (!Number.isFinite(studentNumber)) return null;
  return { studentId: key.slice(0, idx), studentNumber };
}

export function emptyStudent(): StudentMaster {
  return {
    
    studentId: '',
    studentNumber: 0,
    studentName: '',
    studyMode: 'On',
    assignedStaff: '',
    batch: 0,
    nativePlace: '',
    joiningDate: '',
    mobileNo: 0,
    emergencyContactNo: 0,
    relationship: '',
    emailId: '',
    qualification: '',
    collegeName: '',
    passoutYear: new Date().getFullYear(),
    experience: '',
    referenceBy: '',
    paidStatus: 'N',
    totalAgreedFee: 0,
    durationFrequency: 'M',
    totalDuration: 0,
    stdStatus: 'In Progress',
    delFlag: 'A'
  };
}
