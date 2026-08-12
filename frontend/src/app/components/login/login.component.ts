import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  submitting = false;
  errorMessage = '';
  showPassword = false;

  form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMessage = 'Enter both username and password.';
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.form.disable();

    const { username, password } = this.form.getRawValue();

    this.auth.login({ username: (username as string).trim(), password: password as string }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigateByUrl('/');
      },
      error: (err: Error) => {
        this.submitting = false;
        this.form.enable();
        this.errorMessage = err.message || 'Login failed. Please try again.';
      }
    });
  }
}
