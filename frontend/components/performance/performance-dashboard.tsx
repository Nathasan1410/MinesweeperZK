/**
 * Performance Dashboard Component
 * Dev-only component to display performance metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor, type PerformanceStats } from '@/lib/performance/monitor';

interface PerformanceDashboardProps {
  enabled?: boolean;
}

export function PerformanceDashboard({ enabled = process.env.NODE_ENV === 'development' }: PerformanceDashboardProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Update stats every second
    const interval = setInterval(() => {
      setStats(performanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Keyboard shortcut to toggle (Ctrl+Shift+P)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(v => !v);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  if (!enabled || !isVisible || !stats) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-xl z-50 font-mono text-xs max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold">Performance Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="space-y-3">
        {/* FPS Section */}
        <MetricSection
          title="FPS"
          color={getFpsColor(stats.fps.current)}
          metrics={[
            { label: 'Current', value: stats.fps.current.toString() },
            { label: 'Average', value: stats.fps.average.toString() },
            { label: 'Min', value: stats.fps.min.toString() },
            { label: 'Max', value: stats.fps.max.toString() },
          ]}
        />

        {/* Firebase Section */}
        <MetricSection
          title="Firebase Latency"
          color="blue"
          metrics={[
            { label: 'Average', value: stats.firebase.avgLatency + 'ms' },
            { label: 'Min', value: stats.firebase.minLatency + 'ms' },
            { label: 'Max', value: stats.firebase.maxLatency + 'ms' },
            { label: 'Calls', value: stats.firebase.totalCalls.toString() },
          ]}
        />

        {/* Contracts Section */}
        <MetricSection
          title="Contract Calls"
          color="purple"
          metrics={[
            { label: 'Average', value: stats.contracts.avgDuration + 'ms' },
            { label: 'Min', value: stats.contracts.minDuration + 'ms' },
            { label: 'Max', value: stats.contracts.maxDuration + 'ms' },
            { label: 'Calls', value: stats.contracts.totalCalls.toString() },
          ]}
        />

        {/* Render Section */}
        <MetricSection
          title="Render Performance"
          color="orange"
          metrics={[
            { label: 'Average', value: stats.render.avgRenderTime + 'ms' },
            { label: 'Slow Renders', value: stats.render.slowRenders.toString() },
            { label: 'Total Renders', value: stats.render.totalRenders.toString() },
          ]}
        />

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={() => performanceMonitor.clear()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            Clear Stats
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            Hide (Ctrl+Shift+P)
          </button>
        </div>
      </div>
    </div>
  );
}

interface MetricSectionProps {
  title: string;
  color: string;
  metrics: Array<{ label: string; value: string }>;
}

function MetricSection({ title, color, metrics }: MetricSectionProps) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  };

  const colorClass = colorClasses[color] || 'text-gray-400';

  return (
    <div>
      <h4 className={"font-semibold " + colorClass + " mb-1"}>{title}</h4>
      <div className="grid grid-cols-2 gap-1">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex justify-between">
            <span className="text-gray-400">{metric.label}:</span>
            <span className="font-semibold">{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getFpsColor(fps: number): string {
  if (fps >= 55) return 'green';
  if (fps >= 30) return 'yellow';
  return 'red';
}
