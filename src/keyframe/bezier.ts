export function cubic_bezier_y_of_x(
    p1: Iterable<number>,
    p2: Iterable<number>,
    p3: Iterable<number>,
    p4: Iterable<number>
) {
    // Return the bezier parameter size"""
    // ((bx0, by0), (bx1, by1), (bx2, by2), (bx3, by3)) = bez
    // # parametric bezier
    const { abs } = Math;
    const [x0, y0] = p1;
    const [bx1, by1] = p2;
    const [bx2, by2] = p3;
    const [bx3, by3] = p4;
    const cx = 3 * (bx1 - x0);
    const bx = 3 * (bx2 - bx1) - cx;
    const ax = bx3 - x0 - cx - bx;
    const cy = 3 * (by1 - y0);
    const by = 3 * (by2 - by1) - cy;
    const ay = by3 - y0 - cy - by;

    function sampleCurveX(t: number) {
        return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t: number) {
        return ((ay * t + by) * t + cy) * t;
    }

    function sampleCurveDerivativeX(t: number) {
        return (3.0 * ax * t + 2.0 * bx) * t + cx;
    }

    function solveCurveX(x: number) {
        let t0;
        let t1;
        let t2;
        let x2;
        let d2;
        let i;
        const epsilon = 1e-5; // Precision

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 32; i += 1) {
            x2 = sampleCurveX(t2) - x;
            if (abs(x2) < epsilon) return t2;
            d2 = sampleCurveDerivativeX(t2);
            if (abs(d2) < epsilon) break;
            t2 -= x2 / d2;
        }

        // No solution found - use bi-section
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0) return t0;
        if (t2 > t1) return t1;

        while (t0 < t1) {
            x2 = sampleCurveX(t2);
            if (abs(x2 - x) < epsilon) return t2;
            if (x > x2) t0 = t2;
            else t1 = t2;

            t2 = (t1 - t0) * 0.5 + t0;
        }

        // Give up
        return t2;
    }

    return function cubicBezierYOfX(t: number) {
        return sampleCurveY(solveCurveX(t));
    };
}

export function cubic_point_at_orig(
    t: number,
    [sx, sy]: [number, number],
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    [ex, ey]: [number, number]
) {
    const F = 1 - t;
    return [
        F * F * F * sx +
        3 * F * F * t * x1 +
        3 * F * t * t * x2 +
        t * t * t * ex,
        F * F * F * sy +
        3 * F * F * t * y1 +
        3 * F * t * t * y2 +
        t * t * t * ey,
    ];
}
export function cubic_point_at(
    t: number,
    [sx, sy]: [number, number],
    [x1, y1]: [number, number],
    [x2, y2]: [number, number],
    [ex, ey]: [number, number]
): [number, number] {
    const F = 1 - t;
    const F2 = F * F;
    const F3 = F2 * F;
    const t2 = t * t;
    const t3 = t2 * t;
    const Ft = F * t;
    const F2t = F2 * t;
    const Ft2 = Ft * t;

    return [
        F3 * sx + 3 * F2t * x1 + 3 * Ft2 * x2 + t3 * ex,
        F3 * sy + 3 * F2t * y1 + 3 * Ft2 * y2 + t3 * ey,
    ];
}


export function cubic_point3d_at(
    t: number,
    [x0, y0, z0]: [number, number, number],
    [x1, y1, z1]: [number, number, number],
    [x2, y2, z2]: [number, number, number],
    [x3, y3, z3]: [number, number, number]
): [number, number, number] {
    const F = 1 - t;
    const F2 = F * F;
    const F3 = F2 * F;
    const t2 = t * t;
    const t3 = t2 * t;
    const F2t = F2 * t;
    const Ft2 = F * t2;

    const x = F3 * x0 + 3 * F2t * x1 + 3 * Ft2 * x2 + t3 * x3;
    const y = F3 * y0 + 3 * F2t * y1 + 3 * Ft2 * y2 + t3 * y3;
    const z = F3 * z0 + 3 * F2t * z1 + 3 * Ft2 * z2 + t3 * z3;

    return [x, y, z];
}