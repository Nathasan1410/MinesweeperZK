/**
 * Performance Hooks
 * Custom hooks for tracking performance metrics
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '@/lib/performance/monitor';

/**
 * Hook to track component render performance
 */
export function useRenderTracking(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderCount = useRef(0);
  const isMounting = useRef(true);

  useEffect(() => {
    if (!enabled) return;

    if (isMounting.current) {
      isMounting.current = false;
      return;
    }

    renderCount.current += 1;
    performanceMonitor.recordRenderTime(componentName, 0); // Track render count
  }, [componentName, enabled]);

  return renderCount.current;
}

/**
 * Hook to measure async operation duration
 */
export function useAsyncMeasure() {
  const measure = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>,
    type: 'firebase' | 'contract' = 'firebase'
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;

      if (type === 'firebase') {
        performanceMonitor.recordFirebaseLatency(operation, duration);
      } else {
        performanceMonitor.recordContractDuration(operation, duration);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      if (type === 'firebase') {
        performanceMonitor.recordFirebaseLatency(operation + '_error', duration);
      } else {
        performanceMonitor.recordContractDuration(operation + '_error', duration);
      }

      throw error;
    }
  }, []);

  return measure;
}

/**
 * Hook to track FPS during gameplay
 */
export function useFPSTracking(enabled = process.env.NODE_ENV === 'development') {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const stats = performanceMonitor.getStats();
      setFps(stats.fps.current);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  return fps;
}

import { useState } from 'react';

/**
 * Hook to track component render time
 */
export function useRenderTimer(componentName: string, enabled = process.env.NODE_ENV === 'development') {
  const renderTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      renderTime.current = duration;

      if (duration > 16) {
        // Log slow renders (> 1 frame at 60fps)
        console.warn(`[Performance] Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName, enabled]);

  return renderTime.current;
}

/**
 * Hook to measure function execution time
 */
export function usePerformanceMeasure() {
  const measure = useCallback(<T, Args extends unknown[]>(
    name: string,
    fn: (...args: Args) => T
  ): ((...args: Args) => T) => {
    return (...args: Args): T => {
      const start = performance.now();
      try {
        const result = fn(...args);
        const duration = performance.now() - start;

        performanceMonitor.recordMetric('fn_' + name, duration, 'ms');

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        performanceMonitor.recordMetric('fn_' + name + '_error', duration, 'ms');
        throw error;
      }
    };
  }, []);

  return measure;
}
