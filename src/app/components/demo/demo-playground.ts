import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';

// Import our library filters from the refactored directory
import { MultiSelectFilterComponent } from '../filter/multi-select-filter/multi-select-filter';
import { RegexFilterComponent } from '../filter/regex-filter/regex-filter';
import { AdvancedDateRangeFilterComponent } from '../filter/date-range-filter/date-range-filter';
import { SmartAIFilterComponent } from '../filter/smart-ai-filter/smart-ai-filter';

// Import the extracted mock data and source constants
import { Employee, EMPLOYEES_DATA } from './demo-data';
import {
  MULTI_SELECT_SOURCE,
  REGEX_SOURCE,
  DATE_RANGE_SOURCE,
  SMART_AI_SOURCE
} from './source-code-constants';

@Component({
  selector: 'app-demo-playground',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AgGridAngular,
    MultiSelectFilterComponent,
    RegexFilterComponent,
    AdvancedDateRangeFilterComponent,
    SmartAIFilterComponent
  ],
  templateUrl: './demo-playground.html',
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }
  `]
})
export class DemoPlaygroundComponent {
  // Storybook state management
  selectedStory = signal<string>('overview'); // 'overview', 'gpl-license', 'multi-select', 'regex', 'date-range', 'smart-ai'
  selectedCodeTab = signal<'usage' | 'source'>('usage');
  copiedState = signal<boolean>(false);
  copyTimeout: ReturnType<typeof setTimeout> | null = null;

  // AG Grid APIs
  gridApi!: GridApi;

  // Mock employee database loaded from demo-data
  rowData = signal<Employee[]>(EMPLOYEES_DATA);

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

  // Metadata for Left Side Config Panel list representation
  allColumnsList = [
    { key: 'id', label: 'ID', icon: 'fingerprint' },
    { key: 'name', label: 'Name', icon: 'person' },
    { key: 'role', label: 'Role', icon: 'work' },
    { key: 'department', label: 'Department', icon: 'business' },
    { key: 'salary', label: 'Salary', icon: 'attach_money' },
    { key: 'joinedDate', label: 'Joined Date', icon: 'calendar_today' },
    { key: 'status', label: 'Status', icon: 'toggle_on' }
  ];

  // Dynamically computed Column definitions reacting to columnVisibility settings
  columnDefs = computed<ColDef[]>(() => {
    const visibility = this.columnVisibility();
    return [
      { field: 'id', headerName: 'ID', width: 100, sortable: true, hide: !visibility['id'] },
      { 
        field: 'name', 
        headerName: 'Name', 
        filter: RegexFilterComponent, 
        filterParams: { buttons: ['clear', 'apply'] },
        flex: 1, 
        sortable: true,
        hide: !visibility['name']
      },
      { 
        field: 'role', 
        headerName: 'Role', 
        filter: SmartAIFilterComponent, 
        flex: 1, 
        sortable: true,
        hide: !visibility['role']
      },
      { 
        field: 'department', 
        headerName: 'Department', 
        filter: MultiSelectFilterComponent, 
        width: 140, 
        sortable: true,
        hide: !visibility['department']
      },
      { 
        field: 'salary', 
        headerName: 'Salary ($)', 
        width: 120, 
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
        sortable: true,
        hide: !visibility['joinedDate']
      },
      { 
        field: 'status', 
        headerName: 'Status', 
        filter: MultiSelectFilterComponent, 
        width: 120, 
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
    menu: '<span class="material-icons text-emerald-400" style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">search</span>',
    filter: '<span class="material-icons text-emerald-400" style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">search</span>'
  };

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  // Toggles the visibility of a column by key
  toggleColumn(key: string): void {
    this.columnVisibility.update(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      // Safety rule: Keep at least one column visible to prevent empty grid rendering bugs
      const hasVisible = Object.values(updated).some(val => val === true);
      return hasVisible ? updated : prev;
    });
  }

  // Quick visibility presets
  showAllColumns(): void {
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

  hideAllColumnsExceptName(): void {
    this.columnVisibility.set({
      id: false,
      name: true,
      role: false,
      department: false,
      salary: false,
      joinedDate: false,
      status: false
    });
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
      default:
        return '';
    }
  });

  // Action methods
  selectStory(story: string): void {
    this.selectedStory.set(story);
    this.selectedCodeTab.set('usage');
    this.copiedState.set(false);
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
}
