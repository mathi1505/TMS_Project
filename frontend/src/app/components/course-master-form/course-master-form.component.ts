import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseMaster, DelFlag } from '../../models/course-master.model';
import { CourseMasterService } from '../../services/course-master.service';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';

function alphaSpaceOnly(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || /^[a-zA-Z\s]+$/.test(c.value) ? null : { alphaSpace: true };
}

function alphaOnly(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || /^[A-Z]+$/.test(c.value) ? null : { alphaOnly: true };
}

function digitsOnly(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    (c.value === null || c.value === '') ? null :
    /^\d+(\.\d+)?$/.test(String(c.value)) ? null : { digitsOnly: true };
}

function validStatus(): ValidatorFn {
  const valid: DelFlag[] = ['A', 'D'];
  return (c: AbstractControl): ValidationErrors | null =>
    valid.includes(c.value) ? null : { invalidStatus: true };
}

@Component({
  selector: 'app-course-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-master-form.component.html',
  styleUrl: './course-master-form.component.css'
})
export class CourseMasterFormComponent implements OnInit {

  mode: Mode = 'new';
  current: CourseMaster | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  checkingId = false;
  idDuplicate = false;

  readonly statusOptions: DelFlag[] = ['A', 'D'];

  readonly statusLabels: Record<DelFlag, string> = {
    'A': 'Active',
    'D': 'De-Active'
  };

  statusLabel(value: unknown): string {
    return value === 'A' ? 'Active' : 'De-Active';
  }

  form: FormGroup = this.fb.group({
    id:            ['', [Validators.required, Validators.maxLength(2), alphaOnly()]],
    technology:    ['', [Validators.required, Validators.maxLength(25), alphaSpaceOnly()]],
    topic:         ['', [Validators.required, Validators.maxLength(50),  alphaSpaceOnly()]],
    durationWeeks: [null, [Validators.required, Validators.min(0), digitsOnly()]],
    hours:         [{ value: null, disabled: true }, [Validators.required, Validators.min(0), digitsOnly()]],
    delFlag:       ['A', [Validators.required, validStatus()]]
  });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  constructor(
    private fb: FormBuilder,
    private svc: CourseMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.mode = (params.get('mode') as Mode) ?? 'new';
    const id = params.get('id');

    if (this.mode === 'new') {
      this.form.enable();

      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();
      this.form.get('hours')?.disable();
    } else if (id) {
      this.svc.getById(id).subscribe(found => {
        if (found) {
          this.current = found;
          this.form.patchValue({ ...found, delFlag: found.delFlag ?? 'A' });
          if (this.mode === 'modify') {
            this.form.enable();
            this.form.get('id')?.disable();

            this.form.get('delFlag')?.enable();
            this.form.get('hours')?.disable();
          } else {
            this.form.disable();
          }
        } else {
          this.banner = { kind: 'error', text: `Course ID "${id}" not found.` };
          this.form.disable();
        }
      });
    }
  }

  onCourseIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const cleaned = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    input.value = cleaned;
    this.form.get('id')?.setValue(cleaned, { emitEvent: false });

    this.idDuplicate = false;
  }

  onAlphaKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key.length === 1 && !/[a-zA-Z\s]/.test(key)) event.preventDefault();
  }

  onCourseIdKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(key)) return;

    if (key.length === 1 && !/[a-zA-Z]/.test(key)) event.preventDefault();
  }

  onCourseIdBlur(): void {
    if (this.mode !== 'new') return;
    const idCtrl = this.form.get('id');
    const id = (idCtrl?.value ?? '').trim().toUpperCase();
    if (!id || idCtrl?.invalid) { this.idDuplicate = false; return; }

    this.checkingId = true;
    this.svc.getById(id).subscribe(found => {
      this.checkingId = false;
      this.idDuplicate = !!found;
      if (this.idDuplicate) {
        idCtrl?.setErrors({ ...(idCtrl.errors ?? {}), duplicate: true });
        this.banner = { kind: 'error', text: `Course ID "${id}" already exists. Primary key must be unique.` };
      } else if (idCtrl?.hasError('duplicate')) {
        const { duplicate, ...rest } = idCtrl.errors as Record<string, unknown>;
        idCtrl.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
  }

  onDigitKeydown(event: KeyboardEvent): void {
    const key = event.key;
    const allowed = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End','.'];
    if (!allowed.includes(key) && key.length === 1 && !/\d/.test(key)) event.preventDefault();
  }

  private static readonly WORKING_DAYS_PER_WEEK = 6;
  private static readonly HOURS_PER_DAY = 5;

  onWeeksInput(): void {
    const weeksRaw = this.form.get('durationWeeks')?.value;
    const weeks = Number(weeksRaw);
    if (weeksRaw === null || weeksRaw === '' || isNaN(weeks)) {
      this.form.get('hours')?.setValue(null);
      return;
    }
    const totalHours = weeks * CourseMasterFormComponent.WORKING_DAYS_PER_WEEK * CourseMasterFormComponent.HOURS_PER_DAY;
    this.form.get('hours')?.setValue(totalHours);
  }

  onSave(): void {
    if (this.mode === 'view') { this.goBack(); return; }
    this.form.markAllAsTouched();
    if (this.idDuplicate) {
      const id = (this.form.get('id')?.value ?? '').trim().toUpperCase();
      this.banner = { kind: 'error', text: `Course ID "${id}" already exists. Primary key must be unique.` };
      return;
    }
    if (this.form.invalid) {
      this.banner = { kind: 'error', text: 'Please fill all the fields.' };
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue() as CourseMaster;
    const obs = this.mode === 'new' ? this.svc.create(value) : this.svc.update(value);
    obs.subscribe({
      next: () => {
        this.saving = false;
        const msg = this.mode === 'new' ? 'Course master created successfully!' : 'Course master updated successfully!';
        this.toast.show({ kind: 'success', text: msg });
        this.goBack();
      },
      error: (err: Error) => {
        this.saving = false;
        this.banner = { kind: 'error', text: err.message };
        this.toast.show({ kind: 'error', text: err.message });
      }
    });
  }

  goBack(): void { this.router.navigate(['/course-master']); }
}
