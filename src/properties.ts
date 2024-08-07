import { Animated } from "./keyframe/keyframe.js";
import { Keyframe } from "./keyframe/kfhelper.js";

export class Property<V, K extends Keyframe<V> = Keyframe<V>> extends Animated<V, K> {
    owner: any;
    name: string;
    constructor(owner: any, name: string) {
        super();
        this.owner = owner;
        this.name = name;
    }

    update_value(frame: number = 0) {
        this.set_value(this.get_value(frame));
    }
    set_value(v: V) {
        this.owner[this.name] = v;
    }
    override initial_value() {
        return this.owner[this.name];
    }
}

export class NumericProperty extends Property<number> {


    override lerp_value(r: number, a: number, b: number): number {
        return a * (1 - r) + b * r;
    }
    override add_value(a: number, b: number): number {
        return a + b;
    }
}

import { Color, Vector3 } from 'three';

export class HSLProperty extends Property<Vector3> {


    override lerp_value(r: number, a: Vector3, b: Vector3): Vector3 {

        return a.lerp(b, r);
    }

    override add_value(a: Vector3, b: Vector3): Vector3 {
        return a.add(b);
    }
}
export class ColorProperty extends Property<Color> {


    override lerp_value(r: number, a: Color, b: Color): Color {

        return a.clone().lerp(b, r);
    }

    override add_value(a: Color, b: Color): Color {
        return a.clone().add(b);
    }

    override check_value(x: any): Color {
        if (x instanceof Color) {
            return x;
        } else {
            const c = new Color();
            c.setColorName(x);
            return c;
        }
    }
}


