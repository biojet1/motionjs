import { Action, IProperty, IParent } from "./action.js";

export interface Entry {
    t: number; // offset in seconds
    ease?: Iterable<number> | true;
    curve?: Array<number[]>;
    [key: string]: any;
}

export interface UserEntry {
    dur?: number;
    t?: number; // offset in seconds
    ease?: Iterable<number> | true;
    [key: string]: any;
}

export interface PropMap {
    [key: string]: IProperty<any> | Array<IProperty<any>>;
}

interface KF {
    t: number;
    value: any;
    ease?: Iterable<number> | true;
    curve?: Array<number[]>,
}

interface KFMap {
    [key: string]: KF[];
}

interface Params {
    dur?: number;
    easing?: Iterable<number> | true;
    bounce?: boolean;
    repeat?: number;
    max_dur?: number;
}
// const FIRST = {};
const LAST = {};

class Stepper {
    do<V>(
        step: StepA,
        prop: IProperty<V>,
        frame: number,
        easing?: Iterable<number> | true
    ): V {
        throw new Error(`Unexpected by '${this.constructor.name}'`);
    }
}

class Add extends Stepper {
    value: any;
    constructor(value: any) {
        super();
        this.value = value;
    }
    do<V>(
        step: StepA,
        prop: IProperty<V>,
        frame: number,
        easing?: Iterable<number> | true
    ): V {
        const v = prop.check_value(this.value);
        const p = prop.get_value(step._prev_frame ?? NaN);
        return prop.add_value(p, v);
    }
}

class Inital extends Stepper {
    do<V>(
        step: StepA,
        prop: IProperty<V>,
        frame: number,
        easing?: Iterable<number> | true
    ): V {
        return prop.initial_value();
    }
}
class First extends Stepper {
    do<V>(
        step: StepA,
        prop: IProperty<V>,
        frame: number,
        easing?: Iterable<number> | true
    ): V {
        return prop.get_value(step._start);
    }
}
class Last extends Stepper {
    do<V>(
        step: StepA,
        prop: IProperty<V>,
        frame: number,
        easing?: Iterable<number> | true
    ): V {
        const { _prev_value } = step;
        if (_prev_value == undefined) {
            throw new Error(`Unexpected`);
        }
        return _prev_value;
    }
}
class Hold extends Stepper {
}


export class StepA extends Action {
    _steps: Array<UserEntry>;
    _max_dur?: number;
    _easing?: Iterable<number> | true;
    _bounce?: boolean;
    _repeat?: number;
    _base_frame: number;
    _vars: PropMap;
    _kf_map?: KFMap;
    constructor(
        steps: Array<UserEntry>,
        vars: PropMap,
        { dur, easing, bounce, repeat, max_dur }: Params
    ) {
        super();
        this._steps = steps;
        this._vars = vars;
        this._base_frame = Infinity;
        this.ready = function (parent: IParent): void {
            this._dur = dur == undefined ? undefined : parent.to_frame(dur);
            this._max_dur =
                max_dur == undefined ? undefined : parent.to_frame(max_dur);
            if (repeat) {
                this._repeat = repeat;
            }
            if (bounce) {
                this._bounce = bounce;
            }
            easing = this._easing ?? easing ?? parent.easing;

            // collect names, parse inputs
            const names: Array<string> = [];
            this._steps.map((e, i, a) => {
                if (easing != undefined) {
                    if (e.ease == undefined) {
                        e.ease = easing;
                    }
                }
                for (const [k, v] of Object.entries(e)) {
                    switch (k) {
                        case "dur":
                        case "t":
                            e[k] = parent.to_frame(v);
                            continue;
                        case "ease":
                        case "curve":
                            // v == undefined || (e[k] = easing);
                            continue;
                    }
                    if (vars[k]) {
                        names.push(k);
                    } else {
                        delete e[k];
                    }
                }
            });
            // drop property not present
            for (const [k, prop] of Object.entries(this._vars)) {
                if (names.indexOf(k) < 0) {
                    delete vars[k];
                } else {
                    if (Array.isArray(prop)) {
                        for (const x of prop) {
                            parent.add_prop(x);
                        }
                    } else {
                        parent.add_prop(prop);
                    }
                }
            }
            // console.log("vars", vars, this._vars);
        };
    }
    resolve(frame: number, base_frame: number, hint_dur: number): void {
        const {
            _steps: steps,
            _kf_map,
            _dur = hint_dur,
            _max_dur = hint_dur,
            _vars,
        } = this;
        if (_kf_map != undefined) {
            if (this._start != frame) {
                const d = this._end - this._start;
                this._start = frame;
                this._end = frame + d;
            }
            return;
        }
        let entries = resolve_t(steps, _vars, _dur, _max_dur);
        if (this._bounce) {
            entries = resolve_bounce(entries);
        }
        if (this._repeat) {
            entries = resolve_repeat(entries, this._repeat);
        }

        let t_max = 0;
        for (const e of entries) {
            t_max = Math.max(t_max, e.t);
        }
        // (this as any)._entries = Array.from(entries);
        this._kf_map = map_keyframes(entries);
        this._start = frame;
        this._end = frame + t_max;
        this._base_frame = base_frame;
    }
    _prev_frame?: number;
    _prev_value?: any;
    run(): void {
        const { _start, _vars, _kf_map, _base_frame } = this;
        for (const [name, entries] of Object.entries(_kf_map!)) {
            for (const prop of enum_props(_vars, name)) {
                this._prev_frame = _start;
                this._prev_value = undefined;
                for (const { t, value, ease, curve } of entries) {
                    const frame = _start + t;
                    let v;

                    if (value instanceof Stepper) {
                        v = value.do(this, prop, frame);
                        if (value instanceof Hold) {

                        }
                    } else {
                        v = prop.check_value(value);
                    }
                    prop.key_value(frame, v, { start: this._prev_frame, easing: ease, curve });
                    this._prev_frame = frame;
                    this._prev_value = v;
                }
            }
        }
    }
}

