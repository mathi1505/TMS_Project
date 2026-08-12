import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnChanges {

  @Input() currentPage = 1;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  pageInput = '1';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage']) {
      this.pageInput = String(this.currentPage);
    }
  }

  private clamp(value: number): number {
    if (Number.isNaN(value)) return this.currentPage;
    return Math.min(Math.max(1, value), Math.max(1, this.totalPages));
  }

  private emitIfChanged(page: number): void {
    const safePage = this.clamp(page);
    this.pageInput = String(safePage);
    if (safePage !== this.currentPage) {
      this.pageChange.emit(safePage);
    }
  }

  goFirst(): void { this.emitIfChanged(1); }
  goLast(): void { this.emitIfChanged(this.totalPages); }
  goPrev(): void { this.emitIfChanged(this.currentPage - 1); }
  goNext(): void { this.emitIfChanged(this.currentPage + 1); }

  onJump(): void {
    const parsed = parseInt(this.pageInput, 10);
    this.emitIfChanged(parsed);
  }

  onInputBlur(): void {
    const parsed = parseInt(this.pageInput, 10);
    this.emitIfChanged(parsed);
  }

  onInputChange(value: string): void {
    this.pageInput = value.replace(/[^0-9]/g, '');
  }

  get isFirstPage(): boolean { return this.currentPage <= 1; }
  get isLastPage(): boolean { return this.currentPage >= this.totalPages; }
}
