import { Animatable } from "./keyframe";


export class NumericProperty extends Animatable<number> {
    owner: any;
    name: string;
    constructor(owner: any, name: string) {
        super();
        this.owner = owner;
        this.name = name;
    }

    override lerp_value(r: number, a: number, b: number): number {
        return a * (1 - r) + b * r;
    }
    override add_value(a: number, b: number): number {
        return a + b;
    }
}

import { Color, Vector3 } from 'three';

export class HSLProperty extends Animatable<Vector3> {
    owner: any;
    name: string;
    constructor(owner: any, name: string) {
        super();
        this.owner = owner;
        this.name = name;
    }

    override lerp_value(r: number, a: Vector3, b: Vector3): Vector3 {

        return a.lerp(b, r);
    }

    override add_value(a: Vector3, b: Vector3): Vector3 {
        return a.add(b);
    }
}
export class ColorProperty extends Animatable<Color> {
    owner: any;
    name: string;
    constructor(owner: any, name: string) {
        super();
        this.owner = owner;
        this.name = name;
    }

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


