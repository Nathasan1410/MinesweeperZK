/**
 * Performance Monitor
 * Tracks FPS, Firebase latency, contract call durations, and other metrics
 */

'use client';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "fps" | "bytes" | "count";
  timestamp: number;
}

export interface PerformanceStats {
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };
  firebase: {
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    totalCalls: number;
  };
  contracts: {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    totalCalls: number;
  };
  render: {
    avgRenderTime: number;
    slowRenders: number;
    totalRenders: number;
  };
}

export interface MetricHistory {
  fps: number[];
  firebaseLatency: number[];
  contractDuration: number[];
  renderTimes: number[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isMonitoring = false;
  private fpsFrames: number[] = [];
  private lastFrameTime = performance.now();
  private animationFrameId: number | null = null;
  private history: MetricHistory = {
    fps: [],
    firebaseLatency: [],
    contractDuration: [],
    renderTimes: [],
  };
  private maxHistorySize = 100;
  private renderStartTimes: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      this.startMonitoring();
    }
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.trackFPS();
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private trackFPS() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const delta = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    const fps = 1000 / delta;
    this.fpsFrames.push(fps);

    if (this.fpsFrames.length > 60) {
      this.fpsFrames.shift();
    }

    if (this.fpsFrames.length === 60) {
      const avgFPS = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;
      this.recordMetric("fps", avgFPS, "fps");
      this.history.fps.push(avgFPS);
      if (this.history.fps.length > this.maxHistorySize) {
        this.history.fps.shift();
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.trackFPS());
  }

  recordMetric(name: string, value: number, unit: "ms" | "fps" | "bytes" | "count" = "ms") {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };
    this.metrics.push(metric);

    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  recordFirebaseLatency(operation: string, duration: number) {
    this.recordMetric("firebase_" + operation, duration, "ms");
    this.history.firebaseLatency.push(duration);
    if (this.history.firebaseLatency.length > this.maxHistorySize) {
      this.history.firebaseLatency.shift();
    }
  }

  recordContractDuration(operation: string, duration: number) {
    this.recordMetric("contract_" + operation, duration, "ms");
    this.history.contractDuration.push(duration);
    if (this.history.contractDuration.length > this.maxHistorySize) {
      this.history.contractDuration.shift();
    }
  }

  recordRenderTime(componentName: string, duration: number) {
    this.recordMetric("render_" + componentName, duration, "ms");
    this.history.renderTimes.push(duration);
    if (this.history.renderTimes.length > this.maxHistorySize) {
      this.history.renderTimes.shift();
    }
  }

  startRender(componentName: string) {
    this.renderStartTimes.set(componentName, performance.now());
  }

  endRender(componentName: string) {
    const startTime = this.renderStartTimes.get(componentName);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.recordRenderTime(componentName, duration);
      this.renderStartTimes.delete(componentName);
      return duration;
    }
    return 0;
  }

  getStats(): PerformanceStats {
    const currentFPS = this.fpsFrames.length > 0
      ? this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length
      : 0;

    const fpsHistory = this.history.fps;
    const avgFPS = fpsHistory.length > 0
      ? fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
      : 0;
    const minFPS = fpsHistory.length > 0 ? Math.min(...fpsHistory) : 0;
    const maxFPS = fpsHistory.length > 0 ? Math.max(...fpsHistory) : 0;

    const fbHistory = this.history.firebaseLatency;
    const avgFb = fbHistory.length > 0
      ? fbHistory.reduce((a, b) => a + b, 0) / fbHistory.length
      : 0;
    const minFb = fbHistory.length > 0 ? Math.min(...fbHistory) : 0;
    const maxFb = fbHistory.length > 0 ? Math.max(...fbHistory) : 0;

    const contractHistory = this.history.contractDuration;
    const avgContract = contractHistory.length > 0
      ? contractHistory.reduce((a, b) => a + b, 0) / contractHistory.length
      : 0;
    const minContract = contractHistory.length > 0 ? Math.min(...contractHistory) : 0;
    const maxContract = contractHistory.length > 0 ? Math.max(...contractHistory) : 0;

    const renderHistory = this.history.renderTimes;
    const avgRender = renderHistory.length > 0
      ? renderHistory.reduce((a, b) => a + b, 0) / renderHistory.length
      : 0;
    const slowRenders = renderHistory.filter(t => t > 16).length;

    return {
      fps: {
        current: Math.round(currentFPS),
        average: Math.round(avgFPS),
        min: Math.round(minFPS),
        max: Math.round(maxFPS),
      },
      firebase: {
        avgLatency: Math.round(avgFb),
        minLatency: Math.round(minFb),
        maxLatency: Math.round(maxFb),
        totalCalls: fbHistory.length,
      },
      contracts: {
        avgDuration: Math.round(avgContract),
        minDuration: Math.round(minContract),
        maxDuration: Math.round(maxContract),
        totalCalls: contractHistory.length,
      },
      render: {
        avgRenderTime: Math.round(avgRender * 100) / 100,
        slowRenders,
        totalRenders: renderHistory.length,
      },
    };
  }

  getMetrics(name: string, limit = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit);
  }

  clear() {
    this.metrics = [];
    this.history = {
      fps: [],
      firebaseLatency: [],
      contractDuration: [],
      renderTimes: [],
    };
    this.fpsFrames = [];
  }

  getHistory() {
    return this.history;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export async function measureFirebaseLatency<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordFirebaseLatency(operation, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordFirebaseLatency(operation + "_error", duration);
    throw error;
  }
}

export async function measureContractDuration<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordContractDuration(operation, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordContractDuration(operation + "_error", duration);
    throw error;
  }
}

export function measureRender(componentName: string, renderFn: () => void) {
  const start = performance.now();
  renderFn();
  const duration = performance.now() - start;
  performanceMonitor.recordRenderTime(componentName, duration);
  return duration;
}
