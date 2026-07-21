import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  // Required data state
  totalCount = input.required<number>();
  currentPage = model.required<number>();
  pageSize = model.required<number>();
  loading = input<boolean>(false);

  // Configuration inputs
  layout = input<'footer' | 'compact'>('footer');
  availablePageSizes = input<number[]>([5, 10, 50, 100]);

  // Derived/Computed Properties
  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize();
    return total > 0 ? Math.ceil(total / size) : 1;
  });

  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  // Outputs for page actions
  pageChanged = output<number>();
  pageSizeChanged = output<number>();

  onPageChange(direction: 'next' | 'prev' | 'first'): void {
    let target = this.currentPage();
    if (direction === 'first') {
      target = 1;
    } else if (direction === 'next' && this.hasNext()) {
      target += 1;
    } else if (direction === 'prev' && this.hasPrev()) {
      target -= 1;
    }

    if (target !== this.currentPage()) {
      this.currentPage.set(target);
      this.pageChanged.emit(target);
    }
  }

  onPageSizeChange(newSize: number): void {
    if (newSize !== this.pageSize()) {
      this.pageSize.set(newSize);
      this.currentPage.set(1); // Standard reset to page 1 on size change
      this.pageSizeChanged.emit(newSize);
    }
  }
}
