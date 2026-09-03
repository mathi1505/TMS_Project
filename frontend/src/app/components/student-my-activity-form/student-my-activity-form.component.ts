import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  StudentDetail,
  TranIdCode,
  TRAN_PARTICULAR_OPTIONS
} from '../../models/student-detail.model';
import { ReportDailyActivityHeader } from '../../models/report.model';
import { CourseDetail } from '../../models/course-detail.model';
import { TransactionMaster } from '../../models/transaction-master.model';

import { AuthService } from '../../services/auth.service';
import { StudentDetailService } from '../../services/student-detail.service';
import { StudentMasterService } from '../../services/student-master.service';
import { ReportService } from '../../services/report.service';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { CourseDetailService } from '../../services/course-detail.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { ToastService } from '../../services/toast.service';

const STUDY_MODE_LABELS: Record<string, string> = {
  On:  'Online',
  Off: 'Offline',
  HYB: 'Hybrid'
};

function notFutureDate(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const [y, m, d] = (c.value as string).split('-').map(Number);
    const chosen = new Date(y, m - 1, d);
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    return chosen > today ? { futureDate: true } : null;
  };
}

function outAfterIn(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const inn = group.get('attendInTime')?.value as string;
    const out = group.get('attendOutTime')?.value as string;
    if (!inn || !out) return null;
    return out <= inn ? { outBeforeIn: true } : null;
  };
}


@Component({
  selector: 'app-student-my-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-my-activity-form.component.html',
  styleUrl: './student-my-activity-form.component.css'
})
export class StudentMyActivityFormComponent implements OnInit, OnDestroy {

  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;
  loadingHeader = true;

  todayIso = new Date().toISOString().slice(0, 10);

  studentId = '';
  studentNumber = 0;
  header: ReportDailyActivityHeader | null = null;
  studyModeLabel = '';

  allTrxnMasters: TransactionMaster[] = [];
  tranEntries: TransactionMaster[] = [];
  courseDetails: CourseDetail[] = [];

  resolvedTranName = '';
  resolvedTechnology = '';
  selectedTranDisplay = '';

  blurredFields = new Set<string>();

  tranIdOptions: { value: string; label: string }[] = [];
  particularOptions: string[] = TRAN_PARTICULAR_OPTIONS;

  private dataSub = new Subscription();
  private fieldSub = new Subscription();

  form: FormGroup = this.fb.group({
    tranId:         ['', [Validators.required]],
    tranNumber:     [{ value: '', disabled: true }],
    tranNameOther:  [{ value: '', disabled: true }, [Validators.maxLength(50)]],
    attendInTime:   ['', [Validators.required]],
    attendOutTime:  ['', [Validators.required]],
    tranParticular: ['', [Validators.required]],

    backValueDate:  [this.todayIso, [Validators.required, notFutureDate()]],
    courseId:       ['', [Validators.required]],
    courseDetId:    ['', [Validators.required]],
    narration:      ['', [Validators.maxLength(50)]],
    remarks:        ['', [Validators.maxLength(50)]]
  }, { validators: outAfterIn() });

  get timeError(): boolean {
    return !!this.form.errors?.['outBeforeIn'] &&
           !!this.form.get('attendOutTime')?.value;
  }

  get uniqueCourseIds(): string[] {
    const seen = new Set<string>();
    this.courseDetails.forEach(c => seen.add(c.courseId));
    return [...seen].sort();
  }

  get courseDetailsForCourse(): CourseDetail[] {
    const cid = this.form.get('courseId')?.value;
    if (!cid) return [];
    return this.courseDetails.filter(c => c.courseId === cid);
  }

