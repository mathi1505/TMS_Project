import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  StudentDetail,
  TranIdCode,
  TRAN_PARTICULAR_OPTIONS
} from '../../models/student-detail.model';
import { StudentDetailService } from '../../services/student-detail.service';
import { StudentMasterService } from '../../services/student-master.service';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { CourseDetailService } from '../../services/course-detail.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { CourseDetail } from '../../models/course-detail.model';
import { TransactionMaster } from '../../models/transaction-master.model';
import { StudentMaster, studentKey, parseStudentKey } from '../../models/student-master.model';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';

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
  selector: 'app-student-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-detail-form.component.html',
  styleUrl:    './student-detail-form.component.css'
})
export class StudentDetailFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: StudentDetail | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  todayIso = new Date().toISOString().slice(0, 10);

  allStudents: StudentMaster[] = [];
  allTrxnMasters: TransactionMaster[] = [];
  tranEntries: TransactionMaster[] = [];
  courseDetails: CourseDetail[] = [];
  filteredCourseDetails: CourseDetail[] = [];

  // Where "← Back" should go; falls back to /student-detail when not set
  // (e.g. opened in view mode from the Student Daily Activity Report).
  returnTo: string | null = null;

  resolvedStudentName = '';
  resolvedStudentNumber: number | null = null;
  resolvedTranName    = '';
  resolvedTechnology  = '';
  selectedTranDisplay = '';

  studentTypeOptions: { value: string; label: string }[] = [];

  blurredFields = new Set<string>();

  tranIdOptions: { value: string; label: string }[] = [];

  particularOptions: string[] = TRAN_PARTICULAR_OPTIONS;

  readonly delFlagOptions = [
    { value: 'A', label: 'Active'    },
    { value: 'D', label: 'De-Active' }
  ];

  private sub!: Subscription;
  private dataSub = new Subscription();

  form: FormGroup = this.fb.group({
    studentType:    ['', [Validators.required]],
    studentId:      ['', [Validators.required]],

    tranDate:       [{ value: '', disabled: true }],
    tranId:         ['', [Validators.required]],
    tranNumber:     [{ value: '', disabled: true }],
    tranNameOther:  [{ value: '', disabled: true }, [Validators.maxLength(50)]],
    attendInTime:   ['', [Validators.required]],
    attendOutTime:  ['', [Validators.required]],
    tranParticular: ['', [Validators.required]],

    backValueDate:  ['', [Validators.required, notFutureDate()]],
    courseId:       ['', [Validators.required]],
    courseDetId:    ['', [Validators.required]],
    narration:      ['', [Validators.maxLength(50)]],
    remarks:        ['', [Validators.maxLength(50)]],
    delFlag:        ['A', [Validators.required]]
  }, { validators: outAfterIn() });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get timeError(): boolean {
    return !!this.form.errors?.['outBeforeIn'] &&
           !!this.form.get('attendOutTime')?.value;
  }

  get uniqueCourseIds(): string[] {
    const seen = new Set<string>();
    this.filteredCourseDetails.forEach(c => seen.add(c.courseId));
    return [...seen].sort();
  }

  get filteredStudentsByType(): StudentMaster[] {
    const type = this.form.get('studentType')?.value as string;
    if (!type) return [];
    const prefix = 'LS' + type.toUpperCase();
    return this.allStudents.filter(s => s.studentId.toUpperCase().startsWith(prefix));
  }

  studentKeyFor(s: StudentMaster): string {
    return studentKey(s.studentId, s.studentNumber);
  }

  get studentTypeDisplay(): string {
    const sid = (this.current?.studentId ?? '') as string;
    if (!sid) return '';
    const match = this.studentTypeOptions.find(o => sid.toUpperCase().startsWith('LS' + o.value.toUpperCase()));
    return match ? match.label : '';
  }

  constructor(
    private fb: FormBuilder,
    public svc: StudentDetailService,
    private studentSvc: StudentMasterService,
    private trxnSvc: TransactionMasterService,
    private courseDetSvc: CourseDetailService,
    private configDetSvc: ConfigDetailService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {


    this.dataSub.add(this.studentSvc.activeData$.subscribe(s => { this.allStudents = s; }));
    this.dataSub.add(this.courseDetSvc.activeData$.subscribe(cd => {
      this.courseDetails = cd;

      if (this.mode === 'new' && this.form.get('studentId')?.value) { this.filteredCourseDetails = cd; }
    }));
    this.dataSub.add(this.trxnSvc.activeData$.subscribe(entries => {
      this.allTrxnMasters = entries;

      if (this.mode === 'new') { this.recomputeTranEntries(); }
    }));

this.dataSub.add(this.configDetSvc.activeData$.subscribe(rows => {

  // Tran Particular
  const live = rows
    .filter(r => r.configMaster === 'TRAN')
    .map(r => r.configName);

  this.particularOptions = live.length ? live : TRAN_PARTICULAR_OPTIONS;

  const current = this.form.get('tranParticular')?.value;
  if (current && !this.particularOptions.includes(current)) {
    this.particularOptions = [...this.particularOptions, current];
  }

  // Student Type
  this.studentTypeOptions = rows
    .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
    .map(r => ({
      value: this.parseCodePrefix(r.configName),
      label: r.configName
    }));

  // Tran ID
  this.tranIdOptions = rows
    .filter(r => r.configMaster === 'TRXN')
    .map(r => ({
      value: this.parseCodePrefix(r.configName),
      label: r.configName
    }));

}));
    this.studentSvc.getAll().subscribe();
    this.courseDetSvc.getAll().subscribe();
    this.trxnSvc.getAll().subscribe();
    this.configDetSvc.getAll().subscribe();
 
    this.route.queryParamMap.subscribe(params => {
      this.initForRoute(params);
    });
  }

  private initForRoute(params: ParamMap): void {
    this.sub?.unsubscribe();
    this.mode = (params.get('mode') as Mode) ?? 'new';
    this.returnTo = params.get('returnTo');

    this.current = null;
    this.blurredFields.clear();
    this.banner  = null;
    this.saving  = false;
    this.resolvedStudentName = '';
    this.resolvedStudentNumber = null;
    this.resolvedTranName    = '';
    this.resolvedTechnology  = '';
    
    this.tranEntries         = [];
    this.filteredCourseDetails = [];

    this.todayIso = new Date().toISOString().slice(0, 10);

    this.form.reset({
      studentType: '', studentId: '', tranDate: this.todayIso, tranId: '',
      tranNameOther: '',
      attendInTime: '', attendOutTime: '', tranParticular: '',
      backValueDate: this.todayIso,
      courseId: '', courseDetId: '', narration: '', remarks: '', delFlag: 'A'
    }, { emitEvent: false });
    this.form.enable();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    if (this.mode === 'new') {

      this.form.get('tranDate')?.disable();
      this.form.get('tranNumber')?.disable();
      this.form.get('tranNameOther')?.disable();
      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();


      const studentTypeSub = this.form.get('studentType')!.valueChanges.subscribe(() => {
        this.form.patchValue({ studentId: '' });
      });

      const studentSub = this.form.get('studentId')!.valueChanges.subscribe(sid => {
        this.onStudentIdChange(sid);
      });

      const tranIdSub = this.form.get('tranId')!.valueChanges.subscribe(tid => {
        this.onTranIdChange(tid);
      });

      const tranNumSub = this.form.get('tranNumber')!.valueChanges.subscribe(() => {
        this.resolveTranName();
      });

      const tranNameOtherSub = this.form.get('tranNameOther')!.valueChanges.subscribe(val => {
        if (this.form.get('tranId')?.value === 'OT') { this.resolvedTranName = val ?? ''; }
      });

      const courseDetSub = this.form.get('courseDetId')!.valueChanges.subscribe(cid => {
        this.resolveTechnology(cid);
      });

      this.sub = studentTypeSub;
      this.sub.add(studentSub);
      this.sub.add(tranIdSub);
      this.sub.add(tranNumSub);
      this.sub.add(tranNameOtherSub);
      this.sub.add(courseDetSub);

      this.form.markAsUntouched();

    } else {

      const studentId  = params.get('studentId');
      const studentNumberParam = params.get('studentNumber');
      const studentNumber = studentNumberParam !== null ? Number(studentNumberParam) : undefined;
      const tranDate   = params.get('tranDate');
      const tranId     = params.get('tranId') as TranIdCode;
      const tranNumber = params.get('tranNumber') ? Number(params.get('tranNumber')) : null;

      if (studentId && tranDate && tranId && tranNumber !== null) {
        this.svc.getByKey(studentId, tranDate, tranId, tranNumber, studentNumber).subscribe(found => {
          if (found) {
            this.current = found;
            this.form.patchValue({
              studentId:      found.studentId,
              tranDate:       found.tranDate,
              tranId:         found.tranId,
              attendInTime:   found.attendInTime,
              attendOutTime:  found.attendOutTime,
              tranParticular: found.tranParticular,
              backValueDate:  found.backValueDate ?? found.tranDate,
              courseId:       found.courseId,
              courseDetId:    found.courseDetId,
              narration:      found.narration,
              remarks:        found.remarks,
              delFlag:        found.delFlag
            });
            this.resolvedStudentName   = found.studentName;
            this.resolvedStudentNumber = found.studentNumber ?? null;
            this.resolvedTranName      = found.tranName;
            this.resolvedTechnology    = found.technology;



            if (found.tranParticular && !this.particularOptions.includes(found.tranParticular)) {
              this.particularOptions = [...this.particularOptions, found.tranParticular];
            }

            this.trxnSvc.getByTrxnId(found.tranId).subscribe(entries => {
              this.tranEntries = entries.filter(e => e.delFlag === 'A');
            });

            this.courseDetSvc.getByCourseId(found.courseId).subscribe(cds => {
              this.filteredCourseDetails = cds.filter(c => c.delFlag === 'A');
            });

            if (this.mode === 'modify') {
              this.form.enable();

              this.form.get('studentType')?.disable();
              this.form.get('studentId')?.disable();
              this.form.get('tranDate')?.disable();
              this.form.get('tranId')?.disable();
              this.form.get('tranNumber')?.disable();
              this.form.get('tranNameOther')?.disable();
            } else {

              this.form.disable();
            }
            this.form.markAsUntouched();
          } else {
            this.banner = { kind: 'error', text: 'Daily activity record not found.' };
            this.form.disable();
          }
        });
      }
    }
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  private onStudentIdChange(key: string): void {
    if (!key) {
      this.resolvedStudentName = '';
      this.resolvedStudentNumber = null;
      this.filteredCourseDetails = [];
      return;
    }
    const parsed = parseStudentKey(key);
    const found = parsed
      ? this.allStudents.find(s => s.studentId === parsed.studentId && s.studentNumber === parsed.studentNumber)
      : undefined;
    this.resolvedStudentName   = found ? found.studentName : '';
    this.resolvedStudentNumber = found ? found.studentNumber : null;

    this.filteredCourseDetails = this.courseDetails.filter(c => c.delFlag === 'A');

    this.form.patchValue({ courseId: '', courseDetId: '' }, { emitEvent: false });
    this.resolvedTechnology = '';
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
      // Others: free-entry Tran Name instead of the Trxn Master dropdown
      this.tranEntries = [];
      this.form.get('tranNumber')?.disable({ emitEvent: false });
      this.form.get('tranNameOther')?.enable({ emitEvent: false });
    } else {
      this.form.get('tranNameOther')?.disable({ emitEvent: false });
      this.form.get('tranNumber')?.enable({ emitEvent: false });
      this.recomputeTranEntries();
    }

    const key = this.form.get('studentId')?.value as string;
    const parsed = key ? parseStudentKey(key) : null;

    
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

  const found = this.tranEntries.find(e =>
    e.trxnId === tid &&
    e.trxnNumber === num
  );

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

  get tranNameDisplay(): string {
    if (this.mode === 'new') {
      const selected = this.tranEntries[0];
      return selected ? this.formatTranEntryLabel(selected) : '';
    }

    if (!this.current) return '';
    return `${this.current.tranId}-${this.svc.padNum(this.current.tranNumber)}: ${this.current.tranName}`;
  }

  private resolveTechnology(courseDetId: number | ''): void {
    if (!courseDetId) { this.resolvedTechnology = ''; return; }
    const courseId = this.form.get('courseId')?.value;
    const found = this.filteredCourseDetails.find(
      c => c.courseId === courseId && c.courseDetId === Number(courseDetId)
    );
    this.resolvedTechnology = found ? found.technology : '';
  }

  get courseDetailsForCourse(): CourseDetail[] {
    const cid = this.form.get('courseId')?.value;
    if (!cid) return [];
    return this.filteredCourseDetails.filter(c => c.courseId === cid);
  }

  onCourseIdChange(): void {
    this.form.patchValue({ courseDetId: '' }, { emitEvent: false });
    this.resolvedTechnology = '';
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
    if (this.mode === 'view') { this.goBack(); return; }

    const mandatory = [
      'studentType', 'studentId', 'tranId', 'tranNumber', 'attendInTime',
      'attendOutTime', 'tranParticular', 'backValueDate',
      'courseId', 'courseDetId'
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

    this.saving = true;
    const raw = this.form.getRawValue();

    if (this.mode === 'new') {
      const parsed = parseStudentKey(raw.studentId as string);
   const record: StudentDetail = {
        studentId:      parsed?.studentId ?? raw.studentId,
        studentNumber:  parsed?.studentNumber ?? this.resolvedStudentNumber ?? undefined,
        studentName:    this.resolvedStudentName,
        tranDate:       this.todayIso,
        tranId:         raw.tranId as TranIdCode,
         tranNumber: Number(raw.tranNumber), 
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

    } else if (this.current) {
      const record: StudentDetail = {
        ...this.current,
        attendInTime:   raw.attendInTime,
        attendOutTime:  raw.attendOutTime,
        tranParticular: raw.tranParticular,
        backValueDate:  raw.backValueDate,
        courseId:       raw.courseId ?? this.current.courseId,
        courseDetId:    Number(raw.courseDetId) || this.current.courseDetId,
        technology:     this.resolvedTechnology || this.current.technology,
        narration:      raw.narration,
        remarks:        raw.remarks,
        delFlag:        raw.delFlag
      };

      this.svc.update(record).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: 'Daily activity updated successfully!' });
          this.goBack();
        },
        error: (e: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: e.message };
        }
      });
    }
  }

  goBack(): void { this.router.navigateByUrl(this.returnTo ?? '/student-detail'); }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.dataSub.unsubscribe();
    this.blurredFields.clear();
  }
}
