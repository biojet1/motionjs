import { Keyframe, iter_frame_fun, ratio_at } from "./kfhelper.js";

export type KeyExtra = {
    start?: number,
    easing?: Iterable<number> | true,
    curve?: Array<number[]>,
    add?: boolean
}

export class Animated<V, K extends Keyframe<V> = Keyframe<V>> {
    kfs: Array<K> = [];
    _repeat_count?: number;
    _bounce?: boolean;
    _end?: number;
    _start?: number;
    // static
    /* c8 ignore start */
    // should be static
    lerp_value(ratio: number, a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    // should be static
    add_value(a: V, b: V): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    // should be static
    dump_value(_a: V | null): any {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    // should be static
    load_value(_a: any): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    // static load_value_2(_a: any): V {
    //     throw Error(`Not implemented by '${this.constructor.name}'`);
    // }
    // should be static
    initial_value(): V {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    //
    update(frame: number): any {
        this.update_value(frame);
    }
    //
    update_value(frame: number): any {
        throw Error(`Not implemented by '${this.constructor.name}'`);
    }
    /* c8 ignore stop */
    check_value(x: any): V {
        return x as V;
    }
    // get_frame_value
    get_value(frame: number): V {
        const { kfs } = this;

        let p = undefined; // previous Keyframe<V>
        for (const k of kfs) {
            if (frame < k.time) {
                if (p) {
                    const { easing, value, time } = p;
                    if (easing === true) {
                        return value;
                    }
                    let r = (frame - time) / (k.time - time);
                    if (easing) {
                        r = ratio_at(easing, r);
                    }
                    return this.lerp_keyframes(r, p, k);
                } else {
                    return k.value;
                }
            } else if (frame == k.time) {
                return k.value;
            }
            p = k;
        }
        if (p) {
            return this.get_value_off!(frame);
        }
        return this.initial_value();
    }
    lerp_keyframes(t: number, p: K, k: K) {
        return this.lerp_value(t, p.value, k.value);
    }
    // static
    get_value_off?(frame: number): V {
        const { kfs } = this;
        const first = kfs.at(0);
        if (first) {
            const last = kfs.at(-1);
            if (last) {
                let { _repeat_count, _bounce } = this;
                const fo = iter_frame_fun(
                    first.time,
                    last.time,
                    _repeat_count,
                    _bounce,
                    this
                );
                const fg = (this.get_value_off = function (frame: number) {
                    return this.get_value(fo(frame));
                });
                if (Number.isNaN(frame)) {
                    throw new TypeError();
                } else {
                    return fg.call(this, frame);
                }
            }
        }
        /* c8 ignore start */
        throw Error(`Unexpected by '${this.constructor.name}'`);
        /* c8 ignore stop */
    }
    key_value(
        frame: number,
        value: V,
        extra?: KeyExtra
    ) {
        const { start, easing, add } = extra ?? {};
        const { kfs } = this;
        let last = kfs.at(-1);
        if (last) {
            if (start == undefined) {
                // pass
            } else if (start > last.time) {
                last.easing = true;
                last = this.add_keyframe(start, last.value);
            } else {
                if (start != last.time) {
                    throw new Error(
                        `unexpected start=${start} last.time=${last.time} time=${frame} value=${value} by '${this.constructor.name}' ${JSON.stringify(extra)}`
                    );
                }
            }
        } else {
            if (start == undefined) {
                // pass
            } else {
                last = this.add_keyframe(start, this.initial_value());
            }
        }

        value = this.check_value(value);
        delete this["get_value_off"];
        delete this["_end"];
        if (last) {
            if (easing != undefined) {
                last.easing = easing;
            }
            if (add) {
                value = this.add_value(last.value, value);
            }
            if (last.time == frame) {
                last.value = value;
                return last;
            } else if (frame < last.time) {
                throw new Error(
                    `unexpected start=${start} last.time=${last.time} time=${frame} value=${value} by '${this.constructor.name}'`
                );
            }
        }
        return this.add_keyframe(frame, value);
    }
    new_keyframe(time: number, value: V, easing?: Iterable<number> | true): K {
        const kf: Keyframe<V> = { time, value };
        if (easing) {
            kf.easing = easing;
        }
        delete this["get_value_off"];
        delete this["_end"];
        return kf as K;
    }
    add_keyframe(time: number, value: V, easing?: Iterable<number> | true) {
        const kf = this.new_keyframe(time, value, easing);
        this.kfs.push(kf);
        return kf;
    }
    hold_last_value(frame: number) {
        const { kfs } = this;
        let last = kfs.at(-1);
        if (last) {
            if (frame > last.time) {
                last.easing = true;
                last = this.add_keyframe(frame, last.value);
            } else {
                if (frame != last.time) {
                    throw new Error(
                        `unexpected frame=${frame} last.time=${last.time} time=${frame} by '${this.constructor.name}'`
                    );
                }
            }
        } else {
            last = this.add_keyframe(frame, this.initial_value());
        }
        return last;
    }
    *enum_values(start: number, end: number) {
        while (start < end) {
            yield this.get_value(start++);
        }
    }

    frame_range(): [number, number] {
        if (this._end == undefined) {
            try {
                this.get_value_off?.(NaN);
            } catch (e) {
                if (!(e instanceof TypeError)) {
                    throw Error(`Unexpected`);
                }
            }
        }

        const { _start, _end } = this;
        /* c8 ignore start */
        if (_end == undefined || _start == undefined) {
            throw Error(`Unexpected by '${this.constructor.name}'`);
        }
        /* c8 ignore stop */
        return [_start, _end];
    }
    repeat(count: number = 2, bounce: boolean = false) {
        this._repeat_count = count;
        this._bounce = bounce;
        delete this["get_value_off"];
        delete this["_end"];
        return this;
    }
    updater(): Updater {
        const { kfs } = this;
        const first = kfs.at(0);
        if (first) {
            const last = kfs.at(-1);
            if (last) {
                let { _repeat_count, _bounce } = this;
                const start = first.time;
                const end = last.time;
                const fof = iter_frame_fun(
                    start,
                    end,
                    _repeat_count,
                    _bounce,
                    this
                );
                return {
                    start: this._start!, end: this._end!, update: (frame: number) => {
                        this.update_value(fof(frame));
                    }
                }
            }
        }
        /* c8 ignore start */
        throw Error(`Unexpected by '${this.constructor.name}'`);
        /* c8 ignore stop */
    }

}
export interface Updater {
    start: number;
    end: number;
    update(frame: number): any;
}
export interface Updateable {
    updater(): Updater;
}

