/* Self-contained motion primitives. No Remotion import, no globals —
   safe to use inside Remotion, inside a video-editor renderer, or standalone. */

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Ease = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export interface AnimateOptions {
  from: number;
  to: number;
  start: number;
  end: number;
  ease?: Ease;
}

/** animate({from,to,start,end})(T) — eased ramp, clamped outside [start,end]. */
export const animate = (o: AnimateOptions) => (T: number): number => {
  const ease = o.ease || Easing.linear;
  if (o.end <= o.start) return T < o.start ? o.from : o.to;
  const p = clamp((T - o.start) / (o.end - o.start), 0, 1);
  return lerp(o.from, o.to, ease(p));
};

export const MOTION = {
  enter: (o: AnimateOptions) => animate({ ease: Easing.easeOutCubic, ...o }),
  pop: (o: AnimateOptions) => animate({ ease: Easing.easeOutBack, ...o }),
  move: (o: AnimateOptions) => animate({ ease: Easing.easeInOutCubic, ...o }),
};

/** track([[t, v], ...])(T) — piecewise keyframe track, eased between stops. */
export const track =
  (pairs: [number, number][], ease: Ease = Easing.easeInOutCubic) =>
  (T: number): number => {
    if (pairs.length === 0) return 0;
    if (T <= pairs[0][0]) return pairs[0][1];
    const last = pairs[pairs.length - 1];
    if (T >= last[0]) return last[1];
    for (let i = 0; i < pairs.length - 1; i++) {
      const [t0, v0] = pairs[i];
      const [t1, v1] = pairs[i + 1];
      if (T >= t0 && T <= t1) {
        if (t1 === t0) return v1;
        return lerp(v0, v1, ease((T - t0) / (t1 - t0)));
      }
    }
    return last[1];
  };

/** Slide in from an offset, then click into place with a small overshoot. */
export const arrive =
  (from: number, t0: number, t1: number) =>
  (T: number): number => {
    const mid = t0 + (t1 - t0) * 0.7;
    const near = from > 0 ? 42 : -42;
    return T < mid
      ? MOTION.enter({ from, to: near, start: t0, end: mid })(T)
      : MOTION.pop({ from: near, to: 0, start: mid, end: t1 })(T);
  };

/** 0 -> 1 -> 0 emphasis beat starting at t0 (~0.8s long). */
export const pulse = (t0: number) => (T: number): number =>
  MOTION.pop({ from: 0, to: 1, start: t0, end: t0 + 0.2 })(T) *
  (1 - MOTION.move({ from: 0, to: 1, start: t0 + 0.22, end: t0 + 0.62 })(T));
