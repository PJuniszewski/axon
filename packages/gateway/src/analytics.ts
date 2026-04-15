export interface AnalyticsRecord {
  timestamp: number;
  originalTokens: number;
  axonTokens: number;
  reductionPct: number;
  direction: "encode" | "decode";
}

export interface AggregateStats {
  totalMessages: number;
  totalNLTokens: number;
  totalAxonTokens: number;
  avgReduction: number;
}

export class AnalyticsTracker {
  private records: AnalyticsRecord[] = [];
  private listeners = new Set<(stats: AggregateStats) => void>();

  record(entry: Omit<AnalyticsRecord, "timestamp">): void {
    const record: AnalyticsRecord = { ...entry, timestamp: Date.now() };
    this.records.push(record);
    const stats = this.getTotalSavings();
    for (const listener of this.listeners) {
      listener(stats);
    }
  }

  getTotalSavings(): AggregateStats {
    if (this.records.length === 0) {
      return { totalMessages: 0, totalNLTokens: 0, totalAxonTokens: 0, avgReduction: 0 };
    }

    const totalNLTokens = this.records.reduce((sum, r) => sum + r.originalTokens, 0);
    const totalAxonTokens = this.records.reduce((sum, r) => sum + r.axonTokens, 0);
    const avgReduction = this.records.reduce((sum, r) => sum + r.reductionPct, 0) / this.records.length;

    return {
      totalMessages: this.records.length,
      totalNLTokens,
      totalAxonTokens,
      avgReduction: Math.round(avgReduction),
    };
  }

  getRecentEvents(n: number): AnalyticsRecord[] {
    return this.records.slice(-n);
  }

  subscribe(listener: (stats: AggregateStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
