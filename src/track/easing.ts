export class Easing extends Float64Array {
    constructor(ox: number, oy: number, ix: number, iy: number) {
        super([ox, oy, ix, iy]);
    }

    static sigmoid = new Easing(1 / 3, 0, 1 - 1 / 3, 1);
    static linear = new Easing(0, 0, 1, 1);
    ///
    static inback = new Easing(0.36, 0, 0.66, -0.56);
    static incirc = new Easing(0.55, 0, 1, 0.45);
    static incubic = new Easing(0.32, 0, 0.67, 0);
    static inexpo = new Easing(0.7, 0, 0.84, 0);
    static inoutback = new Easing(0.68, -0.6, 0.32, 1.6);
    static inoutcirc = new Easing(0.85, 0, 0.15, 1);
    static inoutcubic = new Easing(0.65, 0, 0.35, 1);
    static inoutexpo = new Easing(0.87, 0, 0.13, 1);
    static inoutquad = new Easing(0.45, 0, 0.55, 1);
    static inoutquart = new Easing(0.76, 0, 0.24, 1);
    static inoutquint = new Easing(0.83, 0, 0.17, 1);
    static inoutsine = new Easing(0.37, 0, 0.63, 1);
    static inquad = new Easing(0.11, 0, 0.5, 0);
    static inquart = new Easing(0.5, 0, 0.75, 0);
    static inquint = new Easing(0.64, 0, 0.78, 0);
    static insine = new Easing(0.12, 0, 0.39, 0);
    static outback = new Easing(0.34, 1.56, 0.64, 1);
    static outcirc = new Easing(0, 0.55, 0.45, 1);
    static outcubic = new Easing(0.33, 1, 0.68, 1);
    static outexpo = new Easing(0.16, 1, 0.3, 1);
    static outquad = new Easing(0.5, 1, 0.89, 1);
    static outquart = new Easing(0.25, 1, 0.5, 1);
    static outquint = new Easing(0.22, 1, 0.36, 1);
    static outsine = new Easing(0.61, 1, 0.88, 1);
}
