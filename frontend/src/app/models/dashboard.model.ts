export interface DashboardCountItem {
  code: string;
  label: string;
  count: number;
}

export interface DashboardSummary {
  totalStudents: number;
  studentMasterCounts: DashboardCountItem[];

  totalActivityStudents: number;
  studentActivityCounts: DashboardCountItem[];
}
