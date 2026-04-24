interface AuthMetrics {
  pathname: string;
  timestamp: string;
  authStatus: 'authorized' | 'unauthorized' | 'error';
  cacheUsed: boolean;
  supabaseResponseTime?: number;
  totalResponseTime: number;
  userId?: string;
  errorCode?: string;
  errorMessage?: string;
}

const METRICS_WINDOW_MS = 5 * 60 * 1000;

class MetricsCollector {
  private metrics: AuthMetrics[] = [];
  private static instance: MetricsCollector;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  record(metric: AuthMetrics): void {
    this.metrics.push(metric);
    
    const now = Date.now();
    this.metrics = this.metrics.filter(
      m => now - new Date(m.timestamp).getTime() < METRICS_WINDOW_MS
    );

    if (this.shouldLogSummary()) {
      this.logSummary();
    }
  }

  private shouldLogSummary(): boolean {
    return this.metrics.length % 10 === 0 || this.metrics.length === 1;
  }

  private logSummary(): void {
    const recentMetrics = this.metrics;
    const total = recentMetrics.length;
    const authorized = recentMetrics.filter(m => m.authStatus === 'authorized').length;
    const unauthorized = recentMetrics.filter(m => m.authStatus === 'unauthorized').length;
    const errors = recentMetrics.filter(m => m.authStatus === 'error').length;
    const cacheHits = recentMetrics.filter(m => m.cacheUsed).length;
    
    const avgSupabaseTime = recentMetrics
      .filter(m => !m.cacheUsed && m.supabaseResponseTime !== undefined)
      .reduce((sum, m) => sum + (m.supabaseResponseTime || 0), 0) / (total - cacheHits || 1);
    
    const avgTotalTime = recentMetrics
      .reduce((sum, m) => sum + m.totalResponseTime, 0) / total;

    console.log('\n📊 [METRICS] Auth Performance Summary (last 5 min):');
    console.log(`   Total requests: ${total}`);
    console.log(`   Authorized: ${authorized} (${((authorized/total)*100).toFixed(1)}%)`);
    console.log(`   Unauthorized: ${unauthorized} (${((unauthorized/total)*100).toFixed(1)}%)`);
    console.log(`   Errors: ${errors} (${((errors/total)*100).toFixed(1)}%)`);
    console.log(`   Cache hit rate: ${((cacheHits/total)*100).toFixed(1)}%`);
    console.log(`   Avg Supabase response: ${avgSupabaseTime.toFixed(0)}ms`);
    console.log(`   Avg total response: ${avgTotalTime.toFixed(0)}ms`);
    console.log('');
  }

  getMetrics(): AuthMetrics[] {
    return [...this.metrics];
  }

  getPerformanceStats(): {
    avgSupabaseTime: number;
    avgTotalTime: number;
    cacheHitRate: number;
    errorRate: number;
  } {
    const total = this.metrics.length;
    if (total === 0) {
      return {
        avgSupabaseTime: 0,
        avgTotalTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
      };
    }

    const cacheHits = this.metrics.filter(m => m.cacheUsed).length;
    const errors = this.metrics.filter(m => m.authStatus === 'error').length;
    
    const avgSupabaseTime = this.metrics
      .filter(m => !m.cacheUsed && m.supabaseResponseTime !== undefined)
      .reduce((sum, m) => sum + (m.supabaseResponseTime || 0), 0) / (total - cacheHits || 1);
    
    const avgTotalTime = this.metrics
      .reduce((sum, m) => sum + m.totalResponseTime, 0) / total;

    return {
      avgSupabaseTime,
      avgTotalTime,
      cacheHitRate: (cacheHits / total) * 100,
      errorRate: (errors / total) * 100,
    };
  }
}

export const metricsCollector = MetricsCollector.getInstance();
