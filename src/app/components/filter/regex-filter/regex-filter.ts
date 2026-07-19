import { Component, ChangeDetectionStrategy, signal, computed, Input } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'app-regex-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './regex-filter.html',
  styleUrl: '../filter-shared.css'
})
export class RegexFilterComponent implements IFilterAngularComp {
  @Input() params!: IFilterParams;

  // Signals
  pattern = signal<string>('');
  caseSensitive = signal<boolean>(false);

  // Computed validity
  isValidPattern = computed(() => {
    const expr = this.pattern().trim();
    if (!expr) return true;
    try {
      new RegExp(expr);
      return true;
    } catch {
      return false;
    }
  });

  // Re-usable compiled regex
  compiledRegex = computed(() => {
    const expr = this.pattern().trim();
    if (!expr || !this.isValidPattern()) return null;
    return new RegExp(expr, this.caseSensitive() ? '' : 'i');
  });

  agInit(params: IFilterParams): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    return this.pattern().trim().length > 0 && this.isValidPattern();
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const value = this.params.getValue(params.node);
    if (value === undefined || value === null) return false;
    const strVal = String(value);

    const regex = this.compiledRegex();
    if (!regex) return true;

    return regex.test(strVal);
  }

  getModel(): { pattern: string; caseSensitive: boolean } | null {
    if (!this.isFilterActive()) return null;
    return {
      pattern: this.pattern(),
      caseSensitive: this.caseSensitive()
    };
  }

  setModel(model: { pattern?: string; caseSensitive?: boolean } | null): void {
    if (model) {
      this.pattern.set(model.pattern || '');
      this.caseSensitive.set(!!model.caseSensitive);
    } else {
      this.pattern.set('');
      this.caseSensitive.set(false);
    }
    this.params.filterChangedCallback();
  }

  onPatternChange(newPattern: string): void {
    this.pattern.set(newPattern);
    this.params.filterChangedCallback();
  }

  toggleCaseSensitivity(): void {
    this.caseSensitive.update(val => !val);
    this.params.filterChangedCallback();
  }

  clearFilter(): void {
    this.pattern.set('');
    this.params.filterChangedCallback();
  }
}
