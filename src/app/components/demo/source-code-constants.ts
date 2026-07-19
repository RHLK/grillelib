export const MULTI_SELECT_SOURCE = `import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'lib-multi-select-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: \`
    <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-lg w-64 text-sm flex flex-col gap-2">
      <!-- Search Bar -->
      <div class="relative flex items-center">
        <span class="absolute left-2.5 text-gray-400 material-icons text-base">search</span>
        <input
          #searchInput
          type="text"
          placeholder="Search items..."
          (input)="onSearchChange(searchInput.value)"
          class="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <!-- Quick Select Actions -->
      <div class="flex items-center justify-between text-[11px] font-medium text-emerald-600 px-0.5">
        <button type="button" (click)="selectAll()" class="hover:underline cursor-pointer flex items-center gap-0.5">
          <span class="material-icons text-xs">done_all</span> Select All
        </button>
        <button type="button" (click)="clearAll()" class="hover:underline cursor-pointer flex items-center gap-0.5 text-gray-500">
          <span class="material-icons text-xs">clear</span> Clear
        </button>
      </div>

      <hr class="border-gray-100" />

      <!-- Checklist -->
      <div class="max-h-48 overflow-y-auto flex flex-col gap-1.5 py-1">
        @for (item of filteredValues(); track item) {
          <label class="flex items-center gap-2 px-1 py-0.5 hover:bg-gray-50 rounded cursor-pointer select-none text-xs">
            <input
              type="checkbox"
              [checked]="selectedValues().has(item)"
              (change)="toggleValue(item)"
              class="w-3.5 h-3.5 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
            />
            <span class="text-gray-700 truncate" title="{{ item }}">{{ item || '(Blank)' }}</span>
          </label>
        } @empty {
          <div class="text-center text-xs text-gray-400 py-3">No matches found</div>
        }
      </div>

      <hr class="border-gray-100" />

      <!-- Footer Stats -->
      <div class="flex items-center justify-between text-[10px] text-gray-400">
        <span>Selected: {{ selectedValues().size }} / {{ allValues().length }}</span>
        @if (selectedValues().size !== allValues().length) {
          <span class="text-amber-500 font-medium">Filtered</span>
        } @else {
          <span class="text-gray-400">All matching</span>
        }
      </div>
    </div>
  \`
})
export class MultiSelectFilterComponent implements IFilterAngularComp {
  params!: IFilterParams;
  allValues = signal<string[]>([]);
  selectedValues = signal<Set<string>>(new Set<string>());
  searchTerm = signal<string>('');

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
    this.selectedValues.set(new Set<string>(sorted));
  }

  isFilterActive(): boolean {
    return this.selectedValues().size < this.allValues().length;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const value = this.params.getValue(params.node);
    const strVal = value !== undefined && value !== null ? String(value) : '';
    return this.selectedValues().has(strVal);
  }

  getModel(): any {
    if (!this.isFilterActive()) return null;
    return { values: Array.from(this.selectedValues()) };
  }

  setModel(model: any): void {
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
}`;

export const REGEX_SOURCE = `import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'lib-regex-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: \`
    <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-lg w-64 text-sm flex flex-col gap-2.5">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span class="material-icons text-emerald-600 text-sm">code</span>
        <span>Regex Match Filter</span>
      </div>

      <div class="flex flex-col gap-1">
        <div class="relative flex items-center">
          <span class="absolute left-2 text-xs font-mono font-bold text-gray-400">/</span>
          <input
            #regexInput
            type="text"
            [value]="pattern()"
            placeholder="e.g. ^Eng|^Sales|[0-9]+"
            (input)="onPatternChange(regexInput.value)"
            class="w-full pl-5 pr-10 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none"
            [class.border-red-300]="!isValidPattern()"
          />
          <span class="absolute right-2 text-xs font-mono font-bold text-gray-400">/{{ caseSensitive() ? '' : 'i' }}</span>
        </div>
      </div>

      <div class="flex items-center justify-between py-0.5">
        <label class="flex items-center gap-1.5 text-xs text-gray-600">
          <input type="checkbox" [checked]="caseSensitive()" (change)="toggleCaseSensitivity()" />
          <span>Case Sensitive</span>
        </label>
        <button type="button" (click)="clearFilter()" class="text-[10px] text-gray-400 hover:text-emerald-600">Reset</button>
      </div>
    </div>
  \`
})
export class RegexFilterComponent implements IFilterAngularComp {
  params!: IFilterParams;
  pattern = signal<string>('');
  caseSensitive = signal<boolean>(false);

  isValidPattern = computed(() => {
    const expr = this.pattern().trim();
    if (!expr) return true;
    try { new RegExp(expr); return true; } catch { return false; }
  });

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
    const regex = this.compiledRegex();
    return regex ? regex.test(String(value)) : true;
  }

  getModel(): any {
    if (!this.isFilterActive()) return null;
    return { pattern: this.pattern(), caseSensitive: this.caseSensitive() };
  }

  setModel(model: any): void {
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
}`;

