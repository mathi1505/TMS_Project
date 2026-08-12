export type DelFlag = 'A' | 'D';

export interface CourseDetail {
  courseId: string;
  courseDetId: number | null;
  technology: string;
  topic: string;
  durationWeeks: number | null;
  hours: number | null;
  delFlag: DelFlag;
  entryBy?: string;
  entryDate?: string;
}

export function emptyCourseDetail(): CourseDetail {
  return { courseId: '', courseDetId: null, technology: '', topic: '', durationWeeks: null, hours: null, delFlag: 'A' };
}
