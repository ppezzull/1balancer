import { createLogger } from '../utils/logger';

const logger = createLogger('MetricsCollector');

interface Metric {
  value: number;
  timestamp: number;
}

interface Counter {
  count: number;
  lastReset: number;
}

interface Histogram {
  values: number[];
  count: number;
  sum: number;
  min: number;
  max: number;
}

export class MetricsCollector {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Histogram>();
  private gauges = new Map<string, Metric>();
  private startTime = Date.now();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Initialize counters
    this.counters.set('swaps_initiated', { count: 0, lastReset: Date.now() });
    this.counters.set('swaps_completed', { count: 0, lastReset: Date.now() });
    this.counters.set('swaps_failed', { count: 0, lastReset: Date.now() });
    this.counters.set('swaps_cancelled', { count: 0, lastReset: Date.now() });
    this.counters.set('api_requests', { count: 0, lastReset: Date.now() });
    this.counters.set('websocket_connections', { count: 0, lastReset: Date.now() });

    // Initialize histograms
    this.histograms.set('api_latency', this.createHistogram());
    this.histograms.set('swap_duration', this.createHistogram());
    this.histograms.set('quote_generation_time', this.createHistogram());
  }

  // Counter methods
  recordSwapInitiated(): void {
    this.incrementCounter('swaps_initiated');
  }

  recordSwapCompleted(): void {
    this.incrementCounter('swaps_completed');
  }

  recordSwapFailed(): void {
    this.incrementCounter('swaps_failed');
  }

  recordSwapCancelled(): void {
    this.incrementCounter('swaps_cancelled');
  }

  recordApiRequest(): void {
    this.incrementCounter('api_requests');
  }

  recordWebSocketConnection(): void {
    this.incrementCounter('websocket_connections');
  }

  // Histogram methods
  recordApiLatency(endpoint: string, latencyMs: number): void {
    this.recordHistogram(`api_latency_${endpoint}`, latencyMs);
    this.recordHistogram('api_latency', latencyMs);
  }

  recordSwapDuration(durationSeconds: number): void {
    this.recordHistogram('swap_duration', durationSeconds);
  }

  recordQuoteGenerationTime(timeMs: number): void {
    this.recordHistogram('quote_generation_time', timeMs);
  }

  // Gauge methods
  setActiveSwaps(count: number): void {
    this.setGauge('active_swaps', count);
  }

  setConnectedClients(count: number): void {
    this.setGauge('connected_clients', count);
  }

  setMemoryUsage(bytes: number): void {
    this.setGauge('memory_usage_bytes', bytes);
  }

  // Get metrics snapshot
  getSnapshot(): any {
    const counters: any = {};
    for (const [name, counter] of this.counters) {
      counters[name] = counter.count;
    }

    const histograms: any = {};
    for (const [name, histogram] of this.histograms) {
      histograms[name] = this.getHistogramStats(histogram);
    }

    const gauges: any = {};
    for (const [name, gauge] of this.gauges) {
      gauges[name] = gauge.value;
    }

    // Calculate rates
    const uptime = (Date.now() - this.startTime) / 1000; // seconds
    const rates = {
      swaps_per_minute: (counters.swaps_initiated / uptime) * 60,
      success_rate: counters.swaps_initiated > 0 
        ? (counters.swaps_completed / counters.swaps_initiated) * 100 
        : 0,
      failure_rate: counters.swaps_initiated > 0
        ? (counters.swaps_failed / counters.swaps_initiated) * 100
        : 0,
    };

    return {
      uptime: Math.floor(uptime),
      counters,
      histograms,
      gauges,
      rates,
      timestamp: Date.now(),
    };
  }

  // Get Prometheus-formatted metrics
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add counters
    for (const [name, counter] of this.counters) {
      lines.push(`# TYPE orchestrator_${name}_total counter`);
      lines.push(`orchestrator_${name}_total ${counter.count}`);
    }

    // Add histograms
    for (const [name, histogram] of this.histograms) {
      const stats = this.getHistogramStats(histogram);
      lines.push(`# TYPE orchestrator_${name} histogram`);
      lines.push(`orchestrator_${name}_count ${stats.count}`);
      lines.push(`orchestrator_${name}_sum ${stats.sum}`);
      lines.push(`orchestrator_${name}_min ${stats.min}`);
      lines.push(`orchestrator_${name}_max ${stats.max}`);
      lines.push(`orchestrator_${name}_mean ${stats.mean}`);
      lines.push(`orchestrator_${name}_p50 ${stats.p50}`);
      lines.push(`orchestrator_${name}_p95 ${stats.p95}`);
      lines.push(`orchestrator_${name}_p99 ${stats.p99}`);
    }

    // Add gauges
    for (const [name, gauge] of this.gauges) {
      lines.push(`# TYPE orchestrator_${name} gauge`);
      lines.push(`orchestrator_${name} ${gauge.value}`);
    }

    // Add system metrics
    const memoryUsage = process.memoryUsage();
    lines.push('# TYPE orchestrator_memory_heap_used_bytes gauge');
    lines.push(`orchestrator_memory_heap_used_bytes ${memoryUsage.heapUsed}`);
    lines.push('# TYPE orchestrator_memory_heap_total_bytes gauge');
    lines.push(`orchestrator_memory_heap_total_bytes ${memoryUsage.heapTotal}`);
    lines.push('# TYPE orchestrator_memory_rss_bytes gauge');
    lines.push(`orchestrator_memory_rss_bytes ${memoryUsage.rss}`);

    return lines.join('\n');
  }

  // Reset all metrics
  reset(): void {
    for (const counter of this.counters.values()) {
      counter.count = 0;
      counter.lastReset = Date.now();
    }

    for (const histogram of this.histograms.values()) {
      histogram.values = [];
      histogram.count = 0;
      histogram.sum = 0;
      histogram.min = Infinity;
      histogram.max = -Infinity;
    }

    this.gauges.clear();
    this.startTime = Date.now();

    logger.info('Metrics reset');
  }

  // Private methods
  private incrementCounter(name: string): void {
    const counter = this.counters.get(name);
    if (counter) {
      counter.count++;
    } else {
      this.counters.set(name, { count: 1, lastReset: Date.now() });
    }
  }

  private recordHistogram(name: string, value: number): void {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      histogram = this.createHistogram();
      this.histograms.set(name, histogram);
    }

    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);

    // Keep only last 1000 values to prevent memory issues
    if (histogram.values.length > 1000) {
      histogram.values.shift();
    }
  }

  private setGauge(name: string, value: number): void {
    this.gauges.set(name, {
      value,
      timestamp: Date.now(),
    });
  }

  private createHistogram(): Histogram {
    return {
      values: [],
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
    };
  }

  private getHistogramStats(histogram: Histogram): any {
    if (histogram.count === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...histogram.values].sort((a, b) => a - b);
    const mean = histogram.sum / histogram.count;
    const p50 = this.percentile(sorted, 0.5);
    const p95 = this.percentile(sorted, 0.95);
    const p99 = this.percentile(sorted, 0.99);

    return {
      count: histogram.count,
      sum: histogram.sum,
      min: histogram.min,
      max: histogram.max,
      mean: Math.round(mean * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  // Periodic reporting
  startPeriodicReporting(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const snapshot = this.getSnapshot();
      logger.info('Metrics snapshot', snapshot);
    }, intervalMs);
  }
}