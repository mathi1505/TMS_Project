import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  TransactionMaster, TransactionIdCode,
  TRXN_ID_SOURCE_CATEGORIES, transactionIdDescription
} from '../../models/transaction-master.model';
import { parseCodeLabel } from '../../models/config-master.model';
import { TransactionMasterService } from '../../services/transaction-master.service';
import { ConfigDetailService } from '../../services/config-master.service';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';
type TrxnIdOption = { value: string; label: string; description: string };

@Component({
  selector: 'app-transaction-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-master-form.component.html',
  styleUrl:    './transaction-master-form.component.css'
})
export class TransactionMasterFormComponent implements OnInit, OnDestroy {

  mode: Mode = 'new';
  current: TransactionMaster | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  previewNumber: number | null = null;

  // Populated from Configuration Master (TRXN / EXP / INC categories).
  trxnIdOptions: TrxnIdOption[] = [];
  private configSub?: Subscription;

  readonly delFlagOptions = [
    { value: 'A', label: 'Active'      },
    { value: 'D', label: 'De-Active' }
  ];

  form: FormGroup = this.fb.group({
    trxnId:   ['',  [Validators.required]],
    trxnName: ['',  [Validators.required, Validators.maxLength(50)]],
    delFlag:  ['A', [Validators.required]]
  });

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get selectedDescription(): string {
    const id = this.form.get('trxnId')?.value as TransactionIdCode;
    if (!id) return '';
    const found = this.trxnIdOptions.find(o => o.value === id);
    return found ? found.description : transactionIdDescription(id);
  }

  get combinedId(): string {
    if (!this.current) return '';
    return `${this.current.trxnId}-${this.svc.padNum(this.current.trxnNumber)}`;
  }

  get previewCombinedId(): string {
    const id  = this.form.get('trxnId')?.value as TransactionIdCode;
    const num = this.previewNumber;
    if (!id || !num) return '';
    return `${id}-${this.svc.padNum(num)}`;
  }

  constructor(
    private fb: FormBuilder,
    private svc: TransactionMasterService,
    private configSvc: ConfigDetailService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.configSub = this.configSvc.activeData$.subscribe(rows => {
      const seen = new Map<string, TrxnIdOption>();
      const order = TRXN_ID_SOURCE_CATEGORIES;
      rows
        .filter(r => (order as readonly string[]).includes(r.configMaster))
        .sort((a, b) => {
          const ca = order.indexOf(a.configMaster as any);
          const cb = order.indexOf(b.configMaster as any);
          return ca !== cb ? ca - cb : a.configId - b.configId;
        })
        .forEach(r => {
          const { code, label } = parseCodeLabel(r.configName);
          if (code && !seen.has(code)) {
            seen.set(code, { value: code, label, description: label });
          }
        });
      this.trxnIdOptions = Array.from(seen.values());
    });
    this.configSvc.getAll().subscribe();

    const params  = this.route.snapshot.queryParamMap;
    this.mode     = (params.get('mode') as Mode) ?? 'new';
    const trxnId  = params.get('trxnId') as TransactionIdCode | null;
    const num     = params.get('num') ? Number(params.get('num')) : null;

    if (this.mode === 'new') {
      this.form.enable();
      this.form.get('delFlag')?.setValue('A');
      this.form.get('delFlag')?.disable();

      if (trxnId) {
        this.form.get('trxnId')?.setValue(trxnId);
        this.refreshPreviewNumber(trxnId);
      }

      this.form.get('trxnId')?.valueChanges.subscribe((id: TransactionIdCode) => {
        this.refreshPreviewNumber(id);
      });

    } else if (trxnId && num) {
      this.svc.getByKey(trxnId, num).subscribe(found => {
        if (found) {
          this.current = found;
          this.form.patchValue(found);
          if (this.mode === 'modify') {
            this.form.enable();
            this.form.get('trxnId')?.disable();
          } else {
            this.form.disable();
          }
        } else {
          this.banner = { kind: 'error', text: `Record ${trxnId}-${this.svc.padNum(num)} not found.` };
          this.form.disable();
        }
      });
    }
  }

  private refreshPreviewNumber(id: TransactionIdCode | ''): void {
    if (!id) { this.previewNumber = null; return; }
    this.svc.nextNumberAsync(id).subscribe(n => this.previewNumber = n);
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

    if (this.mode === 'new') {
      this.svc.create({ trxnId: raw.trxnId, trxnName: raw.trxnName, delFlag: 'A' }).subscribe({
        next: (saved) => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: `Transaction created! ID: ${saved.trxnId}-${this.svc.padNum(saved.trxnNumber)}` });
          this.goBack();
        },
        error: (err: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: err.message };
          this.toast.show({ kind: 'error', text: err.message });
        }
      });
    } else {
      const record: TransactionMaster = {
        trxnId:     this.current!.trxnId,
        trxnNumber: this.current!.trxnNumber,
        trxnName:   raw.trxnName,
        delFlag:    raw.delFlag
      };
      this.svc.update(record).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: 'Transaction updated successfully!' });
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

  ngOnDestroy(): void {
    this.configSub?.unsubscribe();
  }

  goBack(): void { this.router.navigate(['/transaction-master']); }
}
