/**
 * Performance Module
 * Central export point for all performance monitoring utilities
 */

export {
  performanceMonitor,
  measureFirebaseLatency,
  measureContractDuration,
  measureRender,
} from './monitor';

export type {
  PerformanceMetric,
  PerformanceStats,
  MetricHistory,
} from './monitor';
