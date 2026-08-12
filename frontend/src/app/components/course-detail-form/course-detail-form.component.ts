import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CourseDetail, DelFlag } from '../../models/course-detail.model';
import { CourseMaster } from '../../models/course-master.model';
import { CourseDetailService } from '../../services/course-detail.service';
import { CourseMasterService } from '../../services/course-master.service';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';

function alphaSpaceOnly(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || /^[a-zA-Z\s]+$/.test(c.value) ? null : { alphaSpace: true };
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

function validRunningNumber(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value && c.value !== 0) return null;
    return /^(0|[1-9]\d*)$/.test(String(c.value)) ? null : { runningNumber: true };
  };
}

@Component({
  selector: 'app-course-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-detail-form.component.html',
  styleUrl: './course-detail-form.component.css'
})
export class CourseDetailFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: CourseDetail | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  courseOptions: CourseMaster[] = [];
  private dataSub?: Subscription;
  readonly statusOptions: DelFlag[] = ['A', 'D'];

  readonly statusLabels: Record<DelFlag, string> = {
    'A': 'Active',
    'D': 'De-Active'
  };

  statusLabel(value: unknown): string {
    return value === 'A' ? 'Active' : 'De-Active';
  }

  form: FormGroup = this.fb.group({
    courseId:      ['', [Validators.required, Validators.maxLength(2)]],
    courseDetId:   [{ value: '', disabled: true }, [Validators.required, validRunningNumber()]],
    technology:    ['', [Validators.required, Validators.maxLength(25), alphaSpaceOnly()]],
    topic:         ['', [Validators.required, Validators.maxLength(100), alphaSpaceOnly()]],
    durationWeeks: [null, [Validators.required, Validators.min(0), digitsOnly()]],
    hours:         [{ value: null, disabled: true }, [Validators.required, Validators.min(0), digitsOnly()]],
    delFlag:       ['A', [Validators.required, validStatus()]]
  });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  padId(n: number | string | null): string {
    if (n === null || n === undefined || n === '') return '';
    return String(n);
  }

  get combinedId(): string {
    const cId = (this.form.get('courseId')?.value ?? '').toString().toUpperCase();
    const dId = this.form.get('courseDetId')?.value;
    if (!cId || !dId) return '';
    return `${cId}-${this.padId(dId)}`;
  }

  constructor(
    private fb: FormBuilder,
    private svc: CourseDetailService,
    private masterSvc: CourseMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {

    this.dataSub = this.masterSvc.activeData$.subscribe(rows => { this.courseOptions = rows; });
    this.masterSvc.getAll().subscribe();

    const params = this.route.snapshot.queryParamMap;
    this.mode = (params.get('mode') as Mode) ?? 'new';
    const courseId = params.get('courseId');
    const detId    = params.get('detId') ? Number(params.get('detId')) : null;

    if (this.mode === 'new') {
      this.form.enable();
      this.form.get('courseDetId')?.disable();

      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();
      this.form.get('hours')?.disable();

      const preId = params.get('courseId');
      if (preId) {
        this.form.patchValue({ courseId: preId });
        this.refreshNextDetId(preId);
      }
    } else if (courseId && detId) {
      this.svc.getByKey(courseId, detId).subscribe(found => {
        if (found) {
          this.current = found;
          this.form.patchValue({
            ...found,
            courseDetId: this.padId(found.courseDetId),
            delFlag: found.delFlag ?? 'A'
          });

          if (!this.courseOptions.some(c => c.id === found.courseId)) {
            this.masterSvc.getById(found.courseId).subscribe(c => {
              if (c) this.courseOptions = [...this.courseOptions, c];
            });
          }
          if (this.mode === 'modify') {
            this.form.enable();
            this.form.get('courseId')?.disable();
            this.form.get('courseDetId')?.disable();

            this.form.get('delFlag')?.enable();
            this.form.get('hours')?.disable();
          } else {
            this.form.disable();
          }
        } else {
          this.banner = { kind: 'error', text: `Record not found (${courseId} / ${detId}).` };
          this.form.disable();
        }
      });
    }
  }

  private refreshNextDetId(courseId: string): void {
    if (!courseId) {
      this.form.get('courseDetId')?.setValue('');
      return;
    }
    this.svc.nextDetIdAsync(courseId).subscribe(next => {
      this.form.get('courseDetId')?.setValue(this.padId(next));
    });
  }

  onCourseChange(): void {
    const courseId = (this.form.get('courseId')?.value ?? '').toString();
    this.refreshNextDetId(courseId);
  }

  onAlphaKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key.length === 1 && !/[a-zA-Z\s]/.test(key)) event.preventDefault();
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
    const totalHours = weeks * CourseDetailFormComponent.WORKING_DAYS_PER_WEEK * CourseDetailFormComponent.HOURS_PER_DAY;
    this.form.get('hours')?.setValue(totalHours);
  }

  onSave(): void {
    if (this.mode === 'view') { this.goBack(); return; }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.banner = { kind: 'error', text: 'Please fill all the fields.' };
      return;
    }
    this.saving = true;
    const raw = this.form.getRawValue();

    const value: CourseDetail = {
      ...raw,
      courseDetId: parseInt(raw.courseDetId, 10)
    };
    const obs = this.mode === 'new' ? this.svc.create(value) : this.svc.update(value);
    obs.subscribe({
      next: () => {
        this.saving = false;
        const msg = this.mode === 'new' ? 'Course detail created successfully!' : 'Course detail updated successfully!';
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

  goBack(): void { this.router.navigate(['/course-detail']); }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
  }
}
