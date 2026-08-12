import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messageSubject = new Subject<ToastMessage>();
  readonly messages$ = this.messageSubject.asObservable();

  show(message: ToastMessage): void {
    this.messageSubject.next(message);
  }

  success(text: string): void {
    this.show({ kind: 'success', text });
  }

  error(text: string): void {
    this.show({ kind: 'error', text });
  }
}