function resolve_t(
    steps: Array<UserEntry>,
    vars: { [key: string]: IProperty<any> | IProperty<any>[] },
    hint_dur?: number,
    max_dur?: number
) {
    const entries = new Array<Entry>();
    const names = Object.keys(vars);
    steps.forEach((e, i, a) => {
        let t_max: number | undefined = undefined;
        if (e.t == undefined) {
            const { dur } = e;
            if (dur == undefined) {
                if (i == 0) {
                    e.t = 0;
                } else {
                    const prev = steps[i - 1];
                    if (!(i > 0 && prev.t != undefined)) {
                        throw new Error(`Unexpected`);
                    } else if (hint_dur == undefined) {
                        throw new Error(`for no "t" and no "dur" provide hint duration'`);
                    }
                    e.t = prev.t + hint_dur;
                }
            } else if (i > 0) {
                if (dur >= 0) {
                    e.t = dur + steps[i - 1].t!;
                } else {
                    throw new Error(`Unexpected`);
                }
            } else {
                if (i === 0 || dur >= 0) {
                    e.t = dur;
                } else {
                    throw new Error(`Unexpected`);
                }
            }
        }
        if (e.t < 0) {
            if (t_max == undefined) {
                if (max_dur == undefined) {
                    throw new Error(`for negative "t" provide max duration`);
                }
                t_max = max_dur;
            }
            e.t = t_max + e.t;
        }
        const { t } = e;
        if (t_max != undefined) {
            if (t > t_max) {
                throw new Error(`"t" is > max duration`);
            }
        }
        if (t < 0) {
            throw new Error(`"t" is negative`);
        } else if (t > 0) {
            if (i == 0) {
                // first item is not t=0
                const first: Entry = { t: 0 };
                for (const [n, _] of Object.entries(vars)) {
                    first[n] = Step.first;
                }
                entries.push(first);
            }
        } else {
            if (!(i === 0 && t == 0)) {
                throw new Error(`Unexpected`);
            }
            for (const [k, _] of Object.entries(vars)) {
                if (Object.hasOwn(e, k)) {
                    if (e[k] == null) {
                        throw new Error(`Unexpected`);
                    }
                } else {
                    e[k] = Step.first;
                }
            }
        }

        entries.push(e as Entry);
    });

    return entries;
}

function resolve_bounce(steps: Array<Entry>): Array<Entry> {
    let t_max = 0;
    for (const e of steps) {
        t_max = Math.max(t_max, e.t);
    }
    let extra: Array<Entry> = [];
    for (const { t, ease, ...vars } of steps) {
        if (t < t_max) {
            const e: Entry = { ...vars, t: t_max + (t_max - t) };
            extra.push(e);
        } else {
            if (t != t_max) {
                throw new Error(`e.t=${t}, t_max=${t_max}`);
            }
        }
    }
    for (let n = extra.length, j = 0; n-- > 0;) {
        const e = extra[n];
        const { ease } = steps[j++];
        if (ease != undefined) {
            if (ease && ease !== true) {
                const [ox, oy, ix, iy] = ease;
                e.ease = [1 - ix, 1 - iy, 1 - ox, 1 - oy];
            } else {
                e.ease = ease;
            }
        }
    }
    return steps.concat(extra);
}

function resolve_repeat(steps: Array<Entry>, repeat: number): Array<Entry> {
    let t_max = 0;
    for (const { t } of steps) {
        t_max = Math.max(t_max, t);
    }
    let extra: Array<Entry> = [];
    let n = repeat;
    const t_dur = t_max + 1;
    let u = t_dur;
    while (n-- > 0) {
        steps.forEach(({ t, ...etc }, i, a) => {
            const e = { ...etc, t: t + u };
            if (i == 0) {
                e.ease = true;
            }
            extra.push(e);
        });
        u += t_dur;
    }
    return steps.concat(extra);
}

function map_keyframes(steps: Array<Entry>): KFMap {
    const entry_map: { [key: string]: Array<Entry> } = {};
    for (const e of steps) {
        for (const [k, _] of Object.entries(e)) {
            switch (k) {
                case "dur":
                case "t":
                case "ease":
                case "curve":
                    continue;
            }
            if (!k) {
                throw new Error(`Unexpected key ${k} in steps ${steps}`);
            }
            let a = entry_map[k];
            if (!a) {
                a = entry_map[k] = [];
            }
            a.push(e);
        }
    }
    const kf_map: KFMap = {};
    for (const [name, entries] of Object.entries(entry_map)) {
        const x = entries
            .map((v, i, a) => {
                return { t: v.t, value: v[name], ease: v.ease, curve: v.curve };
            })
            .sort((a, b) => a.t - b.t);
        if (x[0].t != 0) {
            // console.log(name, entries);
            throw new Error(`No t=0 t:${x[0].t} t:${x[0].value}`);
        }
        kf_map[name] = x;
    }
    return kf_map;
}

function* enum_props(vars: PropMap, name: string) {
    const x = vars[name];
    if (x) {
        if (Array.isArray(x)) {
            yield* x;
        } else {
            yield x;
        }
    }
}

export function Step(
    steps: Array<UserEntry>,
    vars: PropMap,
    params: Params = {}
) {
    return new StepA(steps, vars, params);
}

Step.add = (value: any) => new Add(value);
Step.initial = new Inital();
Step.first = new First();
Step.last = new Last();
// Step.first = FIRST;
