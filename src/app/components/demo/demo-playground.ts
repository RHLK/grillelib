import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';

// Import our library filters from the refactored directory
import { MultiSelectFilterComponent } from '../filter/multi-select-filter/multi-select-filter';
import { RegexFilterComponent } from '../filter/regex-filter/regex-filter';
import { AdvancedDateRangeFilterComponent } from '../filter/date-range-filter/date-range-filter';
import { SmartAIFilterComponent } from '../filter/smart-ai-filter/smart-ai-filter';
import { ColumnsConfig } from '../columns-config/columns-config';
import { Pagination } from '../pagination/pagination';

// Import the extracted mock data and source constants
import { Employee, EMPLOYEES_DATA, GutendexBook } from './demo-data';
import {
  MULTI_SELECT_SOURCE,
  REGEX_SOURCE,
  DATE_RANGE_SOURCE,
  SMART_AI_SOURCE,
  COLUMNS_CONFIG_SOURCE,
  PAGINATION_SOURCE,
  GUTENBERG_BOOKS_SOURCE,
  GUTENBERG_BOOKS_USAGE_SOURCE
} from './source-code-constants';

@Component({
  selector: 'app-demo-playground',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AgGridAngular,
    MultiSelectFilterComponent,
    RegexFilterComponent,
    AdvancedDateRangeFilterComponent,
    SmartAIFilterComponent,
    ColumnsConfig,
    Pagination,
    DecimalPipe
  ],
  templateUrl: './demo-playground.html',
  styleUrl: './demo-playground.css'
})
export class DemoPlaygroundComponent {
  // Inject HttpClient for asynchronous Gutenberg Books dataset
  private http = inject(HttpClient);

  // Storybook state management
  selectedTheme = signal<'dark' | 'classic'>('dark');
  selectedStory = signal<string>('overview'); // 'overview', 'gpl-license', 'multi-select', 'regex', 'date-range', 'smart-ai', 'gutenberg-books', 'columns-config', 'pagination'
  selectedCodeTab = signal<'usage' | 'source'>('usage');
  copiedState = signal<boolean>(false);
  copyTimeout: ReturnType<typeof setTimeout> | null = null;

  // Custom signals for standalone Pagination demo playground
  demoCurrentPage = signal<number>(1);
  demoPageSize = signal<number>(10);

  // AG Grid APIs
  gridApi!: GridApi;

  // Datasets
  employeeRowData = signal<Employee[]>(EMPLOYEES_DATA);
  allLoadedBooks = signal<GutendexBook[]>([]);

  // Dynamically computed rowData based on active selected story
  rowData = computed<(Employee | GutendexBook)[]>(() => {
    if (this.selectedStory() === 'gutenberg-books') {
      const books = this.allLoadedBooks();
      const pageSize = this.booksPageSize();
      const page = this.booksCurrentLocalPage();
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return books.slice(startIndex, endIndex);
    }
    return this.employeeRowData();
  });

  // Position control for Columns Config Panel ('left' | 'right')
  columnsPanelPosition = signal<'left' | 'right'>('left');

  // Columns visibility state management (replicates AG Grid Enterprise Columns Panel for Community Grid)
  columnVisibility = signal<Record<string, boolean>>({
    id: true,
    name: true,
    role: true,
    department: true,
    salary: true,
    joinedDate: true,
    status: true
  });

  // Metadata for Left Side Config Panel list representation (Employee Directory Columns)
  allColumnsList = [
    { key: 'id', label: 'ID', icon: 'fingerprint' },
    { key: 'name', label: 'Name', icon: 'person' },
    { key: 'role', label: 'Role', icon: 'work' },
    { key: 'department', label: 'Department', icon: 'business' },
    { key: 'salary', label: 'Salary', icon: 'attach_money' },
    { key: 'joinedDate', label: 'Joined Date', icon: 'calendar_today' },
    { key: 'status', label: 'Status', icon: 'toggle_on' }
  ];

  // Metadata for Left Side Config Panel list representation (Gutenberg Books Columns)
  booksColumnsList = [
    { key: 'id', label: 'Book ID', icon: 'tag' },
    { key: 'title', label: 'Title', icon: 'book' },
    { key: 'authors', label: 'Authors', icon: 'person' },
    { key: 'languages', label: 'Languages', icon: 'translate' },
    { key: 'subjects', label: 'Subjects', icon: 'topic' },
    { key: 'download_count', label: 'Downloads', icon: 'download' }
  ];

