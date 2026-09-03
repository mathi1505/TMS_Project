import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConfigDetail, ConfigMasterCode,
  CONFIG_MASTER_OPTIONS, configMasterDescription
} from '../../models/config-master.model';
import { ConfigDetailService } from '../../services/config-master.service';
import { ToastService } from '../../services/toast.service';

type Mode = 'new' | 'modify' | 'view';

@Component({
  selector: 'app-config-master-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './config-master-form.component.html',
  styleUrl:    './config-master-form.component.css'
})
export class ConfigMasterFormComponent implements OnInit {

  mode: Mode = 'new';
  current: ConfigDetail | null = null;
  banner: { kind: 'success' | 'error' | 'info'; text: string } | null = null;
  saving = false;

  previewId: number | null = null;

  readonly configMasterOptions = CONFIG_MASTER_OPTIONS;

  readonly delFlagOptions = [
    { value: 'A', label: 'Active'      },
    { value: 'D', label: 'De-Active' }
  ];

  form: FormGroup = this.fb.group({
  configMaster: [
    '',
    [Validators.required]
  ],

  configMasterName: [
    '',
    [Validators.required, Validators.maxLength(50)]
  ],

  configName: [
    '',
    [Validators.required]
  ],

  delFlag: [
    'A',
    [Validators.required]
  ]
});

  get modeLabel(): string {
    return { new: 'New Entry', modify: 'Modify', view: 'View' }[this.mode];
  }

  get selectedDescription(): string {
    const code = this.form.get('configMaster')?.value as ConfigMasterCode;
    return code ? configMasterDescription(code) : '';
  }

  get combinedId(): string {
    if (!this.current) return '';
    return `${this.current.configMaster}-${this.svc.padNum(this.current.configId)}`;
  }

  get previewCombinedId(): string {
    const code = this.form.get('configMaster')?.value as ConfigMasterCode;
    const id   = this.previewId;
    if (!code || !id) return '';
    return `${code}-${this.svc.padNum(id)}`;
  }

  constructor(
    private fb: FormBuilder,
    private svc: ConfigDetailService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
  const params = this.route.snapshot.queryParamMap;

  this.mode = (params.get('mode') as Mode) ?? 'new';

  const configMaster =
    params.get('configMaster') as ConfigMasterCode | null;

  const id = params.get('id')
    ? Number(params.get('id'))
    : null;


  
  if (this.mode === 'new') {

    this.form.enable();

    this.form.get('delFlag')?.setValue('A');
    this.form.get('delFlag')?.disable();

    if (configMaster) {

      this.form.get('configMaster')?.setValue(configMaster);

      this.refreshPreviewId(configMaster);

     
      this.updateConfigNameValidator(configMaster);
    }

    this.form.get('configMaster')?.valueChanges.subscribe(
      (code: ConfigMasterCode) => {

        this.refreshPreviewId(code);

        
        this.updateConfigNameValidator(code);
      }
    );

  }


  else if (configMaster && id) {

    this.svc.getByKey(configMaster, id).subscribe(found => {

      if (found) {

        this.current = found;

        this.form.patchValue(found);

      
        this.updateConfigNameValidator(found.configMaster);

        if (this.mode === 'modify') {

          this.form.enable();

          this.form.get('configMaster')?.disable();

        } else {

          this.form.disable();

        }

      } else {

        this.banner = {
          kind: 'error',
          text: `Record ${configMaster}-${this.svc.padNum(id)} not found.`
        };

        this.form.disable();
      }

    });
  }
}
private updateConfigNameValidator(
  code: ConfigMasterCode | string
): void {

  const configNameControl = this.form.get('configName');

  if (!configNameControl) {
    return;
  }

  configNameControl.clearValidators();

  const master = code?.trim().toUpperCase();

  if (master === 'TRXN') {

    configNameControl.setValidators([
      Validators.required,
      Validators.pattern(/^[A-Za-z]{2}\s-\s.+$/)
    ]);

  } else {

   
    configNameControl.setValidators([
      Validators.required
    ]);
  }

  configNameControl.updateValueAndValidity();
}
  private refreshPreviewId(code: ConfigMasterCode | ''): void {
    if (!code) { this.previewId = null; return; }
    this.svc.nextIdAsync(code).subscribe(n => this.previewId = n);
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
     this.svc.create({
  configMaster: raw.configMaster,
  configMasterName: raw.configMasterName,
  configName: raw.configName,
  delFlag: 'A'
}).subscribe({
        next: (saved) => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: `Configuration created! ID: ${saved.configMaster}-${this.svc.padNum(saved.configId)}` });
          this.goBack();
        },
        error: (err: Error) => {
          this.saving = false;
          this.banner = { kind: 'error', text: err.message };
          this.toast.show({ kind: 'error', text: err.message });
        }
      });
    } else {
      const record: ConfigDetail = {
  configMaster: this.current!.configMaster,
  configId: this.current!.configId,
  configMasterName: raw.configMasterName,
  configName: raw.configName,
  delFlag: raw.delFlag
};
      this.svc.update(record).subscribe({
        next: () => {
          this.saving = false;
          this.toast.show({ kind: 'success', text: 'Configuration updated successfully!' });
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

  goBack(): void { this.router.navigate(['/config-master']); }
}
