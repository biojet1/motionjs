export function cubic_bezier_y_of_x(p1: Iterable<number>, p2: Iterable<number>, p3: Iterable<number>, p4: Iterable<number>) {
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