import { cubic_bezier_y_of_x } from "./bezier.js";

export interface KeyframeEntry<V> {
    time: number;
    value: V;
    easing?: Iterable<number> | boolean;
}

export function push_kfe<V>(kfs: Array<KeyframeEntry<V>>, time: number, value: V): KeyframeEntry<V> {
    let last = kfs.at(-1);
    if (last) {
        if (last.time == time) {
            last.value = value;
            return last;
        } else if (time < last.time) {
            throw new Error(`keyframe is incremental`);
        }
    }
    const kf = { time, value };
    kfs.push(kf);
    return kf;
}

export function ratio_at(a: Iterable<number>, t: number) {
    const [ox, oy, ix, iy] = a;
    return cubic_bezier_y_of_x([0, 0], [ox, oy], [ix, iy], [1, 1])(t);
}

export function iter_frame_fun(S: number, E: number, repeat_count: number = 1, bounce: boolean = false, that: {
    _start?: number;
    _end?: number;
    _iter_dur?: number;
    _active_dur?: number;
}) {
    // TODO: repeat_dur, easing
    that._start = S;
    if (S < E) {
        if (repeat_count < 0) {
            repeat_count = Infinity;
        } else if (repeat_count == 0) {
            throw Error(`Unexpected`);
        }
        const d = (E - S); // duration
        if (bounce) {
            const i = that._iter_dur = (d + 1) * 2 - 1; // iter duration
            const p = (i - 1);
            const h = p / 2;
            const a = that._active_dur = Math.floor(p * repeat_count) + 1; // active duration
            const Z = that._end = S + a; // past end frame
            return function fn(frame: number) {
                if (frame < S) {
                    return S;
                } else if (frame < Z) {
                    return S + (h - Math.abs(((frame - S) % p) - h));
                } else {
                    return Z - 1;
                }
            }
        } else {
            const i = that._iter_dur = d + 1; // iter duration
            const a = that._active_dur = Math.floor(repeat_count * i); // active duration
            const Z = that._end = S + a; // pass end frame
            return function fn(frame: number) {
                if (frame < S) {
                    return S;
                } else if (frame < Z) {
                    return S + (frame - S) % i;
                } else {
                    return Z - 1;
                }
            }
        }
    } else if (S === E) {
        that._iter_dur = that._active_dur = 0;
        that._end = S;
        return function fn(frame: number) {
            return S;
        }
    } else {
        throw Error(`Unexpected S(${S}) E(${E})`);
    }
}