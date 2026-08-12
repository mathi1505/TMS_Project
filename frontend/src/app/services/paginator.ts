

export class Paginator<T> {

  currentPage = 1;

  constructor(private readonly getItems: () => T[], public pageSize = 10) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.getItems().length / this.pageSize));
  }

  get paged(): T[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.getItems().slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    return this.getItems().length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.getItems().length);
  }

  reset(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }
}
