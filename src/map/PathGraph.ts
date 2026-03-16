import { tileToScreen } from '../utils/iso';

interface PathPoint {
  x: number;
  y: number;
}

export class PathGraph {
  private points: PathPoint[] = [];
  private segmentLengths: number[] = [];
  private totalLength: number = 0;

  constructor(waypoints: { col: number; row: number }[]) {
    // Convert tile coordinates to screen coordinates
    this.points = waypoints.map(wp => tileToScreen(wp.col, wp.row));

    // Calculate segment lengths
    for (let i = 0; i < this.points.length - 1; i++) {
      const dx = this.points[i + 1].x - this.points[i].x;
      const dy = this.points[i + 1].y - this.points[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      this.segmentLengths.push(len);
      this.totalLength += len;
    }
  }

  /** Get a point along the path at distance `dist` from the start */
  getPointAtDistance(dist: number): PathPoint {
    if (dist <= 0) return { ...this.points[0] };
    if (dist >= this.totalLength) return { ...this.points[this.points.length - 1] };

    let remaining = dist;
    for (let i = 0; i < this.segmentLengths.length; i++) {
      if (remaining <= this.segmentLengths[i]) {
        const t = remaining / this.segmentLengths[i];
        return {
          x: this.points[i].x + (this.points[i + 1].x - this.points[i].x) * t,
          y: this.points[i].y + (this.points[i + 1].y - this.points[i].y) * t,
        };
      }
      remaining -= this.segmentLengths[i];
    }

    return { ...this.points[this.points.length - 1] };
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  getStartPoint(): PathPoint {
    return { ...this.points[0] };
  }

  getEndPoint(): PathPoint {
    return { ...this.points[this.points.length - 1] };
  }

  getPoints(): PathPoint[] {
    return this.points.map(p => ({ ...p }));
  }
}