  // Dynamic columns config depending on selected story
  activeColumnsList = computed(() => {
    if (this.selectedStory() === 'gutenberg-books') {
      return this.booksColumnsList;
    }
    return this.allColumnsList;
  });

  isFilterStory = computed(() => {
    const story = this.selectedStory();
    return story === 'multi-select' || story === 'regex' || story === 'date-range' || story === 'smart-ai';
  });

  // Gutenberg Books pagination states
  booksPageSize = signal<number>(10);
  booksCurrentLocalPage = signal<number>(1);
  totalBooksAvailable = signal<number>(0);
  booksLoading = signal<boolean>(false);
  booksSearchTerm = signal<string>('sherlock');
  booksHasApiMore = signal<boolean>(true);
  apiNextPageToLoad = 1;

  // Compute pagination info object to pass to ColumnsConfig
  booksPaginationInfo = computed(() => {
    const total = this.totalBooksAvailable();
    const pageSize = this.booksPageSize();
    const pages = total > 0 ? Math.ceil(total / pageSize) : 1;
    const current = this.booksCurrentLocalPage();
    return {
      totalCount: total,
      currentPage: current,
      totalPages: pages,
      loading: this.booksLoading(),
      hasNext: current < pages,
      hasPrev: current > 1,
      pageSize: pageSize
    };
  });

  // Dynamically computed Column definitions reacting to columnVisibility settings
  columnDefs = computed<ColDef[]>(() => {
    const visibility = this.columnVisibility();
    const story = this.selectedStory();

    if (story === 'gutenberg-books') {
      return [
        { 
          field: 'id', 
          headerName: 'ID', 
          width: 90, 
          minWidth: 80,
          sortable: true, 
          hide: !visibility['id'],
          cellRenderer: (params: { value: number }) => `<span class="font-mono font-semibold" style="color: var(--app-grid-id-color);">#${params.value}</span>`
        },
        { 
          field: 'title', 
          headerName: 'Title', 
          flex: 2, 
          minWidth: 220,
          sortable: true, 
          filter: 'agTextColumnFilter',
          hide: !visibility['title'],
          cellRenderer: (params: { value: string }) => `<span class="font-medium text-wrap" style="color: var(--app-grid-title-color);">${params.value}</span>`
        },
        { 
          field: 'authors', 
          headerName: 'Authors', 
          flex: 1.5, 
          minWidth: 160,
          sortable: true, 
          filter: 'agTextColumnFilter',
          hide: !visibility['authors'],
          valueGetter: (params: { data: GutendexBook | undefined }) => {
            if (!params.data || !params.data.authors) return '';
            return params.data.authors.map((a) => a.name).join(', ');
          }
        },
        { 
          field: 'languages', 
          headerName: 'Languages', 
          width: 120, 
          minWidth: 100,
          sortable: true, 
          hide: !visibility['languages'],
          valueGetter: (params: { data: GutendexBook | undefined }) => params.data?.languages ? params.data.languages.join(', ').toUpperCase() : ''
        },
        { 
          field: 'subjects', 
          headerName: 'Subjects', 
          flex: 2, 
          minWidth: 200,
          sortable: true, 
          hide: !visibility['subjects'],
          valueGetter: (params: { data: GutendexBook | undefined }) => params.data?.subjects ? params.data.subjects.slice(0, 3).join(', ') : ''
        },
        { 
          field: 'download_count', 
          headerName: 'Downloads', 
          width: 140, 
          minWidth: 120,
          sortable: true, 
          hide: !visibility['download_count'],
          cellRenderer: (params: { value: number }) => {
            const count = params.value ? params.value.toLocaleString() : '0';
            return `<div class="flex items-center justify-between w-full pr-2">
              <span class="font-mono text-xs" style="color: var(--app-grid-download-btn-color);">${count}</span>
              <button 
                type="button" 
                class="p-1 rounded transition-all flex items-center justify-center cursor-pointer border"
                style="background-color: var(--app-grid-download-btn-bg); color: var(--app-grid-download-btn-color); border-color: var(--app-grid-download-btn-border);"
                title="Download Title TXT"
                onmouseover="this.style.backgroundColor='var(--app-grid-download-btn-hover)'"
                onmouseout="this.style.backgroundColor='var(--app-grid-download-btn-bg)'"
              >
                <span class="material-icons" style="font-size: 11px; display: block; line-height: 1;">file_download</span>
              </button>
            </div>`;
          }
        }
      ];
    }

    return [
      { field: 'id', headerName: 'ID', width: 100, minWidth: 80, sortable: true, hide: !visibility['id'] },
      { 
        field: 'name', 
        headerName: 'Name', 
        filter: RegexFilterComponent, 
        filterParams: { buttons: ['clear', 'apply'] },
        flex: 1, 
        minWidth: 160,
        sortable: true,
        hide: !visibility['name']
      },
      { 
        field: 'role', 
        headerName: 'Role', 
        filter: SmartAIFilterComponent, 
        flex: 1, 
        minWidth: 160,
        sortable: true,
        hide: !visibility['role']
      },
      { 
        field: 'department', 
        headerName: 'Department', 
        filter: MultiSelectFilterComponent, 
        width: 140, 
        minWidth: 130,
        sortable: true,
        hide: !visibility['department']
      },
      { 
        field: 'salary', 
        headerName: 'Salary ($)', 
        width: 120, 
        minWidth: 110,
        valueFormatter: params => params.value ? params.value.toLocaleString() : '',
        filter: 'agNumberColumnFilter', 
        sortable: true,
        hide: !visibility['salary']
      },
      { 
        field: 'joinedDate', 
        headerName: 'Joined Date', 
        filter: AdvancedDateRangeFilterComponent, 
        width: 150, 
        minWidth: 140,
        sortable: true,
        hide: !visibility['joinedDate']
      },
      { 
        field: 'status', 
        headerName: 'Status', 
        filter: MultiSelectFilterComponent, 
        width: 120, 
        minWidth: 110,
        sortable: true,
        hide: !visibility['status']
      }
    ];
  });

