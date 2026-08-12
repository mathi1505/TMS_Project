import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup,
  ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  TransactionDetail, TransactionDetailType, TRANSACTION_DETAIL_TYPE_OPTIONS, drCrForType
} from '../../models/transaction-detail.model';
import { TransactionDetailService } from '../../services/transaction-detail.service';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { TransactionMaster } from '../../models/transaction-master.model';
import { StudentMasterService } from '../../services/student-master.service';
import { StudentMaster, studentKey } from '../../models/student-master.model';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';

function notFutureDate(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const [y, m, d] = (c.value as string).split('-').map(Number);
    const chosen = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return chosen > today ? { futureDate: true } : null;
  };
}

@Component({
  selector: 'app-transaction-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-detail-form.component.html',
  styleUrl: './transaction-detail-form.component.css'
})
export class TransactionDetailFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: TransactionDetail | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  todayIso = new Date().toISOString().slice(0, 10);

  masterEntries: TransactionMaster[] = [];

  resolvedTrxnName = '';

  blurredFields = new Set<string>();

  readonly typeOptions = TRANSACTION_DETAIL_TYPE_OPTIONS;

  readonly delFlagOptions = [
    { value: 'A', label: 'Active' },
    { value: 'D', label: 'De-Active' }
  ];

  readonly referenceNoCodeOptions = ['LSINT', 'LSTRI'];
  allStudents: StudentMaster[] = [];
  referenceNoSuggestions: StudentMaster[] = [];
  showReferenceNoSuggestions = false;
  showStudentName = false;

  private sub!: Subscription;
  private dataSub = new Subscription();

  form: FormGroup = this.fb.group({
    trxnId: ['', [Validators.required]],
    masterNumber: ['', [Validators.required]],
    valueDate: ['', [Validators.required, notFutureDate()]],
    studentName: [{ value: '', disabled: true }],
    referenceNo: ['', [Validators.maxLength(15)]],
    description: ['', [Validators.maxLength(50)]],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    delFlag: ['A', [Validators.required]]
  });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get drCrPreview(): 'D' | 'C' | '' {
    const t = this.form.get('trxnId')?.value as TransactionDetailType | '';
    return t ? drCrForType(t) : '';
  }

  constructor(
    private fb: FormBuilder,
    public svc: TransactionDetailService,
    private masterSvc: TransactionMasterService,
    private studentSvc: StudentMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.dataSub.add(this.studentSvc.activeData$.subscribe(rows => { this.allStudents = rows; }));
    this.studentSvc.getAll().subscribe();

    this.route.queryParamMap.subscribe(params => {
      this.initForRoute(params);
    });
  }

  private initForRoute(params: ParamMap): void {
    this.sub?.unsubscribe();
    this.mode = (params.get('mode') as Mode) ?? 'new';

    this.current = null;
    this.blurredFields.clear();
    this.banner = null;
    this.saving = false;
    this.resolvedTrxnName = '';
    this.masterEntries = [];

    this.form.reset({
      trxnId: '', masterNumber: '', valueDate: this.todayIso,
      referenceNo: '',studentName: '', description: '', amount: '', delFlag: 'A'
    }, { emitEvent: false });
    this.form.enable();
    this.form.markAsUntouched();
    this.form.markAsPristine();

    if (this.mode === 'new') {

      this.form.get('masterNumber')?.disable({ emitEvent: false });

      const typeSub = this.form.get('trxnId')!.valueChanges.subscribe(t => {
        this.onTypeChange(t);
      });

      this.sub = typeSub;

      this.form.markAsUntouched();

    } else {

      const trxnId = params.get('trxnId') as TransactionDetailType | null;
      const masterNumber = params.get('masterNumber') ? Number(params.get('masterNumber')) : null;
      const tranDate = params.get('tranDate');
      const valueDate = params.get('valueDate');
      const referenceNo = params.get('referenceNo') ?? '';

      if (trxnId && masterNumber !== null && tranDate && valueDate) {
        this.svc.getByKey(trxnId, masterNumber, tranDate, valueDate, referenceNo).subscribe(found => {
          if (found) {
            this.current = found;
            this.form.patchValue({
              trxnId: found.trxnId,
              masterNumber: found.masterNumber,
              valueDate: found.valueDate,
              referenceNo: found.referenceNo,
              description: found.description,
              amount: found.amount,
              delFlag: found.delFlag
            });
            const student = this.allStudents.find(
              s => this.referenceNoOptionLabel(s).toUpperCase() ===
                (found.referenceNo ?? '').toUpperCase()
            );

            this.showStudentName = !!student;

            this.form.patchValue({
              studentName: student ? student.studentName : ''
            });
            this.masterSvc.getByKey(found.trxnId, found.masterNumber).subscribe(master => {
              this.resolvedTrxnName = master?.trxnName ?? '';
            });

            this.masterSvc.getByTrxnId(found.trxnId).subscribe(entries => {
              this.masterEntries = entries.filter(e => e.delFlag === 'A');
            });

            if (this.mode === 'modify') {
              this.form.enable();

              this.form.get('trxnId')?.disable();
              this.form.get('masterNumber')?.disable();
            } else {
              this.form.disable();
            }
            this.form.markAsUntouched();
          } else {
            this.banner = { kind: 'error', text: 'Transaction entry not found.' };
            this.form.disable();
          }
        });
      }
    }
  }

  private onTypeChange(t: TransactionDetailType | ''): void {
    this.resolvedTrxnName = '';
    this.masterEntries = [];
    this.form.patchValue({ masterNumber: '' }, { emitEvent: false });

    if (!t) {
      this.form.get('masterNumber')?.disable({ emitEvent: false });
      return;
    }

    this.form.get('masterNumber')?.enable({ emitEvent: false });

    this.masterSvc.getByTrxnId(t).subscribe(entries => {
      this.masterEntries = entries.filter(e => e.delFlag === 'A');
    });
  }

  onMasterChange(): void {
    const t = this.form.get('trxnId')?.value as TransactionDetailType | '';
    const num = Number(this.form.get('masterNumber')?.value);
    if (!t || !num) { this.resolvedTrxnName = ''; return; }
    const found = this.masterEntries.find(e => e.trxnId === t && e.trxnNumber === num);
    this.resolvedTrxnName = found ? found.trxnName : '';
  }

  onReferenceNoInput(): void {

  const value = (this.form.get('referenceNo')?.value ?? '')
    .toString()
    .trim()
    .toUpperCase();

  const student = this.allStudents.find(
    s => this.referenceNoOptionLabel(s).toUpperCase() === value
  );

  if (student) {
    // Valid student reference no
    this.showStudentName = true;

    this.form.patchValue({
      studentName: student.studentName
    });

  } else {
    // Not a valid student reference no
    this.showStudentName = false;

    this.form.patchValue({
      studentName: ''
    });
  }


  const matchedCodes = value
    ? this.referenceNoCodeOptions.filter(o => o.startsWith(value))
    : [];

  if (matchedCodes.length) {

    this.referenceNoSuggestions = this.allStudents
      .filter(s => matchedCodes.includes(s.studentId.toUpperCase()))
      .sort((a, b) =>
        a.studentId === b.studentId
          ? a.studentNumber - b.studentNumber
          : a.studentId.localeCompare(b.studentId)
      );

    this.showReferenceNoSuggestions = true;

  } else {

    this.referenceNoSuggestions = [];
    this.showReferenceNoSuggestions = false;
  }
}

  studentKeyFor(s: StudentMaster): string {
    return studentKey(s.studentId, s.studentNumber);
  }

  referenceNoOptionLabel(s: StudentMaster): string {
    return `${s.studentId}-${s.studentNumber}`;
  }


  selectReferenceNoSuggestion(student: StudentMaster): void {

    this.form.patchValue({
      referenceNo: this.referenceNoOptionLabel(student),
      studentName: student.studentName
    });
    this.showStudentName = true;
    this.showReferenceNoSuggestions = false;
    this.referenceNoSuggestions = [];

    this.onFieldBlur('referenceNo');
  }
  onReferenceNoBlur(): void {
    setTimeout(() => { this.showReferenceNoSuggestions = false; }, 150);
    this.onFieldBlur('referenceNo');
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

    const mandatory = ['trxnId', 'masterNumber', 'valueDate', 'amount'];

    mandatory.forEach(f => {
      this.blurredFields.add(f);
      this.form.get(f)?.markAsTouched();
    });

    const hasErrors = mandatory.some(f => {
      const ctrl = this.form.get(f);
      return ctrl && ctrl.enabled && ctrl.invalid;
    });

    if (hasErrors) {
      this.banner = { kind: 'error', text: 'Please fill all the fields.' };
      return;
    }

    this.saving = true;
    const raw = this.form.getRawValue();

    if (this.mode === 'new') {
      const type: TransactionDetailType = raw.trxnId;

      const record: TransactionDetail = {
        trxnId: type,
        masterNumber: Number(raw.masterNumber),
        tranDate: this.todayIso,
        valueDate: raw.valueDate,
        referenceNo: raw.referenceNo,
        studentName: raw.studentName,   
        description: raw.description,
        drCrFlag: drCrForType(type),
        amount: Number(raw.amount),
        delFlag: 'A'
      };

      this.svc.create(record).subscribe({
        next: (saved) => {
          this.saving = false;
          this.toast.show({
            kind: 'success',
            text: `Transaction entry saved! ID: ${this.svc.combinedDetId(saved)}`
          });
          this.goBack();
        },
        error: (e: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: e.message };
        }
      });

    } else if (this.current) {
      const record: TransactionDetail = {
        ...this.current,
        valueDate: raw.valueDate,
        referenceNo: raw.referenceNo,
        studentName: raw.studentName,   
        description: raw.description,
        amount: Number(raw.amount),
        delFlag: raw.delFlag
      };

      this.svc.update(this.current, record).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: 'Transaction entry updated successfully!' });
          this.goBack();
        },
        error: (e: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: e.message };
        }
      });
    }
  }

  goBack(): void { this.router.navigate(['/transaction-detail']); }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.dataSub.unsubscribe();
    this.blurredFields.clear();
  }
}
