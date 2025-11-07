type WindowCfg = { limit: number; ms: number };

export class TokenBucket {
  private times: number[] = [];

  constructor(private cfg: WindowCfg) {}

  can(): boolean {
    const now = Date.now();
    this.times = this.times.filter((t) => now - t < this.cfg.ms);
    return this.times.length < this.cfg.limit;
  }

  take(): { ok: boolean; remainingMs?: number } {
    const now = Date.now();
    this.times = this.times.filter((t) => now - t < this.cfg.ms);
    if (this.times.length < this.cfg.limit) {
      this.times.push(now);
      return { ok: true };
    }
    const oldest = this.times[0];
    return { ok: false, remainingMs: Math.max(0, this.cfg.ms - (now - oldest)) };
  }
}

export const msgShortBurst = new TokenBucket({ limit: 3, ms: 10_000 });
export const msgPerMinute = new TokenBucket({ limit: 12, ms: 60_000 });
export const swipePer10s = new TokenBucket({ limit: 6, ms: 10_000 });
export const superPerDay = new TokenBucket({ limit: 3, ms: 86_400_000 });

export function msToS(ms?: number) {
  return ms ? Math.ceil(ms / 1000) : 0;
}