  // Grid default options
  defaultColDef: ColDef = {
    resizable: true,
    filter: true,
    floatingFilter: false, // Turn off empty floating filters and use our beautiful, permanent header magnifying glass icons
    suppressHeaderMenuButton: false, // Ensure column header menu buttons are displayed
  };

  // Custom icons configuration to show a clean magnifying glass icon in column headers as requested
  gridIcons = {
    menu: '<span class="material-icons" style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--app-accent-color);">search</span>',
    filter: '<span class="material-icons" style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--app-accent-color);">search</span>'
  };

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  // Story Metadata for clean documentation headers
  activeStoryMeta = computed(() => {
    const story = this.selectedStory();
    switch (story) {
      case 'multi-select':
        return {
          title: 'Multi-Select Checkbox Filter',
          selector: 'lib-multi-select-filter',
          desc: 'Implements a fully interactive checkbox set filter mimicking AG Grid Enterprise. Scans grid content dynamically, sorts unique values, supports live incremental search, and features clean toggling shortcuts.',
          missingFeature: 'AG Grid Community lacks a "Set Filter" or search-enabled multi-checkbox dropdown out of the box (requires Enterprise license). This component fully replicates that vital business user experience.'
        };
      case 'regex':
        return {
          title: 'Regex Match Filter',
          selector: 'lib-regex-filter',
          desc: 'Allows technical users and developers to filter rows using JavaScript Regular Expressions. Features instant syntax validation, a dynamic regex slash wrapper representation, case-sensitivity switch, and helper cheat sheet.',
          missingFeature: 'Standard AG Grid text filters support basic matching (Contains, StartsWith, EndsWith). They do not support pattern validation, multiple OR operators, or advanced character matching rules provided by regex.'
        };
      case 'date-range':
        return {
          title: 'Advanced Date Range Filter',
          selector: 'lib-date-range-filter',
          desc: 'An exquisite date filter offering both calendar boundary inputs (Start/End Date) and instant relative ranges like Yesterday, Last 7 Days, Last 30 Days, and Current Month.',
          missingFeature: 'AG Grid Community native date filter is strictly mechanical, requiring users to explicitly choose operators like "Equals", "LessThan", "GreaterThan". Relative ranges or quick intervals require custom logic.'
        };
      case 'smart-ai':
        return {
          title: 'Gemini Smart AI Filter',
          selector: 'lib-smart-ai-filter',
          desc: 'A revolutionary semantic filter powered by Gemini 3.5 Flash. Allows natural language query inputs (e.g., "Engineering department earning more than 90k"), evaluates column records semantically, and matches synonyms in real time.',
          missingFeature: 'Standard search indexes look for exact substrings. They cannot deduce semantic synonyms ("dev" for "software engineer"), resolve complex boolean sentences, or compare mathematical limits expressed in conversational English.'
        };
      case 'gutenberg-books':
        return {
          title: 'Asynchronous Gutenberg Catalog',
          selector: 'lib-gutenberg-books',
          desc: 'Loads thousands of classical books asynchronously in real time from the Project Gutenberg Catalog API (https://gutendex.com/books/). Showcases server-side style async querying and pagination within AG Grid Community.',
          missingFeature: 'AG Grid Community has no out-of-the-box support for dedicated, side-panel-integrated pagination stats. This demo features pagination controls housed directly in the Sidebar Columns Panel itself, interacting reactively with dynamic async API endpoints.'
        };
      case 'columns-config':
        return {
          title: 'Reactive Columns Visibility Panel',
          selector: 'app-columns-config',
          desc: 'Replicates the column chooser side bar from AG Grid Enterprise. Houses dynamic toggle switches, quick layout presets (Show All, Minimal), and integrates seamlessly with any standard list of columns.',
          missingFeature: 'AG Grid Community has no columns visibility list or side panel (requires Enterprise license). This component provides a fully functional, style-adaptable alternative.'
        };
      case 'pagination':
        return {
          title: 'Decoupled Pagination Controller',
          selector: 'app-pagination',
          desc: 'A reusable pagination toolbar supporting dual layouts ("footer" for main tables, "compact" for sidebars/panels). Provides full page size selections, active state loaders, and precise page statistics.',
          missingFeature: 'AG Grid Community only supports standard bottom-bar pagination. Decoupling the pagination control allows placing it anywhere in the page hierarchy (e.g. inside side panels or custom headers).'
        };
      default:
        return null;
    }
  });

