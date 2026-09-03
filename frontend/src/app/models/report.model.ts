export interface ReportStudentSummary {
  studentId: string;
  studentNumber: number;
  studentName: string;
  studentType: string;
  joiningDate: string;
  trainerName: string;
  mobileNo: number;
  emailId: string;
  status: string;
}

export interface ReportStudentActivitySummary {
  studentId: string;
  studentNumber: number;
  studentName: string;
  studentType: string;
  trainerName: string;
  mobileNo: number;
  tranDate: string;
  technology: string;
  tranId: string;
  tranNumber: number;
  entrySeq: number;
  tranParticular: string;
  narration: string;
}

export interface ReportDailyActivityHeader {
  studentId: string;
  studentNumber: number;
  studentName: string;
  studentType: string;
  joiningDate: string;
  trainerName: string;
  mobileNo: number;
}

export interface ReportDailyActivityRow {
  tranId: string;
  tranNumber: number;
  entrySeq: number;
  tranDate: string;
  valueDate: string;
  timeIn: string;
  timeOut: string;
  technology: string;
  topicCovered: string;
  tranParticular: string;
  courseId: string;
  courseDetId: number;
  narration: string;
  remarks: string;
}

export interface ReportDailyActivityResponse {
  header: ReportDailyActivityHeader;
  activities: ReportDailyActivityRow[];
}


export interface ReportDailyActivityListRow {
  studentId: string;
  studentNumber: number;
  studentName: string;
  studentType: string;
  trainerName: string;
  mobileNo: number;
  tranDate: string;
  technology: string;
  tranParticular: string;
  narration: string;
  timeIn: string;
  timeOut: string;
  remarks: string;
  tranId: string;
  tranNumber: number;
}

export interface ExportFileResponse {
  fileName: string;
  contentType: string;
  base64Data: string;
}

export type ReportDownloadFormat = 'excel' | 'pdf';

export const REPORT_DOWNLOAD_OPTIONS: { value: ReportDownloadFormat; label: string }[] = [
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export const REPORT_MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];
