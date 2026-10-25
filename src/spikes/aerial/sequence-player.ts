// Phase 0 spike for concept 03 (PRD §9.2). Canvas image sequence:
// - compressed frames are fetched once and kept as Blobs (cheap);
// - only a window of ±WINDOW frames around the target is decoded to ImageBitmap
//   (a 1600 × 900 bitmap is ~5.8 MB, so decoding everything crashes iOS tabs);
// - scroll only sets `target`; drawing happens in requestAnimationFrame.
// Phase 3 folds this into MatchedFrameScrubber (scroll mode).

export interface PlayerStats {
  fetched: number;
  fetchedBytes: number;
  decoded: number;
  decodedPeak: number;
  decodedMB: number;
  misses: number;
  fps: number;
  drawn: number;
  target: number;
}

const WINDOW = 12;
const FETCH_CONCURRENCY = 6;
const DECODE_CONCURRENCY = 3;

export class SequencePlayer {
  readonly count: number;
  private readonly blobs: (Blob | undefined)[];
  private readonly bitmaps = new Map<number, ImageBitmap>();
  private readonly decoding = new Set<number>();
  private readonly ctx: CanvasRenderingContext2D;
  private target = 0;
  private drawn = -1;
  private raf = 0;
  private started = false;
  private destroyed = false;
  private frameTimes: number[] = [];
  readonly stats: PlayerStats = {
    fetched: 0,
    fetchedBytes: 0,
    decoded: 0,
    decodedPeak: 0,
    decodedMB: 0,
    misses: 0,
    fps: 0,
    drawn: -1,
    target: 0,
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly urls: string[],
    private readonly frameWidth: number,
    private readonly frameHeight: number,
  ) {
    this.count = urls.length;
    this.blobs = new Array(this.count);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.resize();
  }

  /** Size the backing store: CSS size × DPR (capped at 2), never above the frame's own pixels. */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = this.canvas.clientWidth || this.frameWidth;
    const width = Math.min(Math.round(cssWidth * dpr), this.frameWidth);
    const height = Math.round((width * this.frameHeight) / this.frameWidth);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.drawn = -1;
      this.schedule();
    }
  }

  /** Progressive fetch: every 8th frame, then every 4th, 2nd, then the rest. */
  start() {
    if (this.started) return;
    this.started = true;
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          order.push(i);
        }
      }
    }
    if (!seen.has(this.count - 1)) order.splice(1, 0, this.count - 1);

    let next = 0;
    const worker = async () => {
      while (next < order.length && !this.destroyed) {
        const i = order[next++];
        try {
          const res = await fetch(this.urls[i]);
          if (!res.ok) continue;
          const blob = await res.blob();
          this.blobs[i] = blob;
          this.stats.fetched++;
          this.stats.fetchedBytes += blob.size;
          if (Math.abs(i - this.target) <= WINDOW) this.schedule();
        } catch {
          // Network hiccup: the frame stays missing and its neighbours stand in.
        }
      }
    };
    for (let w = 0; w < FETCH_CONCURRENCY; w++) void worker();
  }

  /** p in [0, 1]. */
  setProgress(p: number) {
    const t = Math.round(Math.min(1, Math.max(0, p)) * (this.count - 1));
    if (t !== this.target) {
      this.target = t;
      this.stats.target = t;
      this.schedule();
    }
  }

  get progressFrame() {
    return this.target;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    for (const bmp of this.bitmaps.values()) bmp.close();
    this.bitmaps.clear();
  }

  private schedule() {
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    this.decodeWindow();
    this.evict();

    const best = this.nearestBitmap(this.target);
    if (best !== -1 && best !== this.drawn) {
      this.ctx.drawImage(this.bitmaps.get(best)!, 0, 0, this.canvas.width, this.canvas.height);
      this.drawn = best;
      this.stats.drawn = best;
      // Reveal the canvas over the poster only once it has a real frame.
      this.canvas.dataset.ready = "";
      if (best !== this.target) this.stats.misses++;
      this.frameTimes.push(now);
      while (this.frameTimes.length && now - this.frameTimes[0] > 1000) this.frameTimes.shift();
      this.stats.fps = this.frameTimes.length;
    }
    // No forced re-tick: fetch and decode completions schedule the next one.
  };

  /** Decode frames nearest the target first, within ±WINDOW. */
  private decodeWindow() {
    for (let d = 0; d <= WINDOW && this.decoding.size < DECODE_CONCURRENCY; d++) {
      for (const i of d === 0 ? [this.target] : [this.target + d, this.target - d]) {
        if (i < 0 || i >= this.count) continue;
        if (this.bitmaps.has(i) || this.decoding.has(i)) continue;
        const blob = this.blobs[i];
        if (!blob) continue;
        this.decoding.add(i);
        createImageBitmap(blob)
          .then((bmp) => {
            this.decoding.delete(i);
            if (this.destroyed || Math.abs(i - this.target) > WINDOW) {
              bmp.close();
              return;
            }
            this.bitmaps.set(i, bmp);
            this.stats.decoded = this.bitmaps.size;
            this.stats.decodedPeak = Math.max(this.stats.decodedPeak, this.bitmaps.size);
            this.stats.decodedMB = (this.bitmaps.size * this.frameWidth * this.frameHeight * 4) / 1e6;
            this.schedule();
          })
          .catch(() => this.decoding.delete(i));
        if (this.decoding.size >= DECODE_CONCURRENCY) return;
      }
    }
  }

  /** Close bitmaps outside the window, except the one on screen. */
  private evict() {
    for (const [i, bmp] of this.bitmaps) {
      if (Math.abs(i - this.target) > WINDOW && i !== this.drawn) {
        bmp.close();
        this.bitmaps.delete(i);
      }
    }
    this.stats.decoded = this.bitmaps.size;
    this.stats.decodedMB = (this.bitmaps.size * this.frameWidth * this.frameHeight * 4) / 1e6;
  }

  private nearestBitmap(t: number) {
    for (let d = 0; d <= WINDOW; d++) {
      // Prefer the frame behind the target so motion never jumps ahead.
      if (this.bitmaps.has(t - d)) return t - d;
      if (d && this.bitmaps.has(t + d)) return t + d;
    }
    return this.drawn !== -1 && this.bitmaps.has(this.drawn) ? this.drawn : -1;
  }
}
