import { KeyExtra } from "../keyframe/keyframe.js";
import { IProperty, Proxy } from "./action.js";
import { Track } from "./track.js";

class RelOp {
    extra: KeyExtra;
    constructor(extra: KeyExtra) {
        this.extra = extra;
    }
    apply(k: IProperty<any>, e: RelEntry2, i: number, a: RelEntry2[]) {
        throw new Error(`Not implemented`);
    }
}
class RelInit extends RelOp {


    override apply(k: IProperty<any>, e: RelEntry2, i: number, a: RelEntry2[]) {
        k.key_value(e.end, k.initial_value(), this.extra);
    }
}

class RelTo extends RelOp {
    value: any;
    constructor(value: any, extra: KeyExtra) {
        super(extra);
        this.value = value;
    }
    override apply(k: IProperty<any>, e: RelEntry2, i: number, a: RelEntry2[]) {
        let { extra } = this
        if (i == 0 && e.offset > 0) {
            extra = { ...extra, start: e.start }
        }
        k.key_value(e.end, this.value, extra);
    }
}

class RelAdd extends RelTo {
    constructor(value: any, extra: KeyExtra) {
        super(value, extra);
        this.extra.add = true;
    }
}

type RelEntry = {
    props: IProperty<any>[];
    op: RelOp;
};

type RelEntry2 = {
    offset: number;
    end: number;
    start: number;
    op: RelOp;
};

export function Rel(t: string | number): Proxy {
    const map2 = new Map<string | number, RelEntry[]>();
    let cur: RelEntry[] = [];

    function fn(track: Track) {
        let t_max = -Infinity;
        const map = new Map<IProperty<any>, RelEntry2[]>();
        for (const [time, _] of map2.entries()) {
            // console.log('time', time, time.endsWith('%'));
            if (typeof time == "number") {
                if (!Number.isFinite(time)) {
                    throw new Error(`Invalid time: ${time}`);
                } else if (time < 0) {
                    continue;
                } else {
                    t_max = Math.max(t_max, time);
                }
            }
        }
        // console.log("map2", map2);
        if (t_max <= 0) {
            // console.log(map2);
            throw new Error(`Invalid duration: ${t_max}`);
        }
        const frames = track.to_frame(t_max);
        for (const [time, entries] of map2.entries()) {
            let sec: number;
            if (typeof time == "number") {
                if (time < 0) {
                    sec = t_max + time;
                } else {
                    sec = time;
                }
            } else {
                const n = parseFloat(time.slice(0, -1));
                if (n < 0 || n > 100 || !time.endsWith("%")) {
                    throw new Error(`Invalid percent "${time}" (n=${n})`);
                }
                sec = (t_max * n) / 100.0;
            }
            if (sec < 0 || sec > t_max) {
                throw new Error(`Unexpected`);
            }
            const frame = track.to_frame(sec);
            for (const { op, props } of entries) {
                // map

                for (const p of props) {
                    let a: RelEntry2[] | undefined;
                    (a = map.get(p)) ?? map.set(p, (a = []));
                    if (!op.extra.easing) {
                        op.extra.easing = track.easing
                    }

                    a.push({ offset: frame, end: NaN, start: NaN, op });
                }
            }
        }
        for (const [, v] of map.entries()) {
            v.sort((a, b) => a.offset - b.offset);
        }
        // console.log("rel map", map);
        function sup(that: Track) {
            for (const [k, v] of map.entries()) {
                v.forEach((e, i, a) => e.op.apply(k, e, i, a));
                that.supply(k);
            }
        }
        sup.start = -Infinity;
        sup.end = -Infinity;

        return function (frame: number, base_frame: number, hint_dur: number) {
            for (const v of map.values()) {
                for (const e of v) {
                    e.end = frame + e.offset;
                    e.start = frame;
                }
            }
            sup.start = frame;
            sup.end = frame + frames;
            // console.log("rel res", map);
            return sup;
        };
    }
    fn.t = function (t: number) {
        if (t >= 0) {
            this.last_t = t;
        } else {
            throw new Error(`Unexpected t=${t}`);
        }
        const x = map2.get(t);
        x ? (cur = x) : map2.set(t, (cur = []));
        return this;
    };
    fn.d = function (d: number) {
        const t = this.last_t;
        if (isNaN(t)) {
            throw new Error(`set 't' first `);
        } else {
            d = t + d;
        }
        if (d < 0) {
            throw new Error(`d<0`);
        }
        return this.t(d);
    };
    fn.p = function (p: number) {
        const c = p < 0 ? -p : p;
        if (c > 100 || c < 0) {
            throw new Error(`p 0-100`);
        } else if (p < 0) {
            p = 100 + p;
        }
        const k = `${p}%`;
        const x = map2.get(k);
        x ? (cur = x) : map2.set(k, (cur = []));
        return this;
    };
    fn.at = function (o: number | string) {
        if (typeof o == "number") {
            return this.t(o);
        } else if (o.endsWith("%")) {
            return this.p(parseFloat(o.slice(0, -1)));
        } else if (o.startsWith("+") || o.startsWith("-")) {
            return this.d(parseFloat(o));
        } else {
            throw new Error(`Invalid "${o}"`);
        }
    };
    fn.to = function (
        props: IProperty<any>[] | IProperty<any>,
        value: any,
        extra: KeyExtra = {}
    ) {
        cur.push({ props: list_props(props), op: new RelTo(value, extra) });
        return this;
    };
    fn.add = function (
        props: IProperty<any>[] | IProperty<any>,
        value: any,
        extra: KeyExtra = {}
    ) {
        cur.push({ props: list_props(props), op: new RelAdd(value, extra) });
        return this;
    };
    fn.initial = function (
        props: IProperty<any>[] | IProperty<any>,
        extra: KeyExtra = {}
    ) {
        cur.push({ props: list_props(props), op: new RelInit(extra) });
        return this;
    };
    fn.last_t = NaN;
    fn.at(t);
    return fn;
}
function list_props(x: IProperty<any>[] | IProperty<any>) {
    if (Array.isArray(x)) {
        return x;
    } else {
        return [x];
    }
}