export const DATE_RANGE_SOURCE = `import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'lib-date-range-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: \`
    <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-lg w-64 text-sm flex flex-col gap-2.5">
      <div class="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span class="material-icons text-emerald-600 text-sm">calendar_today</span>
        <span>Date Range Filter</span>
      </div>

      <div class="grid grid-cols-2 gap-1">
        <button type="button" (click)="setPreset('all')" class="px-2 py-1 text-left text-[11px] rounded bg-gray-50">All Time</button>
        <button type="button" (click)="setPreset('today')" class="px-2 py-1 text-left text-[11px] rounded bg-gray-50">Today</button>
        <button type="button" (click)="setPreset('last7')" class="px-2 py-1 text-left text-[11px] rounded bg-gray-50">Last 7 Days</button>
        <button type="button" (click)="setPreset('thisMonth')" class="px-2 py-1 text-left text-[11px] rounded bg-gray-50">This Month</button>
      </div>

      <hr class="border-gray-100" />

      <div class="flex flex-col gap-1.5">
        <span class="text-[10px] text-gray-400 font-semibold uppercase">Custom Range</span>
        <input #startInput type="date" [value]="startDate()" (change)="onCustomDateChange('start', startInput.value)" class="w-full text-xs" />
        <input #endInput type="date" [value]="endDate()" (change)="onCustomDateChange('end', endInput.value)" class="w-full text-xs" />
      </div>
    </div>
  \`
})
export class AdvancedDateRangeFilterComponent implements IFilterAngularComp {
  params!: IFilterParams;
  activeRange = signal<string>('all');
  startDate = signal<string>('');
  endDate = signal<string>('');

  dateLimits = computed(() => {
    const range = this.activeRange();
    const now = new Date(); now.setHours(0,0,0,0);
    let from: Date | null = null;
    let to: Date | null = null;

    if (range === 'custom') {
      from = this.startDate() ? new Date(this.startDate() + 'T00:00:00') : null;
      to = this.endDate() ? new Date(this.endDate() + 'T23:59:59') : null;
    } else if (range === 'today') {
      from = new Date(now); to = new Date(now); to.setHours(23,59,59);
    } else if (range === 'last7') {
      from = new Date(now); from.setDate(from.getDate() - 7); to = new Date(now); to.setHours(23,59,59);
    } else if (range === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now.getFullYear(), now.getMonth()+1, 0, 23, 59, 59);
    }
    return { from, to };
  });

  agInit(params: IFilterParams): void { this.params = params; }
  isFilterActive(): boolean { return this.activeRange() !== 'all'; }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const val = this.params.getValue(params.node);
    if (!val) return false;
    const cellDate = new Date(val);
    const { from, to } = this.dateLimits();
    if (from && cellDate < from) return false;
    if (to && cellDate > to) return false;
    return true;
  }

  getModel(): any {
    if (!this.isFilterActive()) return null;
    return { activeRange: this.activeRange(), startDate: this.startDate(), endDate: this.endDate() };
  }

  setModel(model: any): void {
    if (model) {
      this.activeRange.set(model.activeRange || 'all');
      this.startDate.set(model.startDate || '');
      this.endDate.set(model.endDate || '');
    } else {
      this.activeRange.set('all');
    }
    this.params.filterChangedCallback();
  }

  setPreset(preset: string): void {
    this.activeRange.set(preset);
    this.params.filterChangedCallback();
  }

  onCustomDateChange(type: 'start' | 'end', dateStr: string): void {
    this.activeRange.set('custom');
    if (type === 'start') this.startDate.set(dateStr); else this.endDate.set(dateStr);
    this.params.filterChangedCallback();
  }
}`;

export const SMART_AI_SOURCE = `import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';

@Component({
  selector: 'lib-smart-ai-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: \`
    <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-lg w-72 text-sm flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
          <span class="material-icons text-base text-violet-600">psychology</span>
          <span>Gemini Smart AI Filter</span>
        </div>
      </div>
      <input #aiInput type="text" placeholder="e.g. active developers based in UK" (keydown.enter)="applyAiFilter(aiInput.value)" class="w-full text-xs" />
    </div>
  \`
})
export class SmartAIFilterComponent implements IFilterAngularComp {
  params!: IFilterParams;
  private http = inject(HttpClient);

  query = signal<string>('');
  matchingIds = signal<Set<string>>(new Set<string>());

  agInit(params: IFilterParams): void { this.params = params; }
  isFilterActive(): boolean { return this.query().trim().length > 0 && this.matchingIds().size > 0; }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    const id = params.node.data ? String(params.node.data.id) : '';
    return this.matchingIds().has(id);
  }

  applyAiFilter(q: string): void {
    this.query.set(q);
    const rowsToSend: any[] = [];
    this.params.api.forEachNode(node => { if (node.data) rowsToSend.push({ id: node.data.id, data: node.data }); });

    this.http.post<any>('/api/filter/smart-ai', { query: q, rows: rowsToSend })
      .subscribe(res => {
        this.matchingIds.set(new Set(res.matchingIds));
        this.params.filterChangedCallback();
      });
  }
}`;