  constructor(
    private fb: FormBuilder,
    public svc: StudentDetailService,
    private auth: AuthService,
    private studentSvc: StudentMasterService,
    private reportSvc: ReportService,
    private trxnSvc: TransactionMasterService,
    private courseDetSvc: CourseDetailService,
    private configDetSvc: ConfigDetailService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) {
      this.banner = { kind: 'error', text: 'You must be logged in as a student to add an activity entry.' };
      this.loadingHeader = false;
      return;
    }
    this.studentId = user.userId;
    this.studentNumber = user.userNo;

    this.loadingHeader = true;
    this.reportSvc.dailyActivity(this.studentId, this.studentNumber, null, null).subscribe({
      next: res => { this.header = res.header; this.loadingHeader = false; },
      error: (err: Error) => {
        this.loadingHeader = false;
        this.banner = { kind: 'error', text: err.message };
      }
    });
    this.studentSvc.getByIdAndNumber(this.studentId, this.studentNumber).subscribe(m => {
      this.studyModeLabel = m ? (STUDY_MODE_LABELS[m.studyMode] ?? m.studyMode) : '';
    });

    this.dataSub.add(this.courseDetSvc.activeData$.subscribe(cd => { this.courseDetails = cd; }));
    this.dataSub.add(this.trxnSvc.activeData$.subscribe(entries => {
      this.allTrxnMasters = entries;
      this.recomputeTranEntries();
    }));
    this.dataSub.add(this.configDetSvc.activeData$.subscribe(rows => {
      const live = rows.filter(r => r.configMaster === 'TRAN').map(r => r.configName);
      this.particularOptions = live.length ? live : TRAN_PARTICULAR_OPTIONS;

      this.tranIdOptions = rows
        .filter(r => r.configMaster === 'TRXN')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));
    }));

    this.courseDetSvc.getAll().subscribe();
    this.trxnSvc.getAll().subscribe();
    this.configDetSvc.getAll().subscribe();

    this.fieldSub.add(this.form.get('tranId')!.valueChanges.subscribe(tid => this.onTranIdChange(tid)));
    this.fieldSub.add(this.form.get('tranNumber')!.valueChanges.subscribe(() => this.resolveTranName()));
    this.fieldSub.add(this.form.get('tranNameOther')!.valueChanges.subscribe(val => {
      if (this.form.get('tranId')?.value === 'OT') { this.resolvedTranName = val ?? ''; }
    }));
    this.fieldSub.add(this.form.get('courseId')!.valueChanges.subscribe(() => {
      this.form.patchValue({ courseDetId: '' }, { emitEvent: false });
      this.resolvedTechnology = '';
    }));
    this.fieldSub.add(this.form.get('courseDetId')!.valueChanges.subscribe(cid => this.resolveTechnology(cid)));
  }

  ngOnDestroy(): void {
    this.dataSub.unsubscribe();
    this.fieldSub.unsubscribe();
    this.blurredFields.clear();
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  private onTranIdChange(tid: TranIdCode | ''): void {
    this.resolvedTranName = '';
    this.form.patchValue({ tranNumber: '', tranNameOther: '' }, { emitEvent: false });

    if (!tid) {
      this.tranEntries = [];
      this.form.get('tranNumber')?.disable({ emitEvent: false });
      this.form.get('tranNameOther')?.disable({ emitEvent: false });
      return;
    }

    if (tid === 'OT') {
      this.tranEntries = [];
      this.form.get('tranNumber')?.disable({ emitEvent: false });
      this.form.get('tranNameOther')?.enable({ emitEvent: false });
    } else {
      this.form.get('tranNameOther')?.disable({ emitEvent: false });
      this.form.get('tranNumber')?.enable({ emitEvent: false });
      this.recomputeTranEntries();
    }
  }

  private recomputeTranEntries(): void {
    const tid = this.form.get('tranId')?.value as TranIdCode | '';
    if (!tid) { this.tranEntries = []; return; }
    this.tranEntries = this.allTrxnMasters.filter(e => e.trxnId === tid && e.delFlag === 'A');
  }

  private resolveTranName(): void {
    const tid = this.form.get('tranId')?.value as TranIdCode;
    const num = Number(this.form.get('tranNumber')?.value);

    if (!tid || !num) {
      this.resolvedTranName = '';
      this.selectedTranDisplay = '';
      return;
    }

    const found = this.tranEntries.find(e => e.trxnId === tid && e.trxnNumber === num);
    if (found) {
      this.resolvedTranName = found.trxnName;
      this.selectedTranDisplay = `${found.trxnId}-${found.trxnNumber}`;
    } else {
      this.resolvedTranName = '';
      this.selectedTranDisplay = '';
    }
  }

  formatTranEntryLabel(entry: TransactionMaster): string {
    return `${entry.trxnId}-${this.svc.padNum(entry.trxnNumber)}: ${entry.trxnName}`;
  }

  private resolveTechnology(courseDetId: number | ''): void {
    if (!courseDetId) { this.resolvedTechnology = ''; return; }
    const courseId = this.form.get('courseId')?.value;
    const found = this.courseDetails.find(
      c => c.courseId === courseId && c.courseDetId === Number(courseDetId)
    );
    this.resolvedTechnology = found ? found.technology : '';
  }

  onFieldBlur(field: string): void {
    this.blurredFields.add(field);
    this.form.get(field)?.markAsTouched();
  }

  showError(field: string): boolean {
    if (!this.blurredFields.has(field)) return false;
    return !!this.form.get(field)?.invalid;
  }

  err(field: string, error: string): boolean {
    if (!this.blurredFields.has(field)) return false;
    return !!this.form.get(field)?.hasError(error);
  }

  onSave(): void {
    const mandatory = [
      'tranId', 'tranNumber', 'attendInTime', 'attendOutTime',
      'tranParticular', 'backValueDate', 'courseId', 'courseDetId'
    ];

    mandatory.forEach(f => {
      this.blurredFields.add(f);
      this.form.get(f)?.markAsTouched();
    });

    const isOthers = this.form.get('tranId')?.value === 'OT';
    if (isOthers) {
      this.blurredFields.add('tranNameOther');
      this.form.get('tranNameOther')?.markAsTouched();
    }

    const hasErrors = mandatory.some(f => {
      const ctrl = this.form.get(f);
      return ctrl && ctrl.enabled && ctrl.invalid;
    });

    const otherNameMissing = isOthers && !this.form.get('tranNameOther')?.value?.trim();

    if (hasErrors || otherNameMissing || this.form.errors?.['outBeforeIn']) {
      this.banner = { kind: 'error', text: 'Please fill all the fields.' };
      return;
    }

    if (!this.header) {
      this.banner = { kind: 'error', text: 'Your student record could not be loaded. Please try again.' };
      return;
    }

    this.saving = true;
    const raw = this.form.getRawValue();

    const record: StudentDetail = {
      studentId:      this.studentId,
      studentNumber:  this.studentNumber,
      studentName:    this.header.studentName,
      tranDate:       this.todayIso,
      tranId:         raw.tranId as TranIdCode,
      tranNumber:     Number(raw.tranNumber),
      tranName:       this.resolvedTranName,
      attendInTime:   raw.attendInTime,
      attendOutTime:  raw.attendOutTime,
      tranParticular: raw.tranParticular,
      backValueDate:  raw.backValueDate,
      courseId:       raw.courseId,
      courseDetId:    Number(raw.courseDetId),
      technology:     this.resolvedTechnology,
      narration:      raw.narration,
      remarks:        raw.remarks,
      delFlag:        'A'
    };

    this.svc.create(record).subscribe({
      next: (saved) => {
        this.saving = false;
        this.toast.show({
          kind: 'success',
          text: `Activity saved! Tran ID: ${saved.tranId}-${this.svc.padNum(saved.tranNumber)}`
        });
        this.goBack();
      },
      error: (e: Error) => {
        this.saving = false;
        this.banner = { kind: 'error', text: e.message };
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/my-activity');
  }
}
