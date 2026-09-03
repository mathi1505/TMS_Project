import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

/**
 * Login screen: Username + Password only. There is no "Login As" role
 * picker any more — the backend looks the username up in app_user and
 * resolves the role (ADMIN / STAFF / STUDENT) from the database, so the
 * screen the user lands on afterwards is decided purely by what's
 * actually stored for that user, not by anything picked on this form.
 */
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

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

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
    const request: LoginRequest = {
      username: (username as string).trim(),
      password: password as string
    };

    this.auth.login(request).subscribe({
      next: () => {
        this.submitting = false;
       
        this.router.navigateByUrl(this.auth.isStudent() ? '/my-activity' : '/');
      },
      error: (err: Error) => {
        this.submitting = false;
        this.form.enable();
        this.errorMessage = err.message || 'Login failed. Please try again.';
      }
    });
  }
}
