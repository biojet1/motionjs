import { Animated, KeyExtra } from "../keyframe/keyframe";
import { Track } from "./track";

type EasingT = Iterable<number> | true;

export type IProperty<V> = Animated<V>;

interface Supplier {
    (that: Track): void;
    start: number;
    end: number;
}
export type Resolver = (
    frame: number,
    base_frame: number,
    hint_dur: number
) => Supplier;
export type ResolverPlus = {
    (frame: number, base_frame: number, hint_dur: number): Supplier;
    next?: ResolverPlus;
    supplier?: Supplier;
};
export type Proxy = (that: Track) => Resolver;

export type ParamsT = {
    easing?: EasingT;
    dur?: number;
    curve?: Iterable<number[]>;
};

type ActionsParams = {
    easing?: EasingT;
    hint_dur?: number;
};

type SeqParams = ActionsParams & { delay?: number; stagger?: number };

export type Params2 = {
    property: IProperty<any>;
    value: any;
    add: boolean;
    extra: KeyExtra;
    _next?: Params2;
};

function list_props(x: IProperty<any>[] | IProperty<any>) {
    if (Array.isArray(x)) {
        return x;
    } else {
        return [x];
    }
}

export function Pass(dur: number = 1): Proxy {
    return function (track: Track) {
        dur = track.to_frame(dur);
        function sup(that: Track) { }
        sup.start = -Infinity;
        sup.end = -Infinity;
        return function (frame: number, base_frame: number, hint_dur: number) {
            sup.start = frame;
            sup.end = frame + dur;
            return sup;
        };
    };
}

export function To(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params?: ParamsT,
    add: boolean = false
): Proxy {
    return function (track: Track) {
        let { dur, ...extra } = params ?? {};
        const m = list_props(props).map(
            (property) => ({ property, value, extra } as Params2)
        );
        m.forEach((e, i, a) => {
            e._next = a.at(i + 1);
        });
        const _first = m.at(0)!;
        let _dur = dur == undefined ? undefined : track.to_frame(dur);
        for (let cur: Params2 | undefined = _first; cur; cur = cur._next) {
            const { property, extra } = cur;
            extra.easing ?? (extra.easing = track.easing);
            extra.add = add;
        }
        function sup(that: Track) {
            const { start, end } = sup;
            for (let cur: Params2 | undefined = _first; cur; cur = cur._next) {
                const { property, extra, value } = cur;
                property.key_value(end, value, { start, ...extra });
                track.supply(property);
            }
        }
        sup.start = -Infinity;
        sup.end = -Infinity;
        return function (frame: number, base_frame: number, hint_dur: number) {
            if (_dur == undefined) {
                _dur = hint_dur;
            }
            sup.start = frame;
            sup.end = frame + _dur;
            return sup;
        };
    };
}
export function Add(
    props: IProperty<any>[] | IProperty<any>,
    value: any,
    params?: ParamsT
): Proxy {
    return To(props, value, params, true);
}

export function llsup(track: Track, items: Array<Proxy>) {
    if (!Array.isArray(items)) {
        throw new Error(`Unexpected`);
    }

    let head: ResolverPlus | undefined = undefined;
    let cur: ResolverPlus | undefined = undefined;
    for (const prox of items) {
        if (typeof prox != "function") {
            throw new Error(`Unexpected`);
        }
        const res: ResolverPlus = prox(track);
        if (cur) {
            cur.next = res;
        } else {
            head = cur = res;
        }
        res.next = undefined;
        cur = res;
    }
    return head;
}

export function Seq(items: Array<Proxy>, params?: SeqParams): Proxy {
    return function (track: Track) {
        const head = llsup(track, items);
        let { easing, hint_dur, delay, stagger } = params ?? {};
        let dur_hint = hint_dur && track.to_frame(hint_dur);
        delay && (delay = track.to_frame(delay));
        stagger && (stagger = track.to_frame(stagger));

        if (!head) {
            throw new Error(`Unexpected`);
        }

        function sup(that: Track) {
            for (let res = head; res; res = res.next) {
                const sup = res.supplier;
                /* c8 ignore start */
                if (!sup) {
                    throw new Error(`Unexpected`);
                } else if (sup.start < 0 || sup.start > sup.end) {
                    throw new Error(`Unexpected start=${sup.start} end=${sup.end}`);
                }
                /* c8 ignore stop */
                sup(that);
            }
        }
        sup.start = -Infinity;
        sup.end = -Infinity;
        return function (frame: number, base_frame: number, hint_dur: number) {
            let e = frame;
            dur_hint && (hint_dur = dur_hint);

            if (stagger) {
                let s = frame; // starting time
                for (let res: ResolverPlus | undefined = head; res; res = res.next) {
                    const sup = res(s, base_frame, hint_dur);
                    e = sup.end;
                    s = Math.max(s + stagger, base_frame); // next start time
                    res.supplier = sup;
                }
            } else if (delay) {
                let s = frame; // starting time
                for (let res: ResolverPlus | undefined = head; res; res = res.next) {
                    const sup = res(s, base_frame, hint_dur);
                    e = sup.end;
                    s = Math.max(e + delay, base_frame); // next start time
                    res.supplier = sup;
                }
            } else {
                for (let res: ResolverPlus | undefined = head; res; res = res.next) {
                    const sup = res(e, base_frame, hint_dur);
                    e = sup.end;
                    res.supplier = sup;
                }
            }
            sup.start = frame;
            sup.end = e;
            return sup;
        };
    };
}

export function ParE(
    items: Array<Proxy>,
    params: ActionsParams & { tail?: boolean } = {}
): Proxy {
    params.tail = true;
    return Par(items, params);
}

export function Par(
    items: Array<Proxy>,
    params: ActionsParams & { tail?: boolean } = {}
): Proxy {
    return function (track: Track) {
        const head = llsup(track, items);
        let { easing, hint_dur, tail } = params;
        const dur_hint = hint_dur && track.to_frame(hint_dur);
        function sup(that: Track) {
            for (let res = head; res; res = res.next) {
                const sup = res.supplier;
                /* c8 ignore start */
                if (!sup) {
                    throw new Error(`Unexpected`);
                } else if (sup.start < 0 || sup.start > sup.end) {
                    throw new Error(`Unexpected start=${sup.start} end=${sup.end}`);
                }
                /* c8 ignore stop */
                sup(that);
            }
        }
        sup.start = -Infinity;
        sup.end = -Infinity;
        return function (frame: number, base_frame: number, hint_dur: number) {
            dur_hint && (hint_dur = dur_hint);
            let end = frame;

            for (let res: ResolverPlus | undefined = head; res; res = res.next) {
                const sup = res(frame, base_frame, hint_dur);
                if (hint_dur == undefined) {
                    hint_dur = sup.end - sup.start;
                } else {
                    hint_dur = Math.max(hint_dur, sup.end - sup.start);
                }
                end = Math.max(end, sup.end);
                res.supplier = sup;
            }
            if (tail) {
                for (let res: ResolverPlus | undefined = head; res; res = res.next) {
                    let sup = res.supplier;
                    if (!sup) {
                        throw new Error(`Unexpected `);
                    } else if (sup.end != end) {
                        sup = res.supplier = res(
                            end - (sup.end - sup.start),
                            base_frame,
                            hint_dur
                        );
                    }
                    /* c8 ignore start */
                    if (sup.end != end) {
                        throw new Error(`Unexpected sup.end=${sup.end} end=${end}`);
                    }
                    /* c8 ignore stop */
                }
            }
            sup.start = frame;
            sup.end = end;
            return sup;
        };
    };
}
