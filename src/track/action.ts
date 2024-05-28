export interface IProperty<V> {
    get_value(time: number): V;
    key_value(
        time: number,
        value: V,
        start?: number,
        easing?: Iterable<number> | boolean,
        add?: boolean
    ): any;
    check_value(x: any): V;
    add_value(a: V, b: V): V;
    initial_value(): V;
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
    easing?: Iterable<number> | boolean;
    frame_rate: number;
    to_frame(sec: number): number;
    add_prop(prop: IProperty<any>): void;
}

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
        const dur = this._dur ?? hint_dur;
        this._start = frame;
        this._end = frame + dur;
    }
    get_active_dur() {
        return this._end - this._start;
    }
}

export abstract class Actions extends Array<Action | Actions> implements IAction {
    _start: number = -Infinity;
    _end: number = -Infinity;
    _hint_dur?: number;
    _easing?: Iterable<number> | boolean;
    ready(parent: IParent): void {
        this._easing = this._easing ?? parent.easing;
        if (this._hint_dur != undefined) {
            this._hint_dur = parent.to_frame(this._hint_dur);
        }
    }
    run() {
        for (const act of this) {
            /* c8 ignore start */
            if (act._start < 0 || act._start > act._end) {
                throw new Error(`Unexpected _start=${act._start} _end=${act._end}`);
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
    _delay_sec?: number;
    _stagger_sec?: number;
    ready(parent: IParent): void {
        super.ready(parent);
        const { _delay_sec, _stagger_sec } = this;
        _delay_sec && (this._delay = parent.to_frame(_delay_sec));
        _stagger_sec && (this._stagger = parent.to_frame(_stagger_sec));
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
    delay(sec: number) {
        this._delay_sec = sec;
        return this;
    }
    stagger(sec: number) {
        this._stagger_sec = sec;
        return this;
    }
}

export function Seq(...items: Array<Action | Actions>) {
    const x = new SeqA(...items);
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
                    act.resolve(end - act.get_active_dur(), base_frame, _hint_dur);
                }
                if (act._end != end) {
                    throw new Error(`Unexpected act._end=${act._end} end=${end}`);
                }
            }
        }
        this._start = frame;
        this._end = end;
    }
}
export function Par(...items: Array<Action | Actions>) {
    const x = new ParA(...items);
    return x;
}
export function ParE(...items: Array<Action | Actions>) {
    const x = new ParA(...items);
    x._tail = true;
    return x;
}
export class ToA extends Action {
    _easing?: Iterable<number> | boolean;
    constructor(props: IProperty<any>[], value: any, dur?: number) {
        super();
        this.ready = function (parent: IParent): void {
            const { _easing } = this;
            this._dur = (dur == undefined) ? undefined : parent.to_frame(dur);
            if (!_easing) {
                this._easing = parent.easing;
            }
            for (const prop of props) {
                parent.add_prop(prop);
            }
        };
        this.run = function (): void {
            const { _start, _end } = this;
            for (const prop of props) {
                prop.key_value(_end, value, _start);
            }
        };
    }
}
export class AddA extends Action {
    _easing?: Iterable<number> | boolean;
    constructor(props: IProperty<any>[], value: any, dur?: number) {
        super();
        this.ready = function (parent: IParent): void {
            const { _easing } = this;
            this._dur = (dur == undefined) ? undefined : parent.to_frame(dur);
            if (!_easing) {
                this._easing = parent.easing;
            }
            for (const prop of props) {
                parent.add_prop(prop);
            }
        };
        this.run = function (): void {
            const { _start, _end, _easing } = this;
            for (const prop of props) {
                prop.key_value(_end, value, _start, _easing, true);
            }
        };
    }
}

export function To(props: IProperty<any>[], value: any, dur: number = 1) {
    return new ToA(props, value, dur);
}


export function Add(props: IProperty<any>[], value: any, dur: number = 1) {
    return new AddA(props, value, dur);
}