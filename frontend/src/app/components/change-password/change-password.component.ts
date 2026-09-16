import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword ? { mismatch: true } : null;
}

/**
 * Optional password-change screen. Reached either voluntarily, or via the
 * "change your password?" popup shown once after a user's first login.
 * Just overwrites the existing password_hash — nothing else is tracked.
 */
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  submitting = false;
  errorMessage = '';
  showCurrentPassword = false;
  showNewPassword = false;

  form: FormGroup = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordsMatchValidator }
  );

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage = this.form.hasError('mismatch')
        ? 'New password and confirmation do not match.'
        : 'Enter your current password and a new password (at least 6 characters).';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.form.disable();

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.show({ kind: 'success', text: 'Password changed successfully.' });
        this.router.navigateByUrl(this.auth.isStudent() ? '/my-activity' : '/');
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting = false;
        this.form.enable();
        this.errorMessage = err?.error?.message || 'Could not change password. Please try again.';
      }
    });
  }
}
