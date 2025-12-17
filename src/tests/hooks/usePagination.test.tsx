/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should initialize with first page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentData).toHaveLength(10);
    expect(result.current.currentData[0].id).toBe(1);
  });

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentData[0].id).toBe(11);
  });

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(2);
    });

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.currentData[0].id).toBe(1);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.currentData).toHaveLength(5); // Last page has 5 items
    expect(result.current.currentData[0].id).toBe(21);
  });

  it('should not go beyond last page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(3);
    });

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(3); // Should stay at last page
  });

  it('should not go before first page', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.previousPage();
    });

    expect(result.current.currentPage).toBe(1); // Should stay at first page
  });

  it('should correctly calculate hasNextPage and hasPreviousPage', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(false);

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => usePagination({ data: [], itemsPerPage: 10 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.currentData).toHaveLength(0);
  });

  it('should handle custom itemsPerPage', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 5 }));

    expect(result.current.totalPages).toBe(5);
    expect(result.current.currentData).toHaveLength(5);
  });

  it('should clamp page number to valid range', () => {
    const { result } = renderHook(() => usePagination({ data: mockData, itemsPerPage: 10 }));

    act(() => {
      result.current.goToPage(100);
    });

    expect(result.current.currentPage).toBe(3); // Should go to last page

    act(() => {
      result.current.goToPage(-5);
    });

    expect(result.current.currentPage).toBe(1); // Should go to first page
  });
});
