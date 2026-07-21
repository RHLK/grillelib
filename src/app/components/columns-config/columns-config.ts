import { Component, ChangeDetectionStrategy, input, model, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Pagination } from '../pagination/pagination';

@Component({
  selector: 'app-columns-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, Pagination],
  templateUrl: './columns-config.html',
  styleUrl: '../filter/filter-shared.css'
})
export class ColumnsConfig {
  // Model inputs for binding visibility and panel configuration reactively
  visibility = model.required<Record<string, boolean>>();
  columns = input<{ key: string; label: string; icon: string }[]>([]);
  position = model<'left' | 'right'>('left');

  // Optional inputs for external pagination & stats integration (like Gutenberg Books)
  paginationInfo = input<{
    totalCount: number;
    currentPage: number;
    totalPages: number;
    loading: boolean;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  } | null>(null);

  // Pagination navigation outputs
  pageChange = output<'next' | 'prev' | 'first'>();

  onCompactPageChange(newPage: number): void {
    const info = this.paginationInfo();
    if (!info) return;
    if (newPage === 1) {
      this.pageChange.emit('first');
    } else if (newPage > info.currentPage) {
      this.pageChange.emit('next');
    } else {
      this.pageChange.emit('prev');
    }
  }

  toggleColumn(key: string): void {
    const prev = this.visibility();
    const updated = { ...prev, [key]: !prev[key] };
    // Safety rule: Keep at least one column visible to prevent empty grid rendering bugs
    const hasVisible = Object.values(updated).some(val => val === true);
    if (hasVisible) {
      this.visibility.set(updated);
    }
  }

  showAllColumns(): void {
    const current = { ...this.visibility() };
    for (const key of Object.keys(current)) {
      current[key] = true;
    }
    this.visibility.set(current);
  }

  hideAllColumnsExceptName(): void {
    const current = { ...this.visibility() };
    for (const key of Object.keys(current)) {
      current[key] = (key === 'name' || key === 'title');
    }
    this.visibility.set(current);
  }
}
