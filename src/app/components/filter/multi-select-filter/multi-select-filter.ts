import { Component, ChangeDetectionStrategy, signal, computed, Input } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'app-multi-select-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './multi-select-filter.html',
  styleUrl: '../filter-shared.css'
})
export class MultiSelectFilterComponent implements IFilterAngularComp {
  @Input() params!: IFilterParams;
  
  // State Signals
  allValues = signal<string[]>([]);
  selectedValues = signal<Set<string>>(new Set<string>());
  searchTerm = signal<string>('');

  // Derived filtered checklist
  filteredValues = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.allValues();
    return this.allValues().filter(v => v.toLowerCase().includes(term));
  });

  agInit(params: IFilterParams): void {
    this.params = params;
    this.extractUniqueValues();
  }

  extractUniqueValues(): void {
    const unique = new Set<string>();
    this.params.api.forEachNode((node) => {
      const val = this.params.getValue(node);
      const strVal = val !== undefined && val !== null ? String(val) : '';
      unique.add(strVal);
    });
    const sorted = Array.from(unique).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    this.allValues.set(sorted);
    // By default, select everything
    this.selectedValues.set(new Set<string>(sorted));
  }

  isFilterActive(): boolean {
    // Active if some values are filtered out (not all are selected)
    return this.selectedValues().size < this.allValues().length;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const value = this.params.getValue(params.node);
    const strVal = value !== undefined && value !== null ? String(value) : '';
    return this.selectedValues().has(strVal);
  }

  getModel(): { values: string[] } | null {
    if (!this.isFilterActive()) {
      return null;
    }
    return {
      values: Array.from(this.selectedValues())
    };
  }

  setModel(model: { values?: string[] } | null): void {
    if (!model || !model.values) {
      this.selectedValues.set(new Set<string>(this.allValues()));
    } else {
      this.selectedValues.set(new Set<string>(model.values));
    }
    this.params.filterChangedCallback();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  toggleValue(value: string): void {
    const current = new Set<string>(this.selectedValues());
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    this.selectedValues.set(current);
    this.params.filterChangedCallback();
  }

  selectAll(): void {
    this.selectedValues.set(new Set<string>(this.allValues()));
    this.params.filterChangedCallback();
  }

  clearAll(): void {
    this.selectedValues.set(new Set<string>());
    this.params.filterChangedCallback();
  }
}
