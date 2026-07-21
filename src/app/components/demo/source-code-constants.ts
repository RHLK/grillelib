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

export const COLUMNS_CONFIG_SOURCE = `import { Component, ChangeDetectionStrategy, input, model, output } from '@angular/core';
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
  visibility = model.required<Record<string, boolean>>();
  columns = input<{ key: string; label: string; icon: string }[]>([]);
  position = model<'left' | 'right'>('left');

  paginationInfo = input<{
    totalCount: number;
    currentPage: number;
    totalPages: number;
    loading: boolean;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  } | null>(null);

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
}`;

export const PAGINATION_SOURCE = `import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  totalCount = input.required<number>();
  currentPage = model.required<number>();
  pageSize = model.required<number>();
  loading = input<boolean>(false);

  layout = input<'footer' | 'compact'>('footer');
  availablePageSizes = input<number[]>([5, 10, 50, 100]);

  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize();
    return total > 0 ? Math.ceil(total / size) : 1;
  });

  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

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
      this.currentPage.set(1);
      this.pageSizeChanged.emit(newSize);
    }
  }
}`;

export const GUTENBERG_BOOKS_SOURCE = `// ========================================================================================
// REUSABLE COMPONENT SOURCE CODE: PAGINATION COMPONENT (pagination.ts)
// ========================================================================================

import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './pagination.html'
})
export class Pagination {
  totalCount = input.required<number>();
  currentPage = model.required<number>();
  pageSize = model.required<number>();
  loading = input<boolean>(false);
  layout = input<'footer' | 'compact'>('footer');
  availablePageSizes = input<number[]>([5, 10, 50, 100]);

  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize();
    return total > 0 ? Math.ceil(total / size) : 1;
  });

  hasNext = computed(() => this.currentPage() < this.totalPages());
  hasPrev = computed(() => this.currentPage() > 1);

  pageChanged = output<number>();
  pageSizeChanged = output<number>();

  onPageChange(direction: 'next' | 'prev' | 'first'): void {
    let target = this.currentPage();
    if (direction === 'first') target = 1;
    else if (direction === 'next' && this.hasNext()) target += 1;
    else if (direction === 'prev' && this.hasPrev()) target -= 1;

    if (target !== this.currentPage()) {
      this.currentPage.set(target);
      this.pageChanged.emit(target);
    }
  }

  onPageSizeChange(newSize: number): void {
    if (newSize !== this.pageSize()) {
      this.pageSize.set(newSize);
      this.currentPage.set(1);
      this.pageSizeChanged.emit(newSize);
    }
  }
}


// ========================================================================================
// REUSABLE COMPONENT SOURCE CODE: COLUMN CONFIG PANEL (columns-config.ts)
// ========================================================================================

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
  visibility = model.required<Record<string, boolean>>();
  columns = input<{ key: string; label: string; icon: string }[]>([]);
  position = model<'left' | 'right'>('left');

  paginationInfo = input<{
    totalCount: number;
    currentPage: number;
    totalPages: number;
    loading: boolean;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  } | null>(null);

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
}`;