  // Source code resolver for display
  activeSourceCode = computed(() => {
    const story = this.selectedStory();
    switch (story) {
      case 'multi-select': return MULTI_SELECT_SOURCE;
      case 'regex': return REGEX_SOURCE;
      case 'date-range': return DATE_RANGE_SOURCE;
      case 'smart-ai': return SMART_AI_SOURCE;
      case 'columns-config': return COLUMNS_CONFIG_SOURCE;
      case 'pagination': return PAGINATION_SOURCE;
      case 'gutenberg-books': return GUTENBERG_BOOKS_SOURCE;
      default: return '';
    }
  });

  // Integration code templates (How to Import & Use)
  activeUsageCode = computed(() => {
    const story = this.selectedStory();
    switch (story) {
      case 'multi-select':
        return `import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { MultiSelectFilterComponent } from 'grillelib';

@Component({
  selector: 'app-grid-view',
  imports: [AgGridAngular],
  template: \`
    <ag-grid-angular
      [rowData]="employees"
      [columnDefs]="colDefs"
      class="ag-theme-quartz"
      style="height: 500px; width: 100%;">
    </ag-grid-angular>
  \`
})
export class GridViewComponent {
  employees = [ /* row data */ ];

  colDefs: ColDef[] = [
    { field: 'name', sortable: true },
    { 
      field: 'department', 
      // Integrate custom filter component seamlessly
      filter: MultiSelectFilterComponent 
    }
  ];
}`;
      case 'regex':
        return `import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { RegexFilterComponent } from 'grillelib';

@Component({
  selector: 'app-grid-view',
  imports: [AgGridAngular],
  template: \`
    <ag-grid-angular
      [rowData]="employees"
      [columnDefs]="colDefs"
      class="ag-theme-quartz">
    </ag-grid-angular>
  \`
})
export class GridViewComponent {
  colDefs: ColDef[] = [
    { 
      field: 'name', 
      filter: RegexFilterComponent,
      filterParams: {
        // Optional custom options
        caseSensitiveDefault: false
      }
    }
  ];
}`;
      case 'date-range':
        return `import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AdvancedDateRangeFilterComponent } from 'grillelib';

@Component({
  selector: 'app-grid-view',
  imports: [AgGridAngular],
  template: \`
    <ag-grid-angular [rowData]="employees" [columnDefs]="colDefs"></ag-grid-angular>
  \`
})
export class GridViewComponent {
  colDefs: ColDef[] = [
    { 
      field: 'joinedDate', 
      filter: AdvancedDateRangeFilterComponent 
    }
  ];
}`;
      case 'smart-ai':
        return `import { Component } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { SmartAIFilterComponent } from 'grillelib';

@Component({
  selector: 'app-grid-view',
  imports: [AgGridAngular],
  template: \`
    <!-- Add standard HttpClient provider in app.config.ts first -->
    <ag-grid-angular [rowData]="employees" [columnDefs]="colDefs"></ag-grid-angular>
  \`
})
export class GridViewComponent {
  colDefs: ColDef[] = [
    { 
      field: 'name',
      // The Smart AI filter can be registered on any column or 
      // used as a custom external grid filter
      filter: SmartAIFilterComponent 
    }
  ];
}`;
      case 'gutenberg-books':
        return GUTENBERG_BOOKS_USAGE_SOURCE;
      case 'columns-config':
        return `import { Component, signal } from '@angular/core';
import { ColumnsConfig } from './components/columns-config/columns-config';

@Component({
  selector: 'app-root',
  imports: [ColumnsConfig],
  template: \`
    <div class="app-container">
      <app-columns-config
        [(visibility)]="columnVisibility"
        [columns]="allColumns"
        [(position)]="panelPosition"
      />
    </div>
  \`
})
export class AppComponent {
  panelPosition = signal<'left' | 'right'>('left');
  
  columnVisibility = signal<Record<string, boolean>>({
    id: true,
    name: true,
    role: true,
    department: true
  });

  allColumns = [
    { key: 'id', label: 'ID', icon: 'fingerprint' },
    { key: 'name', label: 'Name', icon: 'person' },
    { key: 'role', label: 'Role', icon: 'work' },
    { key: 'department', label: 'Department', icon: 'business' }
  ];
}`;
      case 'pagination':
        return `import { Component, signal } from '@angular/core';
import { Pagination } from './components/pagination/pagination';

@Component({
  selector: 'app-root',
  imports: [Pagination],
  template: \`
    <div class="app-container">
      <app-pagination
        layout="footer"
        [totalCount]="totalItems()"
        [(currentPage)]="currentPage"
        [(pageSize)]="pageSize"
        [loading]="isLoading()"
        (pageChanged)="onPageChange($event)"
      />
    </div>
  \`
})
export class AppComponent {
  totalItems = signal<number>(250);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  isLoading = signal<boolean>(false);

  onPageChange(page: number) {
    console.log('Navigated to page:', page);
    // Trigger your HTTP API request here...
  }
}`;
      default:
        return '';
    }
  });

