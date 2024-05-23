import { cubic_bezier_y_of_x } from "./bezier";

export interface KeyframeEntry<V> {
    time: number;
    value: V;
    easing?: Iterable<number> | boolean;
}

export class Keyframes<V> extends Array<KeyframeEntry<V>> {
    push_value(time: number, value: V): KeyframeEntry<V> {
        let last = this[this.length - 1];
        if (last) {
            if (last.time == time) {
                last.value = value;
                return last;
            } else if (time < last.time) {
                throw new Error(`keyframe is incremental`);
            }
        }
        const kf = { time, value };
        this.push({ time, value });
        return kf;
    }
}

function _off_fun(repeat_count: number, S: number, E: number, bounce: boolean = false) {
    if (S < E) {
        if (repeat_count < 0) {
            repeat_count = Infinity;
        } else if (repeat_count == 0) {
            throw Error(`Unexpected`);
        }
        const d = (E - S); // duration
        if (bounce) {
            const i = (d + 1) * 2 - 1; // iter duration
            const p = (i - 1);
            const h = p / 2;
            const a = Math.floor(p * repeat_count) + 1; // active duration
            const Z = S + a; // past end frame
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
            const i = d + 1; // iter duration
            const a = Math.floor(repeat_count * i); // active duration
            const Z = S + a; // pass end frame
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
        return function fn(frame: number) {
            return S;
        }
    } else {
        throw Error(`Unexpected`);
    }
}
function ratio_at(a: Iterable<number>, t: number) {
    const [ox, oy, ix, iy] = a;
    return cubic_bezier_y_of_x([0, 0], [ox, oy], [ix, iy], [1, 1])(t);
}

////

export class Animatable<V> {
    value: Keyframes<V> = new Keyframes<V>();
    repeat_count?: number;
    bounce?: boolean;
    iter_dur?: number;
    active_dur?: number;

    // static
    lerp_value(ratio: number, a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    add_value(a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    check_value(x: any): V {
        return x as V;
    }
    // get_frame_value
    get_value(frame: number): V {
        const { value } = this;
        if (value instanceof Keyframes) {
            let p = undefined; // previous KeyframeEntry<V>
            for (const k of value) {
                if (frame <= k.time) {
                    if (p) {
                        if (k.easing === true) {
                            return p.value;
                        }
                        let r = (frame - p.time) / (k.time - p.time);
                        if (r == 0) {
                            return p.value;
                        } else if (r == 1) {
                            return k.value;
                        } else if (p.easing && p.easing !== true) {
                            r = ratio_at(p.easing, r);
                        }
                        return this.lerp_value(r, p.value, k.value);
                    } else if (frame < k.time) {
                        return this.get_value_off(frame);
                        // return k.value;
                    } else {
                        return k.value;
                    }
                }
                p = k;
            }
            if (p) {
                return this.get_value_off(frame);
                // return p.value;
            }
            throw new Error(`empty keyframe list`);
        } else {
            if (value == null) {
                throw new Error(`value cant be null`);
            }
            return value;
        }
    }
    // static
    get_value_off(frame: number): V {
        const { value } = this;
        if (!(value instanceof Keyframes)) {
            throw Error(`Unexpected by '${this.constructor.name}'`);
        }
        const first = value.at(0);
        if (first) {
            const last = value.at(-1);
            if (last) {
                let { repeat_count = 1, bounce } = this;
                const fn = _off_fun(repeat_count, first.time, last.time, bounce);
                return (this.get_value_off = function (frame: number) {
                    return this.get_value(fn(frame));
                }).call(this, frame);
            }
        }
        throw Error(`Unexpected by '${this.constructor.name}'`);
    }
    key_value(
        frame: number,
        value: V,
        start?: number,
        easing?: Iterable<number> | boolean,
        add?: boolean
    ) {
        let { value: kfs } = this;
        let last;
        if (kfs instanceof Keyframes) {
            last = kfs[kfs.length - 1];
            if (last) {
                if (start == undefined) {
                    // pass
                } else if (start > last.time) {
                    last.easing = true;
                    last = kfs.push_value(start, this.get_value(last.time));
                } else {
                    if (start != last.time) {
                        throw new Error(
                            `unexpected start=${start} last.time=${last.time} time=${frame} value=${value}`
                        );
                    }
                }
            }
        } else {
            const v = kfs;
            kfs = this.value = new Keyframes<V>();
            if (start != undefined) {
                if (v != null) {
                    last = kfs.push_value(start, v);
                }
            }
        }
        value = this.check_value(value);
        if (last) {
            if (easing != undefined) {
                last.easing = easing;
            }
            if (add) {
                value = this.add_value(last.value, value);
            }
        }
        return kfs.push_value(frame, value);
    }
}