export const GUTENBERG_BOOKS_USAGE_SOURCE = `========================================================================================
AG GRID COMMUNITY: ASYNC INTEGRATION & REUSABLE COMPONENTS DOCUMENTATION
========================================================================================

Since AG Grid Community lacks built-in support for column visibility sidebar panels and
advanced paginated server-side data, this documentation provides a production-grade blueprint
on how to implement them as decoupled, fully reusable standalone Angular components.

----------------------------------------------------------------------------------------
1. REUSABLE PAGINATION COMPONENT (<app-pagination>)
----------------------------------------------------------------------------------------
A versatile pagination controller supporting dual layouts with smooth reactivity.

Usage Blueprint:
<app-pagination
  layout="footer"                  <!-- 'footer' (large) or 'compact' (sidebar) -->
  [totalCount]="totalCount()"       <!-- Number: total available items across all pages -->
  [(currentPage)]="currentPage"     <!-- Signal/Model Number: Two-way data binding -->
  [(pageSize)]="pageSize"           <!-- Signal/Model Number: Two-way data binding -->
  [loading]="isLoading()"           <!-- Boolean: active backend HTTP fetch state -->
  (pageChanged)="onPageChange($event)" <!-- Emits page number (starts at 1) -->
  (pageSizeChanged)="onPageSizeChange($event)" <!-- Emits page size (e.g., 10) -->
/>

Inputs & Outputs:
• [totalCount] (required): Total count of records across all pages.
• [(currentPage)] (required): Current active page (starts at 1). Uses Angular model() for 2-way sync.
• [(pageSize)] (required): Page size (default 10).
• [layout]: Design presentation variant:
   - "footer": Wide table footer layout including exact records number, page selection list, and action buttons.
   - "compact": Fits neatly into side bars or narrow overlays.
• (pageChanged): Event fired with the new page index to trigger backend fetches.
• (pageSizeChanged): Event fired when user switches items per page limit.

----------------------------------------------------------------------------------------
2. REUSABLE COLUMNS VISIBILITY CONFIG PANEL (<app-columns-config>)
----------------------------------------------------------------------------------------
Replicates the native AG Grid Enterprise Column Visibility Menu. Perfectly decoupled and fully reusable.

Usage Blueprint:
<app-columns-config
  [(visibility)]="columnVisibility" <!-- Model Map: Record<string, boolean> -->
  [columns]="columnsMetadata"       <!-- Array: { key, label, icon } metadata -->
  [(position)]="panelPosition"       <!-- Model: 'left' | 'right' position selector -->
  [paginationInfo]="paginationObject" <!-- Optional: Integrated compact pagination metadata -->
  (pageChange)="onPageNavigation($event)" <!-- Optional: Emits 'first' | 'prev' | 'next' -->
/>

Reactivity Pattern:
Bind the active AG Grid columns configuration dynamically through Angular signals or computed values.

import { Component, computed, signal } from '@angular/core';
import { ColDef } from 'ag-grid-community';

export class MyGridComponent {
  // 1. Maintain column visibility map state
  columnVisibility = signal<Record<string, boolean>>({
    id: true,
    title: true,
    authors: true,
    languages: true,
    download_count: true
  });

  // 2. Define all available columns
  columnsMetadata = [
    { key: 'id', label: 'Book ID', icon: 'tag' },
    { key: 'title', label: 'Title', icon: 'book' },
    { key: 'authors', label: 'Authors', icon: 'person' },
    { key: 'languages', label: 'Languages', icon: 'translate' },
    { key: 'download_count', label: 'Downloads', icon: 'download' }
  ];

  // 3. Reactively compute AG Grid colDefs based on visibility signal!
  colDefs = computed<ColDef[]>(() => {
    const visibility = this.columnVisibility();
    return [
      { field: 'id', headerName: 'ID', width: 90, hide: !visibility['id'] },
      { field: 'title', headerName: 'Title', flex: 2, hide: !visibility['title'] },
      { field: 'authors', headerName: 'Authors', width: 200, hide: !visibility['authors'] },
      { field: 'languages', headerName: 'Languages', width: 120, hide: !visibility['languages'] },
      { field: 'download_count', headerName: 'Downloads', width: 140, hide: !visibility['download_count'] }
    ];
  });
}

----------------------------------------------------------------------------------------
3. LIVE GUTENBERG API INTEGRATION BLUEPRINT
----------------------------------------------------------------------------------------
The Gutenberg Catalog (https://gutendex.com/books/) operates as an asynchronous, infinite
data source. Below is the exact implementation showing how to integrate it alongside the reusable
pagination and columns configuration.

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';

@Component({
  selector: 'app-gutenberg-books-integration',
  standalone: true,
  imports: [AgGridAngular, ColumnsConfig, Pagination],
  template: \`
    <div class="flex gap-4">
      <!-- 1. Columns Sidebar with Embedded Compact Pagination -->
      <app-columns-config
        [(visibility)]="columnVisibility"
        [columns]="columnsMetadata"
        [paginationInfo]="booksPaginationInfo()"
        (pageChange)="onBooksPageChange($event)"
      />

      <!-- 2. Grid + Main Footer Pagination -->
      <div class="flex-1 flex flex-col gap-2">
        <ag-grid-angular
          [rowData]="pagedRowData()"
          [columnDefs]="colDefs()"
          class="ag-theme-quartz-dark h-[400px] w-full"
        />

        <app-pagination
          layout="footer"
          [totalCount]="totalBooksAvailable()"
          [(currentPage)]="booksCurrentLocalPage"
          [(pageSize)]="booksPageSize"
          [loading]="booksLoading()"
          (pageChanged)="onLocalPageChange($event)"
          (pageSizeChanged)="onLocalPageSizeChange($event)"
        />
      </div>
    </div>
  \`
})
export class GutenbergBooksComponent implements OnInit {
  private http = inject(HttpClient);

  // States
  allLoadedBooks = signal<any[]>([]);
  totalBooksAvailable = signal<number>(0);
  booksLoading = signal<boolean>(false);
  booksSearchTerm = signal<string>('sherlock');
  booksPageSize = signal<number>(10);
  booksCurrentLocalPage = signal<number>(1);
  booksHasApiMore = signal<boolean>(true);
  apiNextPageToLoad = 1;

  columnVisibility = signal<Record<string, boolean>>({
    id: true, title: true, authors: true, languages: true, download_count: true
  });

  columnsMetadata = [
    { key: 'id', label: 'Book ID', icon: 'tag' },
    { key: 'title', label: 'Title', icon: 'book' },
    { key: 'authors', label: 'Authors', icon: 'person' },
    { key: 'languages', label: 'Languages', icon: 'translate' },
    { key: 'download_count', label: 'Downloads', icon: 'download' }
  ];

  // Reactively compute visible rows for active local page from accumulated cache
  pagedRowData = computed(() => {
    const books = this.allLoadedBooks();
    const start = (this.booksCurrentLocalPage() - 1) * this.booksPageSize();
    return books.slice(start, start + this.booksPageSize());
  });

  // Compile active column definitions
  colDefs = computed<ColDef[]>(() => {
    const vis = this.columnVisibility();
    return [
      { field: 'id', hide: !vis['id'] },
      { field: 'title', hide: !vis['title'] },
      { field: 'download_count', hide: !vis['download_count'] }
    ];
  });

  // Calculate info object for columns config panel integration
  booksPaginationInfo = computed(() => {
    const total = this.totalBooksAvailable();
    const size = this.booksPageSize();
    const pages = total > 0 ? Math.ceil(total / size) : 1;
    const current = this.booksCurrentLocalPage();
    return {
      totalCount: total,
      currentPage: current,
      totalPages: pages,
      loading: this.booksLoading(),
      hasNext: current < pages,
      hasPrev: current > 1,
      pageSize: size
    };
  });

  ngOnInit() {
    this.loadBooks(true);
  }

  loadBooks(reset = false) {
    if (this.booksLoading()) return;
    if (reset) {
      this.allLoadedBooks.set([]);
      this.booksCurrentLocalPage.set(1);
      this.apiNextPageToLoad = 1;
      this.booksHasApiMore.set(true);
    }

    const search = this.booksSearchTerm().trim();
    const url = \\\`https://gutendex.com/books/?page=\\\${this.apiNextPageToLoad}&search=\\\${encodeURIComponent(search)}\\\`;

    this.booksLoading.set(true);
    this.http.get<any>(url).subscribe(res => {
      this.allLoadedBooks.update(prev => [...prev, ...res.results]);
      this.totalBooksAvailable.set(res.count || 0);
      this.booksHasApiMore.set(!!res.next);
      if (res.next) this.apiNextPageToLoad++;
      this.booksLoading.set(false);
    });
  }

  onLocalPageChange(newPage: number) {
    const requiredCount = newPage * this.booksPageSize();
    if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore()) {
      this.loadBooks(false);
    }
  }

  onLocalPageSizeChange(newSize: number) {
    this.booksCurrentLocalPage.set(1);
    const requiredCount = newSize;
    if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore()) {
      this.loadBooks(false);
    }
  }

  onBooksPageChange(direction: 'next' | 'prev' | 'first') {
    let target = this.booksCurrentLocalPage();
    if (direction === 'first') target = 1;
    else if (direction === 'next' && this.booksPaginationInfo().hasNext) target++;
    else if (direction === 'prev' && this.booksPaginationInfo().hasPrev) target--;

    if (target !== this.booksCurrentLocalPage()) {
      this.booksCurrentLocalPage.set(target);
      this.onLocalPageChange(target);
    }
  }
}
`;

