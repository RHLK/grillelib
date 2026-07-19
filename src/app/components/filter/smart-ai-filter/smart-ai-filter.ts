import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IFilterAngularComp } from 'ag-grid-angular';
import { IFilterParams, IDoesFilterPassParams } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-smart-ai-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './smart-ai-filter.html',
  styleUrl: '../filter-shared.css'
})
export class SmartAIFilterComponent implements IFilterAngularComp {
  @Input() params!: IFilterParams;
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  // State Signals
  query = signal<string>('');
  isLoading = signal<boolean>(false);
  isError = signal<boolean>(false);
  isFallback = signal<boolean>(false);
  statusText = signal<string>('');
  loadingMessage = signal<string>('Connecting to Gemini...');

  // Set of IDs that pass the AI filter
  matchingIds = signal<Set<string>>(new Set<string>());

  agInit(params: IFilterParams): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    return this.query().trim().length > 0 && !this.isError() && this.matchingIds().size > 0;
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    // Standard ID tracking
    const id = params.node.data ? String(params.node.data.id) : '';
    if (!id) return true; // Fail-open for safety
    return this.matchingIds().has(id);
  }

  getModel(): { query: string; matchingIds: string[]; isFallback: boolean; statusText: string } | null {
    if (!this.isFilterActive()) return null;
    return {
      query: this.query(),
      matchingIds: Array.from(this.matchingIds()),
      isFallback: this.isFallback(),
      statusText: this.statusText()
    };
  }

  setModel(model: { query?: string; matchingIds?: string[]; isFallback?: boolean; statusText?: string } | null): void {
    if (model) {
      this.query.set(model.query || '');
      this.matchingIds.set(new Set<string>(model.matchingIds || []));
      this.isFallback.set(!!model.isFallback);
      this.statusText.set(model.statusText || '');
    } else {
      this.query.set('');
      this.matchingIds.set(new Set<string>());
      this.isFallback.set(false);
      this.statusText.set('');
    }
    this.params.filterChangedCallback();
  }

  setSuggestion(inputEl: HTMLInputElement, val: string): void {
    inputEl.value = val;
    this.applyAiFilter(val);
  }

  applyAiFilter(rawQuery: string): void {
    const q = rawQuery.trim();
    this.query.set(q);

    if (!q) {
      this.resetAiFilter();
      return;
    }

    this.isLoading.set(true);
    this.isError.set(false);
    this.isFallback.set(false);
    this.statusText.set('');
    this.loadingMessage.set('Reading active table rows...');

    // Extract table rows for processing
    const rowsToSend: { id: string; data: unknown }[] = [];
    this.params.api.forEachNode((node) => {
      if (node.data) {
        rowsToSend.push({
          id: String(node.data.id),
          data: node.data
        });
      }
    });

    if (rowsToSend.length === 0) {
      this.isLoading.set(false);
      this.isError.set(true);
      this.statusText.set('No active rows found to evaluate.');
      return;
    }

    this.loadingMessage.set('Consulting Gemini AI API...');

    const subscription = this.http.post<{ matchingIds: string[]; isFallback: boolean; error?: string }>('/api/filter/smart-ai', {
      query: q,
      rows: rowsToSend
    })
    .pipe(
      finalize(() => this.isLoading.set(false))
    )
    .subscribe({
      next: (response) => {
        const ids = new Set<string>(response.matchingIds || []);
        this.matchingIds.set(ids);
        
        if (response.isFallback) {
          this.isFallback.set(true);
          this.statusText.set('Using local fallback (no API key). Matches text precisely.');
        } else if (response.error) {
          this.isError.set(true);
          this.statusText.set(`AI responded with issue: ${response.error}`);
        } else {
          this.statusText.set(`Successfully filtered! Found ${ids.size} matching items.`);
        }

        // Trigger AG Grid redraw
        this.params.filterChangedCallback();
      },
      error: (err) => {
        console.error('Smart AI Filter Error:', err);
        this.isError.set(true);
        this.statusText.set('API request failed. Please check backend connection.');
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  resetAiFilter(): void {
    this.query.set('');
    this.matchingIds.set(new Set<string>());
    this.isLoading.set(false);
    this.isError.set(false);
    this.isFallback.set(false);
    this.statusText.set('');
    this.params.filterChangedCallback();
  }
}
