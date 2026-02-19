# Performance Monitoring

This module provides comprehensive performance monitoring for the Minesweeper ZK game frontend.

## Features

- **FPS Tracking**: Real-time frame rate monitoring during gameplay
- **Firebase Latency**: Track Firebase database operation durations
- **Contract Call Monitoring**: Measure Stellar smart contract interaction times
- **Render Performance**: Detect slow component renders (>16ms)

## Usage

### Basic Monitoring

The performance monitor starts automatically in client-side mode:

```typescript
import { performanceMonitor } from '@/lib/performance';

// Get current statistics
const stats = performanceMonitor.getStats();
console.log('FPS:', stats.fps.current);
console.log('Firebase Latency:', stats.firebase.avgLatency);
```

### Measuring Firebase Operations

```typescript
import { measureFirebaseLatency } from '@/lib/performance';

const result = await measureFirebaseLatency('commit_seed', async () => {
  return await update(sessionRef, { seed });
});
```

### Measuring Contract Calls

```typescript
import { measureContractDuration } from '@/lib/performance';

const result = await measureContractDuration('start_game', async () => {
  return await contractInteractions.startGame(params);
});
```

### Using Performance Hooks

```typescript
import { useRenderTracking, useAsyncMeasure } from '@/hooks/performance';

function MyComponent() {
  // Track render count
  useRenderTracking('MyComponent');

  // Measure async operations
  const measure = useAsyncMeasure();

  const handleClick = async () => {
    await measure('firebase_operation', async () => {
      return await firebaseOperation();
    }, 'firebase');
  };

  return <div>...</div>;
}
```

### Performance Dashboard

Enable the performance dashboard in development mode:

```tsx
import { PerformanceDashboard } from '@/components/performance/performance-dashboard';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <PerformanceDashboard enabled={process.env.NODE_ENV === 'development'} />
    </>
  );
}
```

Press `Ctrl+Shift+P` to toggle the dashboard.

## Bundle Analysis

Analyze your bundle size:

```bash
npm run analyze
```

## Component Memoization

Expensive components are memoized with `React.memo`:

- `GameBoard` - Prevents re-renders on timer updates
- `GameCell` - Memoizes individual cells
- `OpponentBoard` - Prevents unnecessary re-renders

## Performance Optimization Checklist

- [x] Bundle analyzer configured
- [x] FPS tracking implemented
- [x] Firebase latency monitoring
- [x] Contract call duration tracking
- [x] React.memo on expensive components
- [x] Loading states for async operations
- [x] Performance dashboard (dev mode)

## Tips

1. Monitor FPS during gameplay - aim for 60 FPS
2. Keep Firebase operations under 100ms
3. Contract calls should be fast; if slow, check network
4. Look for slow renders (>16ms) in the dashboard
5. Use the dashboard to identify bottlenecks
