import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { changePasswordGuard } from './guards/change-password.guard';
import { screenGuard } from './guards/screen.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'Login'
  },

  {
    path: 'change-password',
    canActivate: [changePasswordGuard],
    loadComponent: () =>
      import('./components/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    title: 'Set Your Password'
  },

  {
    path: 'config-master',
    canActivate: [authGuard, screenGuard('CFGM')],
    loadComponent: () =>
      import('./components/config-master-list/config-master-list.component').then(m => m.ConfigMasterListComponent),
    title: 'Configuration Master'
  },

  {
    path: 'config-master-form',
    canActivate: [authGuard, screenGuard('CFGM'), adminGuard],
    loadComponent: () =>
      import('./components/config-master-form/config-master-form.component').then(m => m.ConfigMasterFormComponent),
    title: 'Configuration Master – Form'
  },

  {
    path: 'role-access',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/role-access/role-access.component').then(m => m.RoleAccessComponent),
    title: 'Role Access'
  },

  {
    path: 'user-master',
    canActivate: [authGuard, screenGuard('USRM'), adminGuard],
    loadComponent: () =>
      import('./components/user-master-list/user-master-list.component').then(m => m.UserMasterListComponent),
    title: 'User Maintenance'
  },

  {
    path: 'user-master-form',
    canActivate: [authGuard, screenGuard('USRM'), adminGuard],
    loadComponent: () =>
      import('./components/user-master-form/user-master-form.component').then(m => m.UserMasterFormComponent),
    title: 'User Maintenance – Form'
  },

  {
    path: 'course-master',
    canActivate: [authGuard, screenGuard('CRSM')],
    loadComponent: () =>
      import('./components/course-master-list/course-master-list.component').then(m => m.CourseMasterListComponent),
    title: 'Course Master'
  },

  {
    path: 'course-master-form',
    canActivate: [authGuard, screenGuard('CRSM'), adminGuard],
    loadComponent: () =>
      import('./components/course-master-form/course-master-form.component').then(m => m.CourseMasterFormComponent),
    title: 'Course Master – Form'
  },

  {
    path: 'course-detail',
    canActivate: [authGuard, screenGuard('CRSD')],
    loadComponent: () =>
      import('./components/course-detail-list/course-detail-list.component').then(m => m.CourseDetailListComponent),
    title: 'Course Detail – Frontend (Angular 19)'
  },

  {
    path: 'course-detail-form',
    canActivate: [authGuard, screenGuard('CRSD'), adminGuard],
    loadComponent: () =>
      import('./components/course-detail-form/course-detail-form.component').then(m => m.CourseDetailFormComponent),
    title: 'Course Detail – Form'
  },

  {
    path: 'student-master',
    canActivate: [authGuard, screenGuard('STDM')],
    loadComponent: () =>
      import('./components/student-master-list/student-master-list.component').then(m => m.StudentMasterListComponent),
    title: 'Student Master'
  },

  {
    path: 'student-master-form',
    canActivate: [authGuard, screenGuard('STDM')],
    loadComponent: () =>
      import('./components/student-master-form/student-master-form.component').then(m => m.StudentMasterFormComponent),
    title: 'Student Master – Form'
  },

  {
    path: 'transaction-master',
    canActivate: [authGuard, screenGuard('TRXM')],
    loadComponent: () =>
      import('./components/transaction-master-list/transaction-master-list.component').then(m => m.TransactionMasterListComponent),
    title: 'Transaction Master'
  },

  {
    path: 'transaction-master-form',
    canActivate: [authGuard, screenGuard('TRXM'), adminGuard],
    loadComponent: () =>
      import('./components/transaction-master-form/transaction-master-form.component').then(m => m.TransactionMasterFormComponent),
    title: 'Transaction Master – Form'
  },

  {
    path: 'student-detail',
    canActivate: [authGuard, screenGuard('STDD')],
    loadComponent: () =>
      import('./components/student-detail-list/student-detail-list.component').then(m => m.StudentDetailListComponent),
    title: 'Student Daily Activity'
  },

  {
    path: 'student-detail-form',
    canActivate: [authGuard, screenGuard('STDD')],
    loadComponent: () =>
      import('./components/student-detail-form/student-detail-form.component').then(m => m.StudentDetailFormComponent),
    title: 'Student Daily Activity – Form'
  },

  {
    path: 'transaction-detail',
    canActivate: [authGuard, screenGuard('TRXD')],
    loadComponent: () =>
      import('./components/transaction-detail-list/transaction-detail-list.component').then(m => m.TransactionDetailListComponent),
    title: 'Daily Transaction Entry'
  },

  {
    path: 'transaction-detail-form',
    canActivate: [authGuard, screenGuard('TRXD'), adminGuard],
    loadComponent: () =>
      import('./components/transaction-detail-form/transaction-detail-form.component').then(m => m.TransactionDetailFormComponent),
    title: 'Daily Transaction Entry – Form'
  },

  {
    path: 'my-activity',
    canActivate: [authGuard, screenGuard('MYAC')],
    loadComponent: () =>
      import('./components/student-my-activity-list/student-my-activity-list.component').then(m => m.StudentMyActivityListComponent),
    title: 'My Daily Activity'
  },

  {
    path: 'my-activity-form',
    canActivate: [authGuard, screenGuard('MYAC')],
    loadComponent: () =>
      import('./components/student-my-activity-form/student-my-activity-form.component').then(m => m.StudentMyActivityFormComponent),
    title: 'My Daily Activity – New Entry'
  },

  {
    path: 'dashboard',
    canActivate: [authGuard, screenGuard('DASH')],
    loadComponent: () =>
      import('./components/reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
    title: 'Reports Dash Board'
  },

  {
    path: 'report',
    canActivate: [authGuard, screenGuard('RPTS')],
    loadComponent: () =>
      import('./components/report-student-list/report-student-list.component').then(m => m.ReportStudentListComponent),
    title: 'Student Information Report'
  },

  {
    path: 'report-activity',
    canActivate: [authGuard, screenGuard('RPTA')],
    loadComponent: () =>
      import('./components/report-student-activity/report-student-activity.component').then(m => m.ReportStudentActivityComponent),
    title: 'Student Activity Dashboard Report'
  },

  {
    path: 'report-daily-activity',
    canActivate: [authGuard, screenGuard('RPTD')],
    loadComponent: () =>
      import('./components/report-daily-activity/report-daily-activity.component').then(m => m.ReportDailyActivityComponent),
    title: 'Student Daily Activity Report'
  },

  { path: '**', redirectTo: 'dashboard' }
];
