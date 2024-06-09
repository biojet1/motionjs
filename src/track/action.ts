type EasingT = Iterable<number> | true;
export interface IProperty<V> {
    get_value(time: number): V;
    key_value(
        time: number,
        value: V,
        extra?: {
            start?: number;
            easing?: EasingT;
            add?: boolean;
            curve?: Iterable<number[]>;
        }
    ): any;
    check_value(x: any): V;
    add_value(a: V, b: V): V;
    initial_value(): V;
    hold_last_value(frame: number): any;
}

export interface IAction {
    _start?: number;
    _end?: number;
    ready(parent: IParent): void;
    resolve(frame: number, base_frame: number, hint_dur: number): void;
    get_active_dur(): number;
    run(): void;
}

export interface IParent {
    easing?: EasingT;
    frame_rate: number;
    to_frame(sec: number): number;
    add_prop(prop: IProperty<any>): void;
}
type ParamsT = {
    easing?: EasingT;
    dur?: number;
    curve?: Iterable<number[]>;
};
export class Action implements IAction {
    _start: number = -Infinity;
    _end: number = -Infinity;
    _dur?: number;
    /* c8 ignore start */
    ready(parent: IParent): void {
        throw new Error("Not implemented");
    }
    run(): void {
        throw new Error("Not implemented");
    }
    /* c8 ignore stop */
    resolve(frame: number, base_frame: number, hint_dur: number): void {
        let { _dur } = this;
        if (_dur == undefined) {
            _dur = this._dur = hint_dur;
        }
        this._start = frame;
        this._end = frame + _dur;
    }
    get_active_dur() {
        return this._end - this._start;
    }
}

export abstract class Actions
    extends Array<Action | Actions>
    implements IAction {
    _start: number = -Infinity;
    _end: number = -Infinity;
    _hint_dur?: number;
    _easing?: EasingT;
    _params: {
        easing?: EasingT;
        hint_dur?: number;
    } = {};
    ready(parent: IParent): void {
        const { easing, hint_dur } = this._params;
        this._easing = easing ?? parent.easing;
        hint_dur != undefined && (this._hint_dur = parent.to_frame(hint_dur));
    }
    run() {
        for (const act of this) {
            /* c8 ignore start */
            if (act._start < 0 || act._start > act._end) {
                throw new Error(
                    `Unexpected _start=${act._start} _end=${act._end}`
                );
            }
            /* c8 ignore stop */
            act.run();
        }
    }
    get_active_dur() {
        return this._end - this._start;
    }

    abstract resolve(frame: number, base_frame: number, hint_dur: number): void;
}

export class SeqA extends Actions {
    _delay?: number;
    _stagger?: number;
    _params: Actions["_params"] & { delay?: number; stagger?: number } = {};

    ready(parent: IParent): void {
        super.ready(parent);
        const { delay, stagger } = this._params;
        delay && (this._delay = parent.to_frame(delay));
        stagger && (this._stagger = parent.to_frame(stagger));
        for (const act of this) {
            act.ready(parent);
        }
    }

    resolve(frame: number, base_frame: number, hint_dur: number) {
        const { _delay, _stagger, _hint_dur = hint_dur } = this;
        let e = frame;
        if (_stagger) {
            let s = frame; // starting time
            for (const act of this) {
                act.resolve(s, base_frame, _hint_dur);
                e = act._end;
                s = Math.max(s + _stagger, base_frame); // next start time
            }
        } else if (_delay) {
            let s = frame; // starting time
            for (const act of this) {
                act.resolve(s, base_frame, _hint_dur);
                e = act._end;
                s = Math.max(e + _delay, base_frame); // next start time
            }
        } else {
            for (const act of this) {
                act.resolve(e, base_frame, _hint_dur);
                e = act._end;
            }
        }
        this._start = frame;
        this._end = e;
    }
}

