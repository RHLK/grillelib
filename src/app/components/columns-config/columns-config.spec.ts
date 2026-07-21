import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ColumnsConfig } from './columns-config';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ColumnsConfig', () => {
  let component: ColumnsConfig;
  let fixture: ComponentFixture<ColumnsConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnsConfig]
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnsConfig);
    component = fixture.componentInstance;

    // Set required states using componentRef input APIs
    fixture.componentRef.setInput('visibility', {
      id: true,
      title: true,
      authors: false
    });
    fixture.componentRef.setInput('columns', [
      { key: 'id', label: 'ID', icon: 'tag' },
      { key: 'title', label: 'Title', icon: 'book' },
      { key: 'authors', label: 'Authors', icon: 'person' }
    ]);

    fixture.detectChanges();
  });

  it('should create the columns config component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle column visibility correctly', () => {
    // Toggle 'authors' from false to true
    component.toggleColumn('authors');
    expect(component.visibility()['authors']).toBe(true);

    // Toggle 'id' from true to false
    component.toggleColumn('id');
    expect(component.visibility()['id']).toBe(false);
  });

  it('should prevent hiding the last visible column to avoid rendering a completely empty grid', () => {
    // Start state: id: true, title: true, authors: false
    // Toggle 'id' to false -> remains 'title' as the only visible column
    component.toggleColumn('id');
    fixture.detectChanges();
    expect(component.visibility()['id']).toBe(false);
    expect(component.visibility()['title']).toBe(true);

    // Attempting to toggle 'title' to false should be BLOCKED because it's the last visible column!
    component.toggleColumn('title');
    fixture.detectChanges();
    expect(component.visibility()['title']).toBe(true); // Safe-guarded, remains true!
  });

  it('should make all columns visible when calling showAllColumns', () => {
    component.showAllColumns();
    fixture.detectChanges();
    
    const vis = component.visibility();
    expect(vis['id']).toBe(true);
    expect(vis['title']).toBe(true);
    expect(vis['authors']).toBe(true);
  });

  it('should keep title/name visible and hide others with hideAllColumnsExceptName', () => {
    // Add custom visibility to test
    component.showAllColumns();
    fixture.detectChanges();

    component.hideAllColumnsExceptName();
    fixture.detectChanges();

    const vis = component.visibility();
    expect(vis['title']).toBe(true); // Title should remain visible
    expect(vis['id']).toBe(false);   // Others should be hidden
    expect(vis['authors']).toBe(false);
  });

  it('should emit appropriate navigation directions on compact page changes', () => {
    let emittedDirection: 'next' | 'prev' | 'first' | undefined;
    const sub = component.pageChange.subscribe(d => emittedDirection = d);

    // Initialize paginationInfo input
    fixture.componentRef.setInput('paginationInfo', {
      totalCount: 30,
      currentPage: 2,
      totalPages: 3,
      loading: false,
      hasNext: true,
      hasPrev: true,
      pageSize: 10
    });
    fixture.detectChanges();

    // Case 1: Change to page 1 -> Emits 'first'
    component.onCompactPageChange(1);
    expect(emittedDirection).toBe('first');

    // Case 2: Change to page 3 (higher than current page 2) -> Emits 'next'
    component.onCompactPageChange(3);
    expect(emittedDirection).toBe('next');

    // Case 3: Change to page 1 from current page 3 (lower, but not page 1 exception test) -> Let's set currentPage to 3
    fixture.componentRef.setInput('paginationInfo', {
      totalCount: 30,
      currentPage: 3,
      totalPages: 3,
      loading: false,
      hasNext: false,
      hasPrev: true,
      pageSize: 10
    });
    fixture.detectChanges();
    
    // Change to page 2 -> Emits 'prev'
    component.onCompactPageChange(2);
    expect(emittedDirection).toBe('prev');

    sub.unsubscribe();
  });
});