  // Action methods
  selectStory(story: string): void {
    this.selectedStory.set(story);
    this.selectedCodeTab.set('usage');
    this.copiedState.set(false);

    if (story === 'gutenberg-books') {
      // Initialize columns visibility map for books
      this.columnVisibility.set({
        id: true,
        title: true,
        authors: true,
        languages: true,
        subjects: true,
        download_count: true
      });
      // Reset search to default and trigger books fetching
      this.booksSearchTerm.set('sherlock');
      this.loadBooks(true);
    } else {
      // Restore employee visibility
      this.columnVisibility.set({
        id: true,
        name: true,
        role: true,
        department: true,
        salary: true,
        joinedDate: true,
        status: true
      });
    }
  }

  copyCodeToClipboard(): void {
    const code = this.selectedCodeTab() === 'usage' ? this.activeUsageCode() : this.activeSourceCode();
    navigator.clipboard.writeText(code).then(() => {
      this.copiedState.set(true);
      if (this.copyTimeout) clearTimeout(this.copyTimeout);
      this.copyTimeout = setTimeout(() => {
        this.copiedState.set(false);
      }, 2000);
    });
  }

  // Clear all filters applied across all columns in grid
  resetAllGridFilters(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel(null);
      this.gridApi.onFilterChanged();
    }
  }

  // Quick preset filter applicator for demonstration
  applyDemoFilter(field: string, filterModel: unknown): void {
    if (this.gridApi) {
      const currentModel = this.gridApi.getFilterModel() || {};
      currentModel[field] = filterModel;
      this.gridApi.setFilterModel(currentModel);
      this.gridApi.onFilterChanged();
    }
  }

  // Gutenberg Books API Loader & Controllers
  loadBooks(reset = false): void {
    if (this.booksLoading()) return;

    if (reset) {
      this.allLoadedBooks.set([]);
      this.booksCurrentLocalPage.set(1);
      this.apiNextPageToLoad = 1;
      this.totalBooksAvailable.set(0);
      this.booksHasApiMore.set(true);
    }

    const rawSearch = this.booksSearchTerm().trim();
    let search = rawSearch;
    let languagesParam = '';

    // Regex to match language=XX or lang=XX or languages=XX (case-insensitive)
    const langRegex = /\b(?:languages?|lang)\s*=\s*([a-zA-Z,]+)\b/i;
    const match = search.match(langRegex);
    if (match) {
      const langCode = match[1].toLowerCase();
      languagesParam = `&languages=${encodeURIComponent(langCode)}`;
      // Remove the matched language filter from the search term
      search = search.replace(langRegex, '').replace(/\s+/g, ' ').trim();
    }

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const pageToLoad = this.apiNextPageToLoad;
    const url = `https://gutendex.com/books/?page=${pageToLoad}${searchParam}${languagesParam}`;

    this.booksLoading.set(true);
    this.http.get<{ count?: number; next?: string | null; previous?: string | null; results?: GutendexBook[] }>(url).subscribe({
      next: (response) => {
        if (response && response.results) {
          const currentBooks = this.allLoadedBooks();
          const combined = [...currentBooks, ...response.results];
          this.allLoadedBooks.set(combined);
          this.totalBooksAvailable.set(response.count || 0);

          if (response.next) {
            this.apiNextPageToLoad = pageToLoad + 1;
            this.booksHasApiMore.set(true);
          } else {
            this.booksHasApiMore.set(false);
          }
        } else {
          this.booksHasApiMore.set(false);
        }
        this.booksLoading.set(false);

        // Auto-fill check: if we do not have enough books for the current page view,
        // and the API has more pages, load the next page automatically.
        const requiredCount = this.booksCurrentLocalPage() * this.booksPageSize();
        if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore() && this.allLoadedBooks().length < this.totalBooksAvailable()) {
          this.loadBooks(false);
        }
      },
      error: (err) => {
        console.error('Error fetching Gutenberg Books:', err);
        this.booksLoading.set(false);
      }
    });
  }

  onBooksPageChange(direction: 'next' | 'prev' | 'first'): void {
    let targetPage = this.booksCurrentLocalPage();
    const info = this.booksPaginationInfo();
    if (direction === 'first') {
      targetPage = 1;
    } else if (direction === 'next' && info.hasNext) {
      targetPage += 1;
    } else if (direction === 'prev' && info.hasPrev) {
      targetPage -= 1;
    }

    if (targetPage !== this.booksCurrentLocalPage()) {
      this.booksCurrentLocalPage.set(targetPage);
      // If we need to load more books from API to fill this page, fetch them
      const requiredCount = targetPage * this.booksPageSize();
      if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore() && this.allLoadedBooks().length < this.totalBooksAvailable()) {
        this.loadBooks(false);
      }
    }
  }

  onBooksPageChangeFromComponent(newPage: number): void {
    // If we need to load more books from API to fill this page, fetch them
    const requiredCount = newPage * this.booksPageSize();
    if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore() && this.allLoadedBooks().length < this.totalBooksAvailable()) {
      this.loadBooks(false);
    }
  }

  onBooksPageSizeChange(newSize: number): void {
    this.booksPageSize.set(newSize);
    this.booksCurrentLocalPage.set(1); // Reset to page 1 on page size change

    // If we don't have enough books for the first page of this new size, load more
    const requiredCount = newSize;
    if (this.allLoadedBooks().length < requiredCount && this.booksHasApiMore() && this.allLoadedBooks().length < this.totalBooksAvailable()) {
      this.loadBooks(false);
    }
  }

  onBooksSearch(term: string): void {
    this.booksSearchTerm.set(term);
    this.loadBooks(true);
  }

  onCellClicked(event: { column: { getColId: () => string }; data: unknown }): void {
    if (this.selectedStory() === 'gutenberg-books' && event.column && event.column.getColId() === 'download_count') {
      const book = event.data as GutendexBook;
      if (book) {
        this.downloadBookTitleFile(book);
      }
    }
  }

  downloadBookTitleFile(book: GutendexBook): void {
    if (!book || !book.title) return;
    const text = `====================================================
GUTENBERG BOOK INFORMATION
====================================================
Title      : ${book.title}
Authors    : ${book.authors && book.authors.length ? book.authors.map(a => `${a.name} (${a.birth_year || 'N/A'} - ${a.death_year || 'N/A'})`).join(', ') : 'Unknown'}
Book ID    : ${book.id}
Languages  : ${book.languages ? book.languages.join(', ').toUpperCase() : 'N/A'}
Downloads  : ${book.download_count ? book.download_count.toLocaleString() : '0'}
Subjects   :
${book.subjects && book.subjects.length ? book.subjects.map(s => `- ${s}`).join('\n') : 'None'}
====================================================
Downloaded via Live AG Grid Community Playground.
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `book_${book.id}_${safeTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
