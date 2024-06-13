type EasingT = Iterable<number> | true;
export type ExtraT = {
    start?: number;
    easing?: EasingT;
    add?: boolean;
    curve?: Iterable<number[]>;
}
export interface IProperty<V> {
    get_value(time: number): V;
    key_value(
        time: number,
        value: V,
        extra?: ExtraT,
    ): any;
    check_value(x: any): V;
    add_value(a: V, b: V): V;
    initial_value(): V;
    hold_last_value(frame: number): any;
}


export interface Runnable {
    _start: number;
    _end: number;
    // ready(parent: IParent): void;
    resolve(frame: number, base_frame: number, hint_dur: number): void;
    run(): void;
    get_active_dur(): number;
}

export interface IAction extends Runnable {

    // ready(parent: IParent): void;
}

export interface IParent {
    easing?: EasingT;
    frame_rate: number;
    to_frame(sec: number): number;
    add_prop(prop: IProperty<any>): void;
}

export type ParamsT = {
    easing?: EasingT;
    dur?: number;
    curve?: Iterable<number[]>;
};

export type RunGiver = (that: IParent) => Runnable;

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
        this._start = frame;
        this._end = frame + (_dur ?? (this._dur = hint_dur));
    }
    get_active_dur() {
        return this._end - this._start;
    }
}
type ActionsParams = {
    easing?: EasingT;
    hint_dur?: number;
};
export abstract class Actions implements IAction {
    _start: number = -Infinity;
    _end: number = -Infinity;
    _hint_dur?: number;
    _easing?: EasingT;
    _runs: Array<Runnable>;

    constructor(parent: IParent, runs: Runnable[], { easing, hint_dur }: ActionsParams = {}) {
        this._runs = runs;
        easing == undefined || (this._easing = easing);
        hint_dur == undefined || (this._hint_dur = parent.to_frame(hint_dur));
    }

    run() {
        for (const act of this._runs) {
            /* c8 ignore start */
            if (act instanceof Action || act instanceof Actions) {
                if (act._start < 0 || act._start > act._end) {
                    throw new Error(
                        `Unexpected _start=${act._start} _end=${act._end}`
                    );
                }
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

type SeqParams = ActionsParams & { delay?: number; stagger?: number }
export class SeqA extends Actions {
    _delay?: number;
    _stagger?: number;

    constructor(parent: IParent, runs: Runnable[], params: SeqParams = {}) {
        super(parent, runs, params);
        const { delay, stagger } = params;
        delay && (this._delay = parent.to_frame(delay));
        stagger && (this._stagger = parent.to_frame(stagger));
    }

    resolve(frame: number, base_frame: number, hint_dur: number) {
        const { _delay, _stagger, _hint_dur = hint_dur } = this;
        let e = frame;
        if (_stagger) {
            let s = frame; // starting time
            for (const act of this._runs) {
                act.resolve(s, base_frame, _hint_dur);
                e = act._end;
                s = Math.max(s + _stagger, base_frame); // next start time
            }
        } else if (_delay) {
            let s = frame; // starting time
            for (const act of this._runs) {
                act.resolve(s, base_frame, _hint_dur);
                e = act._end;
                s = Math.max(e + _delay, base_frame); // next start time
            }
        } else {
            for (const act of this._runs) {
                act.resolve(e, base_frame, _hint_dur);
                e = act._end;
            }
        }
        this._start = frame;
        this._end = e;
    }
}

export function Seq(items: Array<RunGiver>, params?: SeqParams) {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`)
    } else {
        for (const a of items) {
            if (typeof a == "function") {
                continue;
            }
            throw new Error(`Unexpected`);
        }
    }
    return function (track: IParent) {
        return new SeqA(track, items.map(giver => giver(track)), params);
    }
}

export class ParA extends Actions {
    _tail?: boolean;

    resolve(frame: number, base_frame: number, hint_dur_: number): void {
        let { _hint_dur = hint_dur_ } = this;
        let end = frame;

        for (const act of this._runs) {
            act.resolve(frame, base_frame, _hint_dur);
            if (_hint_dur == undefined) {
                _hint_dur = act.get_active_dur();
            } else {
                _hint_dur = Math.max(_hint_dur, act.get_active_dur());
            }
            end = Math.max(end, act._end);
        }
        if (this._tail) {
            for (const act of this._runs) {
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

export function Par(items: Array<RunGiver>, params?: ActionsParams): RunGiver {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`)
    } else {
        for (const a of items) {
            if (typeof a == "function") {
                continue;
            }
            throw new Error(`Unexpected`);
        }
    }
    return function (track: IParent) {
        return new ParA(track, items.map(giver => giver(track)), params);
    }
}

export function ParE(items: Array<RunGiver>, params?: ActionsParams): RunGiver {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`)
    } else {
        for (const a of items) {
            if (typeof a == "function") {
                continue;
            }
            throw new Error(`Unexpected`);
        }
    }
    return function (track: IParent) {
        const x = new ParA(track, items.map(giver => giver(track)), params);
        x._tail = true;
        return x;
    }
}

export type Params2 = {
    property: IProperty<any>;
    value: any;
    add: boolean;
    extra: ExtraT;
    _next?: Params2
};

export class ToA extends Action {
    _first: Params2;
    constructor(parent: IParent, props: IProperty<any>[] | IProperty<any>, value: any, params?: ParamsT) {
        super();
        let { dur, ...extra } = params ?? {};
        {
            const m = list_props(props).map((property) => ({ property, value, extra } as Params2));
            m.forEach((e, i, a) => {
                e._next = a.at(i + 1);
            });
            this._first = m.at(0)!;
        }
        dur == undefined || (this._dur = parent.to_frame(dur));
        for (let cur: Params2 | undefined = this._first; cur; cur = cur._next) {
            const { property, extra } = cur;
            extra.easing ?? (extra.easing = parent.easing);
            parent.add_prop(property);
        }
    }
    run(): void {
        const { _start: start, _end, _first } = this;
        for (let cur: Params2 | undefined = _first; cur; cur = cur._next) {
            const { property, extra, value } = cur;
            property.key_value(_end, value, { start, ...extra });
        }
    };
}

export class PassA extends Action {
    constructor(parent: IParent, dur?: number) {
        super();
        dur == undefined || (this._dur = parent.to_frame(dur));
    }
    run(): void {

    };
}

export class AddA extends ToA {
    constructor(parent: IParent, props: IProperty<any>[] | IProperty<any>, value: any, params?: ParamsT) {
        super(parent, props, value, params);
        for (let cur: Params2 | undefined = this._first; cur; cur = cur._next) {
            cur.extra.add = true;
        }
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
    params?: ParamsT,
): RunGiver {
    return function (track: IParent) {
        return new ToA(track, props, value, params);
    }
}

export function Add(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params?: ParamsT
): RunGiver {
    return function (track: IParent) {
        return new AddA(track, props, value, params);
    }
}

export function Pass(dur?: number): RunGiver {
    return function (track: IParent) {
        return new PassA(track, dur);
    }
}
