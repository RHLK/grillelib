import { Component, ChangeDetectionStrategy, signal, computed, Input } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

export type RelativeRangeType = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

@Component({
  selector: 'app-date-range-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './date-range-filter.html',
  styleUrl: '../filter-shared.css'
})
export class AdvancedDateRangeFilterComponent implements IFilterAngularComp {
  @Input() params!: IFilterParams;

  // Signals
  activeRange = signal<RelativeRangeType>('all');
  startDate = signal<string>(''); // YYYY-MM-DD
  endDate = signal<string>('');   // YYYY-MM-DD

  activeRangeLabel = computed(() => {
    switch (this.activeRange()) {
      case 'all': return 'All Time';
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'last7': return 'Last 7 Days';
      case 'last30': return 'Last 30 Days';
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'custom': return 'Custom Range';
    }
  });

  // Compiled Start and End limits
  dateLimits = computed(() => {
    const range = this.activeRange();
    const startVal = this.startDate();
    const endVal = this.endDate();

    // Use current date as reference point
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let from: Date | null = null;
    let to: Date | null = null;

    if (range === 'all') {
      return { from: null, to: null };
    }

    if (range === 'custom') {
      from = startVal ? new Date(startVal + 'T00:00:00') : null;
      to = endVal ? new Date(endVal + 'T23:59:59') : null;
      return { from, to };
    }

    switch (range) {
      case 'today':
        from = new Date(now);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        from = new Date(now);
        from.setDate(from.getDate() - 1);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7':
        from = new Date(now);
        from.setDate(from.getDate() - 7);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last30':
        from = new Date(now);
        from.setDate(from.getDate() - 30);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
    }

    return { from, to };
  });

  agInit(params: IFilterParams): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    return this.activeRange() !== 'all';
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const val = this.params.getValue(params.node);
    if (val === undefined || val === null) return false;

    // Parse cell value (assuming either Date object, timestamp, or YYYY-MM-DD string)
    let cellDate: Date;
    if (val instanceof Date) {
      cellDate = val;
    } else {
      cellDate = new Date(val);
    }

    if (isNaN(cellDate.getTime())) {
      return false; // Can't parse cell date
    }

    const { from, to } = this.dateLimits();

    if (from && cellDate < from) return false;
    if (to && cellDate > to) return false;

    return true;
  }

  getModel(): { activeRange: RelativeRangeType; startDate: string; endDate: string } | null {
    if (!this.isFilterActive()) return null;
    return {
      activeRange: this.activeRange(),
      startDate: this.startDate(),
      endDate: this.endDate()
    };
  }

  setModel(model: { activeRange?: RelativeRangeType; startDate?: string; endDate?: string } | null): void {
    if (model) {
      this.activeRange.set(model.activeRange || 'all');
      this.startDate.set(model.startDate || '');
      this.endDate.set(model.endDate || '');
    } else {
      this.activeRange.set('all');
      this.startDate.set('');
      this.endDate.set('');
    }
    this.params.filterChangedCallback();
  }

  setPreset(preset: RelativeRangeType): void {
    this.activeRange.set(preset);
    if (preset !== 'custom') {
      this.startDate.set('');
      this.endDate.set('');
    }
    this.params.filterChangedCallback();
  }

  onCustomDateChange(type: 'start' | 'end', dateStr: string): void {
    this.activeRange.set('custom');
    if (type === 'start') {
      this.startDate.set(dateStr);
    } else {
      this.endDate.set(dateStr);
    }
    this.params.filterChangedCallback();
  }

  resetDateFilter(): void {
    this.activeRange.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.params.filterChangedCallback();
  }
}
