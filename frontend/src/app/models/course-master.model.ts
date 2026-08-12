export type DelFlag = 'A' | 'D';

export interface CourseMaster {
  id: string;
  technology: string;
  topic: string;
  durationWeeks: number | null;
  hours: number | null;
  delFlag: DelFlag;
  entryBy?: string;
  entryDate?: string;
}

export function emptyCourseMaster(): CourseMaster {
  return { id: '', technology: '', topic: '', durationWeeks: null, hours: null, delFlag: 'A' };
}
