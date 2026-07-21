import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Pagination } from './pagination';
import { describe, beforeEach, it, expect } from 'vitest';

describe('Pagination', () => {
  let component: Pagination;
  let fixture: ComponentFixture<Pagination>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagination]
    }).compileComponents();

    fixture = TestBed.createComponent(Pagination);
    component = fixture.componentInstance;
    
    // Initialize required signal inputs and models
    fixture.componentRef.setInput('totalCount', 100);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('pageSize', 10);
    
    fixture.detectChanges();
  });

  it('should create the pagination component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute totalPages correctly based on totalCount and pageSize', () => {
    expect(component.totalPages()).toBe(10);

    // Dynamic update of totalCount
    fixture.componentRef.setInput('totalCount', 105);
    fixture.detectChanges();
    expect(component.totalPages()).toBe(11);

    // Dynamic update of pageSize
    fixture.componentRef.setInput('pageSize', 5);
    fixture.detectChanges();
    expect(component.totalPages()).toBe(21);
  });

  it('should compute hasNext and hasPrev states appropriately', () => {
    // Current page = 1: Should have next, but not previous
    expect(component.hasPrev()).toBe(false);
    expect(component.hasNext()).toBe(true);

    // Current page = 5: Should have both next and previous
    fixture.componentRef.setInput('currentPage', 5);
    fixture.detectChanges();
    expect(component.hasPrev()).toBe(true);
    expect(component.hasNext()).toBe(true);

    // Current page = 10 (Last page): Should have previous, but not next
    fixture.componentRef.setInput('currentPage', 10);
    fixture.detectChanges();
    expect(component.hasPrev()).toBe(true);
    expect(component.hasNext()).toBe(false);
  });

  it('should navigate to different pages with onPageChange', () => {
    const emittedPages: number[] = [];
    const sub = component.pageChanged.subscribe(p => emittedPages.push(p));

    // Next page navigation
    component.onPageChange('next');
    fixture.detectChanges();
    expect(emittedPages).toEqual([2]);
    expect(component.currentPage()).toBe(2);

    // Prev page navigation
    component.onPageChange('prev');
    fixture.detectChanges();
    expect(emittedPages).toEqual([2, 1]);
    expect(component.currentPage()).toBe(1);

    // Clean up subscription
    sub.unsubscribe();
  });

  it('should update page size and automatically reset active page to 1', () => {
    const emittedSizes: number[] = [];
    const sub = component.pageSizeChanged.subscribe(s => emittedSizes.push(s));

    // Set page to 5 first to test the auto-reset
    fixture.componentRef.setInput('currentPage', 5);
    fixture.detectChanges();
    expect(component.currentPage()).toBe(5);

    // Change page size
    component.onPageSizeChange(50);
    fixture.detectChanges();

    expect(emittedSizes).toEqual([50]);
    expect(component.pageSize()).toBe(50);
    expect(component.currentPage()).toBe(1); // Standard reset to page 1 on size change

    sub.unsubscribe();
  });
});
