import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AppUser, AppUserUpsertRequest } from '../../models/app-user.model';
import { ROLE_OPTIONS, Role, roleOptionsFromConfig } from '../../models/auth.model';
import { AppUserService } from '../../services/app-user.service';
import { ToastService } from '../../services/toast.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { StudentMasterService } from '../../services/student-master.service';
import { StudentMaster } from '../../models/student-master.model';

type Mode = 'new' | 'modify' | 'view';

@Component({
  selector: 'app-user-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-master-form.component.html',
  styleUrl:    './user-master-form.component.css'
})
export class UserMasterFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: AppUser | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

 
  roleOptions = ROLE_OPTIONS;

 
  studentIdOptions: { value: string; label: string }[] = [];

  readonly delFlagOptions = [
    { value: 'A', label: 'Active'      },
    { value: 'D', label: 'De-Active' }
  ];

  studentSuggestions: StudentMaster[] = [];
  showStudentSuggestions = false;
  studentNameSearching = false;

  private allUsers: AppUser[] = [];
  userNameDuplicate = false;

  form: FormGroup = this.fb.group({
    role:       ['ADMIN' as Role, [Validators.required]],
    userName:   ['', [Validators.required, Validators.maxLength(25)]],
    password:   [''],
    studentId:  [''],
    studentName:[''],
    studentNo:  [null],
    delFlag:    ['A', [Validators.required]]
  });

  private configSub?: Subscription;
  private studentNameInput$ = new Subject<string>();
  private studentNameSub?: Subscription;

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get isStudentRole(): boolean {
    return this.form.get('role')?.value === 'STUDENT';
  }

  get combinedId(): string {
    if (!this.current) return '';
    return `${this.current.userId}-${this.current.userNo}`;
  }

  get idPreview(): string {
    if (this.isStudentRole) {
      const id = this.form.get('studentId')?.value;
      const no = this.form.get('studentNo')?.value;
      return id && no ? `${(id as string).toUpperCase()}-${no}` : 'Pick a Student ID and Student Name.';
    }
    const role = this.form.get('role')?.value as Role;
    // Mirrors UserService.create()'s prefix logic (first 3 letters of the role
    // code) so the preview matches the saved ID for ANY configured role.
    const prefix = (role || '').slice(0, 3).toUpperCase() || 'USR';
    return `${prefix}-<auto>`;
  }

  constructor(
    private fb: FormBuilder,
    private svc: AppUserService,
    private configDetSvc: ConfigDetailService,
    private studentSvc: StudentMasterService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.mode = (params.get('mode') as Mode) ?? 'new';

    const userId = params.get('userId');
    const userNo = params.get('userNo') ? Number(params.get('userNo')) : null;

    this.svc.getAll().subscribe(all => { this.allUsers = all; });

    
    this.configSub = this.configDetSvc.activeData$.subscribe(rows => {
      this.roleOptions = roleOptionsFromConfig(rows);

      this.studentIdOptions = rows
        .filter(r => r.configMaster === 'STUD' && r.configName.trim().toUpperCase() !== 'EMPLOYEE')
        .map(r => this.parseStudPrefix(r.configName))
        .map(({ code, label }) => ({ value: `LS${code}`, label: `LS${code} - ${label}` }));
    });
    this.configDetSvc.getAll().subscribe();

   
    this.studentNameSub = this.studentNameInput$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => {
        const q = term.trim();
        if (q.length < 2) { this.studentNameSearching = false; return of([] as StudentMaster[]); }
        this.studentNameSearching = true;
        return this.studentSvc.searchByName(q);
      })
    ).subscribe(results => {
      this.studentNameSearching = false;
      const selectedTypePrefix = (this.form.get('studentId')?.value as string) || '';
      const filtered = selectedTypePrefix
        ? results.filter(s => s.studentId.toUpperCase() === selectedTypePrefix.toUpperCase())
        : results;
      this.studentSuggestions = filtered.filter(s => s.delFlag === 'A');
      this.showStudentSuggestions = this.studentSuggestions.length > 0;
    });

    this.form.get('role')?.valueChanges.subscribe((role: Role) => this.applyRoleValidators(role));

    this.form.get('userName')?.valueChanges.subscribe(() => {
      if (this.userNameDuplicate) {
        this.userNameDuplicate = false;
        const errs = { ...(this.form.get('userName')?.errors ?? {}) };
        delete errs['duplicate'];
        this.form.get('userName')?.setErrors(Object.keys(errs).length ? errs : null);
      }
    });

    if (this.mode === 'new') {
      this.form.enable();
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(4)]);
      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();
      this.applyRoleValidators(this.form.get('role')?.value);
      return;
    }

    if (userId && userNo) {
      this.svc.getByKey(userId, userNo).subscribe(found => {
        if (found) {
          this.current = found;
          this.form.patchValue({
            role: found.role,
            userName: found.userName,
            delFlag: found.delFlg,
            studentId: found.role === 'STUDENT' ? found.userId : '',
            studentNo: found.role === 'STUDENT' ? found.userNo : null
          });
          this.applyRoleValidators(found.role);

          // Show the linked Student Master name alongside the fixed ID / No.
          if (found.role === 'STUDENT') {
            this.studentSvc.getByIdAndNumber(found.userId, found.userNo).subscribe(s => {
              this.form.patchValue({ studentName: s?.studentName ?? '' }, { emitEvent: false });
            });
          }

          if (this.mode === 'modify') {
            this.form.enable({ emitEvent: false });
          } else {
            this.form.disable();
          }
         
          this.form.get('role')?.disable();
          this.form.get('studentId')?.disable();
          this.form.get('studentName')?.disable();
          this.form.get('studentNo')?.disable();
        } else {
          this.banner = { kind: 'error', text: `User "${userId}-${userNo}" not found.` };
          this.form.disable();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
    this.studentNameSub?.unsubscribe();
  }

 
  private parseStudPrefix(configName: string): { code: string; label: string } {
    const name = (configName ?? '').trim();
    const dashIdx = name.search(/[-–—]/);
    if (dashIdx > 0) {
      const code = name.slice(0, dashIdx).trim().toUpperCase();
      const label = name.slice(dashIdx + 1).trim();
      if (code) return { code, label: label || code };
    }
    return { code: name.toUpperCase(), label: name };
  }

  private applyRoleValidators(role: Role): void {
    const studentId = this.form.get('studentId');
    const studentName = this.form.get('studentName');
    const studentNo = this.form.get('studentNo');
    if (role === 'STUDENT') {
      studentId?.setValidators([Validators.required]);
      studentName?.setValidators([Validators.required]);
      studentNo?.setValidators([Validators.required]);
    } else {
      studentId?.clearValidators();
      studentName?.clearValidators();
      studentNo?.clearValidators();
      this.clearStudentSelection();
    }
    studentId?.updateValueAndValidity();
    studentName?.updateValueAndValidity();
    studentNo?.updateValueAndValidity();
  }

 
  studentIdLocked = false;


  onStudentIdChange(): void {
    this.clearStudentSelection();
  }

  onStudentNameInput(value: string): void {
    if (!value) {
      this.clearStudentSelection();
      return;
    }
    this.form.get('studentNo')?.setValue(null);
    this.studentNameInput$.next(value);
  }

  onStudentNameFocus(): void {
    if (this.studentSuggestions.length) this.showStudentSuggestions = true;
  }

  onStudentNameBlur(): void {

    setTimeout(() => this.showStudentSuggestions = false, 150);
  }

  onUserNameBlur(): void {
    this.form.get('userName')?.markAsTouched();
    this.checkUserNameDuplicate();
  }

  private checkUserNameDuplicate(): void {
    const raw = this.form.get('userName')?.value as string | null;
    this.userNameDuplicate = false;
    if (!raw || !raw.trim()) return;

    const v = raw.trim().toLowerCase();
    const found = this.allUsers.find(u => {
      if (this.current && u.userId === this.current.userId && u.userNo === this.current.userNo) return false;
      return (u.userName ?? '').trim().toLowerCase() === v;
    });

    if (found) {
      this.userNameDuplicate = true;
      this.form.get('userName')?.setErrors({ ...(this.form.get('userName')?.errors ?? {}), duplicate: true });
    }
  }

  selectStudentSuggestion(s: StudentMaster): void {
    this.form.patchValue({
      studentId: s.studentId,
      studentName: s.studentName,
      studentNo: s.studentNumber
    });

    this.form.get('studentId')?.disable({ emitEvent: false });
    this.studentIdLocked = true;
    this.studentSuggestions = [];
    this.showStudentSuggestions = false;
  }

  private clearStudentSelection(): void {
    this.form.patchValue({ studentName: '', studentNo: null }, { emitEvent: false });
    if (this.mode === 'new') {
      this.form.get('studentId')?.enable({ emitEvent: false });
    }
    this.studentIdLocked = false;
    this.studentSuggestions = [];
    this.showStudentSuggestions = false;
  }

  onSave(): void {
    if (this.mode === 'view') { this.goBack(); return; }
    this.form.markAllAsTouched();
    this.checkUserNameDuplicate();
    if (this.form.invalid) {
      this.banner = { kind: 'error', text: this.userNameDuplicate
        ? 'User Name already exists.'
        : 'Please fill all the required fields.' };
      return;
    }
    if (this.isStudentRole && !this.form.get('studentNo')?.value) {
      this.banner = { kind: 'error', text: 'Pick a student from the Student Name suggestions.' };
      return;
    }
    this.saving = true;
    const raw = this.form.getRawValue();

    const payload: AppUserUpsertRequest = {
      userName: raw.userName,
      role: raw.role,
      delFlg: raw.delFlag
    };
    if (raw.password) payload.password = raw.password;
    if (raw.role === 'STUDENT') {
      payload.studentId = (raw.studentId as string).trim().toUpperCase();
      payload.studentNo = Number(raw.studentNo);
    }

    if (this.mode === 'new') {
      this.svc.create(payload).subscribe({
        next: (saved) => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: `User created! ID: ${saved.userId}-${saved.userNo}` });
          this.goBack();
        },
        error: (err: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: err.message };
          this.toast.show({ kind: 'error', text: err.message });
        }
      });
    } else {
      this.svc.update(this.current!.userId, this.current!.userNo, payload).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: 'User updated successfully!' });
          this.goBack();
        },
        error: (err: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: err.message };
          this.toast.show({ kind: 'error', text: err.message });
        }
      });
    }
  }

  goBack(): void { this.router.navigate(['/user-master']); }
}