export function Seq(items: Array<Action | Actions>, params?: SeqA['_params']) {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`)
    } else {
        for (const a of items) {
            if (a instanceof Action || a instanceof Actions) {
                continue;
            }
            throw new Error(`Unexpected`);
        }
    }
    const x = new SeqA(...items);
    params && (x._params = params);
    return x;
}

export class ParA extends Actions {
    _tail?: boolean;

    ready(parent: IParent): void {
        super.ready(parent);
        for (const act of this) {
            act.ready(parent);
        }
    }
    resolve(frame: number, base_frame: number, hint_dur_: number): void {
        let { _hint_dur = hint_dur_ } = this;
        let end = frame;

        for (const act of this) {
            act.resolve(frame, base_frame, _hint_dur);
            if (_hint_dur == undefined) {
                _hint_dur = act.get_active_dur();
            } else {
                _hint_dur = Math.max(_hint_dur, act.get_active_dur());
            }
            end = Math.max(end, act._end);
        }
        if (this._tail) {
            for (const act of this) {
                if (act._end != end) {
                    act.resolve(
                        end - act.get_active_dur(),
                        base_frame,
                        _hint_dur
                    );
                }
                /* c8 ignore start */
                if (act._end != end) {
                    throw new Error(
                        `Unexpected act._end=${act._end} end=${end}`
                    );
                }
                /* c8 ignore stop */
            }
        }
        this._start = frame;
        this._end = end;
    }
}

export function Par(items: Array<Action | Actions>, params?: ParA['_params']) {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`)
    } else {
        for (const a of items) {
            if (a instanceof Action || a instanceof Actions) {
                continue;
            }
            throw new Error(`Unexpected`);
        }
    }
    const x = new ParA(...items);
    params && (x._params = params);
    return x;
}

export function ParE(items: Array<Action | Actions>, params?: ParA['_params']) {
    const x = Par(items);
    x._tail = true;
    return x;
}

export class ToA extends Action {
    constructor(props: IProperty<any>[], value: any, params?: ParamsT) {
        super();
        this.ready = function (parent: IParent): void {
            let { dur, easing, curve } = params ?? {};
            this._dur = dur == undefined ? undefined : parent.to_frame(dur);
            easing = easing ?? parent.easing;
            for (const prop of props) {
                parent.add_prop(prop);
            }
            this.run = function (): void {
                const { _start: start, _end } = this;
                let extra: Parameters<IProperty<any>["key_value"]>[2] = {
                    start,
                    easing,
                    curve,
                };
                for (const prop of props) {
                    prop.key_value(_end, value, extra);
                }
            };
        };
    }
}

export class PassA extends Action {
    constructor(dur?: number) {
        super();
        this.ready = function (parent: IParent): void {
            this._dur = dur == undefined ? undefined : parent.to_frame(dur);
            this.run = function (): void { };
        };
    }
}

export class AddA extends Action {
    constructor(props: IProperty<any>[], value: any, params?: ParamsT) {
        super();
        this.ready = function (parent: IParent): void {
            let { dur, easing, curve } = params ?? {};
            this._dur = dur == undefined ? undefined : parent.to_frame(dur);
            easing = easing ?? parent.easing;
            for (const prop of props) {
                parent.add_prop(prop);
            }
            this.run = function (): void {
                const { _start: start, _end } = this;
                let extra: Parameters<IProperty<any>["key_value"]>[2] = {
                    start,
                    easing,
                    curve,
                    add: true,
                };
                for (const prop of props) {
                    prop.key_value(_end, value, extra);
                }
            };
        };
    }
}

function list_props(x: IProperty<any>[] | IProperty<any>) {
    if (Array.isArray(x)) {
        return x;
    } else {
        return [x];
    }
}

export function To(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params?: ParamsT
) {
    return new ToA(list_props(props), value, params);
}

export function Add(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params?: ParamsT
) {
    return new AddA(list_props(props), value, params);
}

export function To2(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params: ParamsT = {}
) {
    const map = new WeakMap<IProperty<any>>();
    const ps = list_props(props);
    for (const p of ps) {
        map.set(p, params)
    }


    return new ToA(list_props(props), value, params);
}

export function Pass(dur?: number) {
    return new PassA(dur);
}
