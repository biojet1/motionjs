import { Steppable, Stepper } from "../track/stepper.js";
import { Keyframe, ratio_at } from "./kfhelper.js";

export type KeyExtra = {
    start?: number,
    easing?: Iterable<number> | true,
    curve?: Array<number[]>,
    add?: boolean
}

export class Animated<V, K extends Keyframe<V> = Keyframe<V>> implements Steppable {
    kfs: Array<K> = [];
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
        const { step } = this.make_stepper((n: number) => this.get_value(n));
        this.get_value_off = step;
        return step(frame);
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
        const st = this.make_stepper((n: number) => this.get_value(n));
        while (start <= end) {
            yield st.step(start++);
        }
    }
    stepper(): Stepper {
        return this.make_stepper((n: number) => this.update_value(n));
    }
    make_stepper<V>(step: (frame: number) => V) {
        const { kfs } = this;
        const first = kfs.at(0);
        const last = kfs.at(-1);
        if (first && last) {
            return this.check_stepper(Stepper.create(step, first.time, last.time)).clamp();
        }
        throw Error(`Unexpected by '${this.constructor.name}'`);
    }
    check_stepper<U>(stepper: Stepper<U>) {
        return stepper;
    }
}


