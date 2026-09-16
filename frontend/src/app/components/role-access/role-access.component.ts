import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RoleAccessService } from '../../services/role-access.service';
import { ToastService } from '../../services/toast.service';
import { RoleOption, ScreenDefinition } from '../../models/role-access.model';

interface ScreenGroup {
  group: string;
  screens: ScreenDefinition[];
}

@Component({
  selector: 'app-role-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-access.component.html',
  styleUrl: './role-access.component.css'
})
export class RoleAccessComponent implements OnInit {

  loading = true;
  saving = false;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;

  roles: RoleOption[] = [];
  screens: ScreenDefinition[] = [];
  groups: ScreenGroup[] = [];

  selectedRole = '';
  selectedCodes = new Set<string>();

  private originalCodes = new Set<string>();

  get isAdminRole(): boolean {
    return this.selectedRole === 'ADMIN';
  }

  get totalCount(): number {
    return this.screens.length;
  }

  get selectedCount(): number {
    return this.selectedCodes.size;
  }

  get isDirty(): boolean {
    if (this.isAdminRole) return false;
    if (this.selectedCodes.size !== this.originalCodes.size) return true;
    for (const code of this.selectedCodes) {
      if (!this.originalCodes.has(code)) return true;
    }
    return false;
  }

  constructor(private svc: RoleAccessService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      roles: this.svc.getRoles(),
      screens: this.svc.getScreens()
    }).subscribe({
      next: ({ roles, screens }) => {
        this.roles = roles;
        this.screens = screens;
        this.groups = this.buildGroups(screens);
        this.selectedRole = roles.find(r => r.value !== 'ADMIN')?.value ?? roles[0]?.value ?? '';
        if (this.selectedRole) this.loadAccess(this.selectedRole);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.banner = { kind: 'error', text: 'Could not load roles / screens. Please try again.' };
      }
    });
  }

  onRoleChange(): void {
    this.banner = null;
    if (!this.selectedRole) return;
    this.loadAccess(this.selectedRole);
  }

  isChecked(code: string): boolean {
    return this.selectedCodes.has(code);
  }

  toggle(code: string): void {
    if (this.isAdminRole) return;
    if (this.selectedCodes.has(code)) {
      this.selectedCodes.delete(code);
    } else {
      this.selectedCodes.add(code);
    }
  }

  selectAll(): void {
    if (this.isAdminRole) return;
    this.selectedCodes = new Set(this.screens.map(s => s.code));
  }

  clearAll(): void {
    if (this.isAdminRole) return;
    this.selectedCodes = new Set();
  }

  save(): void {
    if (this.isAdminRole || !this.selectedRole) return;
    this.saving = true;
    this.banner = null;
    const codes = Array.from(this.selectedCodes);
    this.svc.saveAccessForRole(this.selectedRole, codes).subscribe({
      next: res => {
        this.saving = false;
        this.originalCodes = new Set(res.screenCodes);
        this.selectedCodes = new Set(res.screenCodes);
        this.toast.success(`Access saved for ${this.roleLabel(this.selectedRole)}.`);
      },
      error: () => {
        this.saving = false;
        this.banner = { kind: 'error', text: 'Could not save access. Please try again.' };
      }
    });
  }

  roleLabel(value: string): string {
    return this.roles.find(r => r.value === value)?.label ?? value;
  }

  private loadAccess(role: string): void {
    if (role === 'ADMIN') {
      // Mirrors the backend: ADMIN gets every screen except 'MYAC' (My Daily
      // Activity), which is deliberately excluded from admin's full access.
      this.selectedCodes = new Set(
        this.screens.map(s => s.code).filter(c => c !== 'MYAC')
      );
      this.originalCodes = new Set(this.selectedCodes);
      return;
    }
    this.loading = true;
    this.svc.getAccessForRole(role).subscribe({
      next: res => {
        this.selectedCodes = new Set(res.screenCodes);
        this.originalCodes = new Set(res.screenCodes);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.banner = { kind: 'error', text: `Could not load access for ${this.roleLabel(role)}.` };
      }
    });
  }

  private buildGroups(screens: ScreenDefinition[]): ScreenGroup[] {
    const order: string[] = [];
    const map = new Map<string, ScreenDefinition[]>();
    for (const s of screens) {
      if (!map.has(s.group)) {
        map.set(s.group, []);
        order.push(s.group);
      }
      map.get(s.group)!.push(s);
    }
    return order.map(group => ({ group, screens: map.get(group)! }));
  }
}
