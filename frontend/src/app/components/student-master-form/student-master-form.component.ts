import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StudentMaster } from '../../models/student-master.model';
import { StudentMasterService } from '../../services/student-master.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { TransactionMaster, TransactionIdCode, transactionIdLabel } from '../../models/transaction-master.model';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { ToastService } from '../../services/toast.service';

const STAFF_TRXN_IDS: TransactionIdCode[] = ['TR'];

const ALL_STAFF_TRXN_IDS: TransactionIdCode[] = ['AS', 'TR', 'ME'];

type Mode = 'new' | 'modify' | 'view';
const LS_DRAFT_KEY = 'tms_student_form_draft';

function digitsOnlyStr(len?: number): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const v = String(c.value);
    if (!/^\d+$/.test(v)) return { digitsOnly: true };
    if (len && v.length !== len) return { exactLength: { required: len, actual: v.length } };
    return null;
  };
}

function emailValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const v: string = c.value.trim();
    if (!v.includes('@')) return { emailAt: true };

    const domain = v.slice(v.indexOf('@') + 1);
    if (!domain.includes('.com')) return { emailDotCom: true };
    return null;
  };
}

function notFutureDate(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const [y, m, d] = (c.value as string).split('-').map(Number);
    const chosen = new Date(y, m - 1, d);
    const today  = new Date(); today.setHours(0, 0, 0, 0);
    return chosen > today ? { futureDate: true } : null;
  };
}

function fourDigitYear(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (c.value === null || c.value === '') return null;
    const y = Number(c.value);
    const currentYear = new Date().getFullYear();
    if (isNaN(y) || y < 1990 || y > currentYear) return { invalidYear: true };
    return null;
  };
}

