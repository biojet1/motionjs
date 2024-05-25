
////

import { Keyframes, offset_fun, ratio_at } from "./kfhelper";

export class Animatable<V> {
    value: Keyframes<V> = new Keyframes<V>();
    repeat_count?: number;
    bounce?: boolean;
    _end?: number;
    _start?: number;
    // static
    lerp_value(ratio: number, a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    add_value(a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    initial_value(): V {
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
            // return this.initial_value();
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
        const first = value.at(0);
        if (first) {
            const last = value.at(-1);
            if (last) {
                let { repeat_count, bounce } = this;
                const fo = offset_fun(repeat_count, first.time, last.time, bounce, this);
                const fg = (this.get_value_off = function (frame: number) {
                    return this.get_value(fo(frame));
                })
                if (Number.isNaN(frame)) {
                    throw new TypeError();
                } else {
                    return fg.call(this, frame);
                }
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
                            `unexpected start=${start} last.time=${last.time} time=${frame} value=${value} by '${this.constructor.name}'`
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

    frame_range(): [number, number] {
        {
            const { _end } = this;
            if (_end == undefined) {
                try {
                    this.get_value_off(NaN);
                } catch (e) {

                }
            }
        }
        const { _start, _end } = this;
        if (_end == undefined || _start == undefined) {
            throw Error(`Unexpected by '${this.constructor.name}'`);
        }

        return [_start, _end];
    }
}

