import { Vector3 } from "three";
import { Property } from "./properties.js";
import { Keyframe, iter_frame_fun, ratio_at } from "./keyframe/kfhelper.js";
import { cubic_point3d_at, cubic_point_at } from "./keyframe/bezier.js";
import { KeyExtra } from "./keyframe/keyframe.js";

export class Vector3Property<
    K extends Keyframe<Vector3> = Keyframe<Vector3>
> extends Property<Vector3, K> {
    override check_value(x: any): Vector3 {
        if (x instanceof Vector3) {
            return x;
        } else {
            if (Array.isArray(x)) {
                if (x.length == 3) {
                    const c = new Vector3(x[0], x[1], x[2]);
                    return c;
                }
            }
        }
        throw new Error(`Unexpected Vector3 vale ${x}`);
    }
    override lerp_value(r: number, a: Vector3, b: Vector3): Vector3 {
        return a.clone().lerp(b, r);
    }

    override add_value(a: Vector3, b: Vector3): Vector3 {
        return a.clone().add(b);
    }
    // override update(frame: number = 0) {
    //     this.set_value(this.get_value(frame));
    // }
    override set_value(v: Vector3) {
        this.owner[this.name].copy(v);
    }
}
export interface PositionKeyframe<V> extends Keyframe<V> {
    in_tan?: Iterable<number>;
    out_tan?: Iterable<number>;
}

export class PositionProperty extends Vector3Property<
    PositionKeyframe<Vector3>
> {
    override lerp_keyframes(
        t: number,
        a: PositionKeyframe<Vector3>,
        b: PositionKeyframe<Vector3>
    ) {
        const ti = a.in_tan;
        if (ti) {
            const to = a.out_tan;
            if (to) {
                const [ix, iy, iz = 0] = ti;
                const [ox, oy, oz = 0] = to;
                const [ax, ay, az] = a.value;
                const [bx, by, bz] = b.value;
                const [x, y, z] = cubic_point3d_at(
                    t,
                    [ax, ay, az],
                    [ax + ox, ay + oy, az + oz],
                    [bx + ix, by + iy, bz + iz],
                    [bx, by, bz]
                );
                return new Vector3(x, y, z);
            }
        }
        return super.lerp_keyframes(t, a, b);
    }

    override key_value(frame: number, value: Vector3, extra?: KeyExtra) {
        let kf = super.key_value(frame, value, extra);
        let last = this.kfs.at(-2);
        if (last && extra) {
            const [c1, c2] = extra?.curve ?? [];
            if (c1) {
                if (c2) {
                    last.out_tan = c1;
                    last.in_tan = c2;
                } else {
                    // reflect ?
                }
            }
        }

        return kf;
    }
    override initial_value() {
        if (this._initial_value == undefined) {
            return (this._initial_value = this.owner[this.name].clone());
        }
        return this._initial_value;
    }

    _initial_value?: Vector3;
}
