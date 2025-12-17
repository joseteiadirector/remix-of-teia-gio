/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    expect(result.current).toBe('first');

    // Update value
    rerender({ value: 'second' });
    
    // Value should not change immediately
    expect(result.current).toBe('first');

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should now be updated
    expect(result.current).toBe('second');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ value: 'third' });
    
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should still be 'first' because timer was reset
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now it should be 'third'
    expect(result.current).toBe('third');
  });

  it('should work with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1000),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('second');
  });

  it('should handle different value types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 42 } }
    );

    expect(result.current).toBe(42);

    rerender({ value: 100 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(100);
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { unmount } = renderHook(() => useDebounce('value', 500));
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
