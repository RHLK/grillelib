/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegexFilterComponent } from './regex-filter';
import { IFilterParams } from 'ag-grid-community';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('RegexFilterComponent', () => {
  let component: RegexFilterComponent;
  let fixture: ComponentFixture<RegexFilterComponent>;
  let mockParams: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegexFilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RegexFilterComponent);
    component = fixture.componentInstance;

    // Build the mock AG Grid filter params object using vitest vi.fn() for spies
    mockParams = {
      getValue: vi.fn((node: any) => node.dataValue),
      filterChangedCallback: vi.fn()
    };

    component.agInit(mockParams as IFilterParams);
    fixture.detectChanges();
  });

  it('should create the regex filter component', () => {
    expect(component).toBeTruthy();
  });

  it('should evaluate valid and invalid regex patterns correctly', () => {
    // Empty pattern should be computed as valid (no filter active)
    component.pattern.set('');
    expect(component.isValidPattern()).toBe(true);

    // A valid regular expression
    component.pattern.set('^id-[0-9]{3}$');
    expect(component.isValidPattern()).toBe(true);

    // An invalid regular expression (unmatched brackets)
    component.pattern.set('[0-9+');
    expect(component.isValidPattern()).toBe(false);
  });

  it('should determine filter active state accurately', () => {
    // No pattern means inactive
    expect(component.isFilterActive()).toBe(false);

    // Valid non-empty pattern means active
    component.pattern.set('active-regex');
    expect(component.isFilterActive()).toBe(true);

    // Invalid non-empty pattern should be classified as inactive to avoid regex compilation crashes
    component.pattern.set('invalid-([regex');
    expect(component.isFilterActive()).toBe(false);
  });

  it('should filter matching values successfully (case-insensitive by default)', () => {
    component.pattern.set('^test');
    fixture.detectChanges();

    const passingNode = { dataValue: 'testing angular' };
    const failingNode = { dataValue: 'hello test' };
    const upperCaseNode = { dataValue: 'TESTING ANGULAR' };

    expect(component.doesFilterPass({ node: passingNode } as any)).toBe(true);
    expect(component.doesFilterPass({ node: failingNode } as any)).toBe(false);
    expect(component.doesFilterPass({ node: upperCaseNode } as any)).toBe(true); // case-insensitive default
  });

  it('should respect case-sensitivity flag when enabled', () => {
    component.pattern.set('^TEST');
    component.caseSensitive.set(true);
    fixture.detectChanges();

    const matchingNode = { dataValue: 'TESTING ANGULAR' };
    const misMatchingNode = { dataValue: 'testing angular' };

    expect(component.doesFilterPass({ node: matchingNode } as any)).toBe(true);
    expect(component.doesFilterPass({ node: misMatchingNode } as any)).toBe(false); // fails because of case-sensitivity
  });

  it('should correctly support AG Grid getModel and setModel protocols', () => {
    // 1. Inactive filter returns null
    expect(component.getModel()).toBeNull();

    // 2. Set active filter model
    component.setModel({ pattern: 'some-pattern', caseSensitive: true });
    expect(component.pattern()).toBe('some-pattern');
    expect(component.caseSensitive()).toBe(true);
    expect(mockParams.filterChangedCallback).toHaveBeenCalled();

    // 3. Get active filter model
    const model = component.getModel();
    expect(model).toEqual({ pattern: 'some-pattern', caseSensitive: true });

    // 4. Set null model (clears filter)
    component.setModel(null);
    expect(component.pattern()).toBe('');
    expect(component.caseSensitive()).toBe(false);
    expect(component.getModel()).toBeNull();
  });

  it('should respond to user interaction helpers', () => {
    // Test onPatternChange
    component.onPatternChange('quick-input');
    expect(component.pattern()).toBe('quick-input');
    expect(mockParams.filterChangedCallback).toHaveBeenCalled();

    // Test toggleCaseSensitivity
    component.toggleCaseSensitivity();
    expect(component.caseSensitive()).toBe(true);

    component.toggleCaseSensitivity();
    expect(component.caseSensitive()).toBe(false);

    // Test clearFilter
    component.clearFilter();
    expect(component.pattern()).toBe('');
    expect(mockParams.filterChangedCallback).toHaveBeenCalled();
  });
});