@Component({
  selector: 'app-student-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './student-master-form.component.html',
  styleUrl: './student-master-form.component.css'
})
export class StudentMasterFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: StudentMaster | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;
  todayIso = new Date().toISOString().slice(0, 10);
  currentYear = new Date().getFullYear().toString();
  previewId = '';
  previewNumber: number | null = null;
  section1Valid = false;
  hasDraft = false;

  duplicateErrors: Record<string, string> = {};

  blurredFields = new Set<string>();


  returnTo: string | null = null;

  private sub!: Subscription;
  private allStudents: StudentMaster[] = [];



  studentTypeOptions: { value: string; label: string }[] = [];

  readonly studyModeOptions: { value: string; label: string }[] = [
    { value: 'On',  label: 'On - Online'  },
    { value: 'Off', label: 'Off - Offline' },
    { value: 'HYB', label: 'Hybrid'        }
  ];

  readonly stdStatusOptions: { value: string; label: string }[] = [
    { value: 'In Progress',       label: 'In Progress'       },
    { value: 'Left',              label: 'Left'              },
    { value: 'Transferred to HO', label: 'Transferred to HO' }
  ];

  staffOptions: TransactionMaster[] = [];

  readonly staffCategories = STAFF_TRXN_IDS;

  staffOptionsFor(trxnId: TransactionIdCode): TransactionMaster[] {
    return this.staffOptions.filter(o => o.trxnId === trxnId);
  }

  staffCategoryLabel(trxnId: TransactionIdCode): string {
    return transactionIdLabel(trxnId);
  }

  staffKey(entry: TransactionMaster): string {
    return `${entry.trxnId}-${this.trxnSvc.padNum(entry.trxnNumber)}`;
  }

  formatStaffLabel(entry: TransactionMaster): string {
    return `${entry.trxnId} - ${entry.trxnName}`;
  }

  get legacyAssignedStaffOption(): TransactionMaster | null {
    const currentKey = this.form.get('assignedStaff')?.value;
    if (!currentKey) return null;
    return this.staffOptions.find(o =>
      this.staffKey(o) === currentKey && !STAFF_TRXN_IDS.includes(o.trxnId)
    ) ?? null;
  }

  private parseStaffKey(key: string): { trxnId: TransactionIdCode; trxnNumber: number } | null {
    if (!key) return null;
    const dash = key.lastIndexOf('-');
    if (dash <= 0) return null;
    const trxnId = key.slice(0, dash).trim().toUpperCase() as TransactionIdCode;
    const trxnNumber = Number(key.slice(dash + 1));
    if (!ALL_STAFF_TRXN_IDS.includes(trxnId) || !Number.isFinite(trxnNumber)) return null;
    return { trxnId, trxnNumber };
  }

  readonly paidOptions = [
    { value: 'Y', label: 'Yes – Paid'    },
    { value: 'N', label: 'No – Non-Paid' }
  ];

  freqOptions: { value: string; label: string }[] = [];
  readonly delFlagOptions = [
    { value: 'A', label: 'Active'    },
    { value: 'D', label: 'De-Active' }
  ];

  private configSub?: Subscription;
  private staffSub?: Subscription;

  private readonly MANDATORY_FIELDS = [
    'studentType', 'studentName',
    'studyMode', 'assignedStaff', 'batch', 'nativePlace', 'joiningDate',
    'mobileNo', 'emergencyContactNo', 'emailId',
    'qualification', 'collegeName', 'passoutYear', 'experience',
    'paidStatus', 'totalAgreedFee', 'durationFrequency', 'totalDuration'
  ];

  private readonly UNIQUE_FIELDS = ['mobileNo', 'emailId'];

  private readonly SECTION1_FIELDS = [
    'studentType', 'studentName',
    'studyMode', 'assignedStaff', 'batch', 'nativePlace', 'joiningDate'
  ];

  private readonly SECTION2_FIELDS = [
    'mobileNo', 'emergencyContactNo', 'relationship', 'emailId',
    'qualification', 'collegeName', 'passoutYear', 'experience', 'referenceBy',
    'paidStatus', 'totalAgreedFee', 'durationFrequency', 'totalDuration'
  ];

  form: FormGroup = this.fb.group({
    studentType:        ['',    [Validators.required]],
    studentName:        ['',    [Validators.required, Validators.maxLength(50)]],
    studyMode:          ['On',  [Validators.required]],
    assignedStaff:      ['',    [Validators.required]],
    batch:              [null,  [Validators.required, Validators.min(1)]],
    nativePlace:        ['',    [Validators.required, Validators.maxLength(25)]],
    joiningDate:        ['',    [Validators.required, notFutureDate()]],
    mobileNo:           ['',    [Validators.required, digitsOnlyStr(10)]],
    emergencyContactNo: ['',    [Validators.required, digitsOnlyStr(10)]],
    relationship:       ['',    [Validators.maxLength(30)]],
    emailId:            ['',    [Validators.required, Validators.maxLength(30), emailValidator()]],
    qualification:      ['',    [Validators.required, Validators.maxLength(20)]],
    collegeName:        ['',    [Validators.required, Validators.maxLength(50)]],
    passoutYear:        [null,  [Validators.required, fourDigitYear()]],
    experience:         ['',    [Validators.required, Validators.maxLength(30)]],
    referenceBy:        ['',    [Validators.maxLength(30)]],
    paidStatus:         ['Y',   [Validators.required]],
    totalAgreedFee:     [null,  [Validators.required, Validators.min(0)]],
    durationFrequency:  ['M',   [Validators.required]],
    totalDuration:      [null,  [Validators.required, Validators.min(1)]],
    stdStatus:          ['In Progress', [Validators.required]],
    delFlag:            ['A',   [Validators.required]]
  });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get isPaid(): boolean {
    return this.form.get('paidStatus')?.value === 'Y';
  }

  constructor(
    private fb: FormBuilder,
    private svc: StudentMasterService,
    private configDetSvc: ConfigDetailService,
    private trxnSvc: TransactionMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe(all => { this.allStudents = all; });



    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.studentTypeOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim() !== 'Employee')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));

      const typeCtrl = this.form.get('studentType');
      if (typeCtrl) {
        if (typeCtrl.value) {
          typeCtrl.setValue(typeCtrl.value, { emitEvent: false });
        } else if (this.mode === 'new' && this.studentTypeOptions.length) {
          typeCtrl.setValue(this.studentTypeOptions[0].value);
        }
      }

      this.freqOptions = rows
        .filter(r => r.configMaster === 'FREQ')
        .map(r => ({ value: this.parseCodePrefix(r.configName), label: r.configName }));

      const freqCtrl = this.form.get('durationFrequency');
      if (freqCtrl && freqCtrl.value) {
        freqCtrl.setValue(freqCtrl.value, { emitEvent: false });
      }
    });
    this.configDetSvc.getAll().subscribe();



    this.staffSub = this.trxnSvc.activeData$.subscribe(rows => {
      this.staffOptions = rows.filter(r => STAFF_TRXN_IDS.includes(r.trxnId));

      const staffCtrl = this.form.get('assignedStaff');
      if (staffCtrl?.value) {

        staffCtrl.setValue(staffCtrl.value, { emitEvent: false });
      }
    });
    this.trxnSvc.getAll().subscribe();

    this.route.queryParamMap.subscribe(params => {
      this.initForRoute(params);
    });
  }

  private initForRoute(params: ParamMap): void {

    this.sub?.unsubscribe();

    this.mode = (params.get('mode') as Mode) ?? 'new';
    const id  = params.get('id');
    const studentNumberParam = params.get('studentNumber');
    const studentNumber = studentNumberParam !== null ? Number(studentNumberParam) : null;
    this.returnTo = params.get('returnTo');


    this.current         = null;
    this.blurredFields.clear();
    this.duplicateErrors = {};
    this.banner          = null;
    this.saving          = false;
    this.section1Valid   = false;


    this.form.reset({
      studentType: '', studentName: '', studyMode: 'On', assignedStaff: '',
      batch: null, nativePlace: '', joiningDate: '',
      mobileNo: '', emergencyContactNo: '', relationship: '', emailId: '',
      qualification: '', collegeName: '', passoutYear: null,
      experience: '', referenceBy: '', paidStatus: 'Y',
      totalAgreedFee: null, durationFrequency: 'M', totalDuration: null,
      stdStatus: 'In Progress', delFlag: 'A'
    }, { emitEvent: false });
    this.form.enable();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    if (this.mode === 'new') {

      this.blurredFields.clear();
      this.duplicateErrors = {};
      this.banner          = null;
      this.section1Valid   = false;
      this.saving          = false;

      this.SECTION2_FIELDS.forEach(f => this.form.get(f)?.disable());
      this.form.get('stdStatus')?.setValue('In Progress');
      this.form.get('stdStatus')?.disable();
      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();

      this.restoreDraft();

      this.recalcSection1(true);



      this.form.markAsUntouched();
      this.form.markAsPristine();



      const initialType = this.form.get('studentType')?.value;
      if (initialType) {
        this.svc.previewNextId(initialType).subscribe(id => this.previewId = id);
        this.svc.previewNextNumber(initialType).subscribe(num => this.previewNumber = num);
      }

      const typeSub = this.form.get('studentType')!.valueChanges
        .subscribe((type: string) => {
          if (!type) { this.previewId = ''; this.previewNumber = null; return; }
          this.svc.previewNextId(type).subscribe(id => this.previewId = id);
          this.svc.previewNextNumber(type).subscribe(num => this.previewNumber = num);
        });

      const paidSub = this.form.get('paidStatus')!.valueChanges
        .subscribe((paid: string) => this.onPaidStatusChange(paid));

      this.sub = this.form.valueChanges.subscribe(() => {
        this.recalcSection1(false);
        this.saveDraft();
      });

      this.sub.add(typeSub);
      this.sub.add(paidSub);

    } else if (id) {

      this.blurredFields.clear();
      this.duplicateErrors = {};
      this.banner          = null;
      this.saving          = false;

      const lookup = studentNumber !== null
        ? this.svc.getByIdAndNumber(id, studentNumber)
        : this.svc.getById(id);

      lookup.subscribe(found => {
        if (found) {
          this.current = found;
          this.form.patchValue(found);


          if (found.assignedStaff && !this.staffOptions.some(o => this.staffKey(o) === found.assignedStaff)) {
            const parsed = this.parseStaffKey(found.assignedStaff);
            if (parsed) {
              this.trxnSvc.getByKey(parsed.trxnId, parsed.trxnNumber).subscribe(entry => {
                if (entry) {
                  this.staffOptions = [...this.staffOptions, entry];
                  const staffCtrl = this.form.get('assignedStaff');
                  if (staffCtrl?.value) {
                    staffCtrl.setValue(staffCtrl.value, { emitEvent: false });
                  }
                }
              });
            }
          }
          if (this.mode === 'modify') {
            this.form.enable();
            this.form.get('studentType')?.disable();
            this.section1Valid = true;

            this.onPaidStatusChange(found.paidStatus);

            this.sub = this.form.get('paidStatus')!.valueChanges
              .subscribe((paid: string) => this.onPaidStatusChange(paid));
          } else {
            this.form.disable();
            this.section1Valid = true;
          }

          this.form.markAsUntouched();
          this.form.markAsPristine();
        } else {
          this.banner = { kind: 'error', text: studentNumber !== null
            ? `Student ID "${id}" / No. ${studentNumber} not found.`
            : `Student ID "${id}" not found.` };
          this.form.disable();
        }
      });
    }
  }

  private parseCodePrefix(configName: string): string {
    const dashIdx = configName.indexOf('-');
    if (dashIdx <= 0) return configName.trim();
    return configName.slice(0, dashIdx).trim().toUpperCase();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.configSub?.unsubscribe();
    this.staffSub?.unsubscribe();

    this.blurredFields.clear();
    this.duplicateErrors = {};
  }

  private onPaidStatusChange(paid: string): void {
    const feeCtrl = this.form.get('totalAgreedFee');
    if (!feeCtrl) return;
    if (paid === 'N') {
      feeCtrl.setValue(0, { emitEvent: false });
      feeCtrl.disable({ emitEvent: false });
      feeCtrl.clearValidators();
      feeCtrl.setValidators([Validators.min(0)]);
      feeCtrl.updateValueAndValidity({ emitEvent: false });
    } else {
      if (this.mode !== 'view') feeCtrl.enable({ emitEvent: false });
      feeCtrl.clearValidators();
      feeCtrl.setValidators([Validators.required, Validators.min(0)]);
      feeCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private syncFeeFieldState(): void {
    this.onPaidStatusChange(this.form.get('paidStatus')?.value ?? 'Y');
  }

  private recalcSection1(silent: boolean): void {
    const allValid = this.SECTION1_FIELDS.every(f => {
      const c = this.form.get(f);
      return c && c.valid && c.value !== null && c.value !== '';
    });

    if (allValid && !this.section1Valid) {

      this.section1Valid = true;
      this.SECTION2_FIELDS.forEach(f => {
        if (f === 'totalAgreedFee' && this.form.get('paidStatus')?.value === 'N') return;
        this.form.get(f)?.enable({ emitEvent: false });
      });

    } else if (!allValid && this.section1Valid) {

      this.section1Valid = false;
      this.SECTION2_FIELDS.forEach(f => {
        const ctrl = this.form.get(f);
        if (ctrl?.enabled) {
          ctrl.disable({ emitEvent: false });
          if (!silent) {
            ctrl.reset(null, { emitEvent: false });
            this.blurredFields.delete(f);
            delete this.duplicateErrors[f];
          }
        }
      });

    } else if (!allValid && !this.section1Valid) {

      this.SECTION2_FIELDS.forEach(f => {
        const ctrl = this.form.get(f);
        if (ctrl?.enabled) {
          ctrl.disable({ emitEvent: false });
          if (!silent) {
            ctrl.reset(null, { emitEvent: false });
            this.blurredFields.delete(f);
            delete this.duplicateErrors[f];
          }
        }
      });
    }
  }

  onFieldBlur(fieldName: string): void {
    const ctrl = this.form.get(fieldName);
    if (!ctrl) return;

    this.blurredFields.add(fieldName);
    ctrl.markAsTouched();

    delete this.duplicateErrors[fieldName];
    if (this.UNIQUE_FIELDS.includes(fieldName)) {
      this.checkDuplicate(fieldName, ctrl.value);
    }

    if (fieldName === 'emergencyContactNo' || fieldName === 'mobileNo') {
      const mobile    = this.form.get('mobileNo')?.value;
      const emergency = this.form.get('emergencyContactNo')?.value;
      if (mobile && emergency && mobile === emergency) {
        this.form.get('emergencyContactNo')?.setErrors({ sameAsMobile: true });
      } else if (this.form.get('emergencyContactNo')?.hasError('sameAsMobile')) {
        this.form.get('emergencyContactNo')?.updateValueAndValidity({ emitEvent: false });
      }
    }


  }

  private checkDuplicate(field: string, rawValue: unknown): void {
    if (rawValue === null || rawValue === undefined) return;
    const value = String(rawValue);
    if (!value.trim()) return;
    const v = value.trim().toLowerCase();
    const excludeId = this.current?.studentId ?? null;
    const excludeNumber = this.current?.studentNumber ?? null;

    const found = this.allStudents.find(s => {
      if (excludeId && s.studentId === excludeId && s.studentNumber === excludeNumber) return false;
      const fieldVal = (s as any)[field];
      return fieldVal && String(fieldVal).trim().toLowerCase() === v;
    });

    if (found) {
      const label = field === 'mobileNo' ? 'Mobile No' : 'Email ID';
      this.duplicateErrors[field] = `${label} already exists (${found.studentId} / No. ${found.studentNumber}).`;
      this.form.get(field)?.setErrors({ duplicate: true });
    }
  }

  hasDuplicateError(field: string): boolean {
    return !!this.duplicateErrors[field];
  }

  showError(field: string): boolean {
    if (!this.blurredFields.has(field)) return false;
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid);
  }

  err(field: string, error: string): boolean {
    if (!this.blurredFields.has(field)) return false;
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error));
  }

  hasErr(field: string): boolean {
    if (!this.blurredFields.has(field)) return false;
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid);
  }

  onDigitsOnly(event: KeyboardEvent): void {
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
    if (!allowed.includes(event.key) && event.key.length === 1 && !/\d/.test(event.key)) {
      event.preventDefault();
    }
  }

  onAlphaOnly(event: KeyboardEvent): void {
    if (event.key.length === 1 && !/[a-zA-Z\s]/.test(event.key)) event.preventDefault();
  }

  private saveDraft(): void {
    try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(this.form.getRawValue())); } catch {  }
  }

  private restoreDraft(): void {
    try {
      const saved = localStorage.getItem(LS_DRAFT_KEY);
      if (!saved) return;
      this.form.patchValue(JSON.parse(saved), { emitEvent: false });
      this.syncFeeFieldState();
      this.hasDraft = true;

      this.blurredFields.clear();
      this.form.markAsUntouched();
    } catch {
      localStorage.removeItem(LS_DRAFT_KEY);
    }
  }

  clearDraft(): void {
    try {
      localStorage.removeItem(LS_DRAFT_KEY);
      this.hasDraft = false;
      const defaultType = this.studentTypeOptions[0]?.value ?? '';
      const defaultMode = this.studyModeOptions[0]?.value ?? '';
      this.form.reset({
        studentType: defaultType, studentName: '', studyMode: defaultMode, assignedStaff: '',
        batch: null, nativePlace: '', joiningDate: '',
        mobileNo: '', emergencyContactNo: '', relationship: '', emailId: '',
        qualification: '', collegeName: '', passoutYear: null,
        experience: '', referenceBy: '', paidStatus: 'Y',
        totalAgreedFee: null, durationFrequency: 'M', totalDuration: null,
        stdStatus: 'In Progress', delFlag: 'A'
      }, { emitEvent: false });
      this.form.enable();
      this.SECTION2_FIELDS.forEach(f => this.form.get(f)?.disable());
      this.form.get('stdStatus')?.disable();
      this.form.get('delFlag')?.disable();
      this.syncFeeFieldState();
      this.blurredFields.clear();
      this.duplicateErrors = {};
      this.section1Valid = false;
      this.recalcSection1(true);
      if (defaultType) {
        this.svc.previewNextId(defaultType).subscribe(id => this.previewId = id);
        this.svc.previewNextNumber(defaultType).subscribe(num => this.previewNumber = num);
      } else {
        this.previewId = '';
        this.previewNumber = null;
      }

      this.form.markAsUntouched();
      this.form.markAsPristine();
    } catch {  }
  }

  onSave(): void {
    if (this.mode === 'view') { this.goBack(); return; }


    const mandatoryToCheck = this.form.get('paidStatus')?.value === 'N'
      ? this.MANDATORY_FIELDS.filter(f => f !== 'totalAgreedFee')
      : this.MANDATORY_FIELDS;

    mandatoryToCheck.forEach(f => {
      this.blurredFields.add(f);
      this.form.get(f)?.markAsTouched();
    });

    this.duplicateErrors = {};
    this.UNIQUE_FIELDS.forEach(f => {
      const v = this.form.get(f)?.value;
      if (v) this.checkDuplicate(f, v);
    });

    const hasDupes    = Object.keys(this.duplicateErrors).length > 0;
    const rawValue     = this.form.getRawValue();
    const formInvalid = mandatoryToCheck.some(f => {
      const ctrl = this.form.get(f);
      if (!ctrl) return true;
      if (ctrl.enabled && ctrl.invalid) return true;
      const v = (rawValue as Record<string, unknown>)[f];
      return v === null || v === undefined || v === '';
    });

    if (formInvalid || hasDupes) {
      this.banner = { kind: 'error', text: 'Please fill all the fields.' };
      return;
    }

    this.saving = true;
   const raw = this.form.getRawValue();

const value = raw as StudentMaster;
    value.mobileNo = Number(value.mobileNo);
    value.emergencyContactNo = Number(value.emergencyContactNo);

    if (value.paidStatus === 'N') {
      value.totalAgreedFee = 0;
    }

    if (this.mode === 'modify' && this.current) {
      value.studentId     = this.current.studentId;
      value.studentNumber = this.current.studentNumber;
    }

   const obs = this.mode === 'new'
  ? this.svc.create(value, raw.studentType)
  : this.svc.update(value);
    obs.subscribe({
      next: (saved) => {
        this.saving = false;
        this.clearDraft();
        const msg = this.mode === 'new'
          ? `Student created successfully! ID: ${saved.studentId} / No. ${saved.studentNumber}`
          : 'Student record updated successfully!';
        this.toast.show({ kind: 'success', text: msg });
        this.goBack();
      },
      error: (e: Error) => {
        this.saving = false;
        this.banner = { kind: 'error', text: e.message };
        this.toast.show({ kind: 'error', text: e.message });
      }
    });
  }

  goBack(): void { this.router.navigateByUrl(this.returnTo ?? '/student-master'); }

  onViewDailyActivity(): void {
    if (!this.current) return;
    this.router.navigate(['/report-daily-activity'], {
      queryParams: { id: this.current.studentId, studentNumber: this.current.studentNumber }
    });
  }

}
