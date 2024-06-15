import { Action, ExtraT, IProperty, RunGiver } from "./action.js";
import { Track } from "./track.js";


type Entry = {
    _offset: number;
    end: number;
    value: any;
    extra: ExtraT;
    _: string;
    // _next?: Entry;
};

type Entry2 = {
    props: IProperty<any>[];
    value: any;
    extra: ExtraT;
    _: string;
}

function list_props(x: IProperty<any>[] | IProperty<any>) {
    if (Array.isArray(x)) {
        return x;
    } else {
        return [x];
    }
}

class RelA extends Action {
    map: Map<IProperty<any>, Entry[]>;
    constructor(track: Track, map: Map<IProperty<any>, Entry[]>, dur: number) {
        super();
        this.map = map;
        this._dur = track.to_frame(dur);
        for (const [k, v] of this.map.entries()) {
            track.add_prop(k);
        }
    }

    override resolve(frame: number, base_frame: number, hint_dur: number): void {
        for (const v of this.map.values()) {
            let prev: Entry | undefined = undefined;
            for (const e of v) {
                e.end = frame + e._offset;
                if (!prev) {
                    if (e._offset > 0) {
                        // e.extra.easing = true;
                        e.extra.start = frame;
                    }
                }
                prev = e;
            }
        }
        this._start = frame;
        this._end = frame + (this._dur ?? NaN);

    }
    override run() {
        for (const [k, v] of this.map.entries()) {
            for (const e of v) {
                k.key_value(e.end, e.value, e.extra);
            }
        }
        // this.map.clear();
    }
}

export function Rel(t: string | number): RunGiver {
    const map2 = new Map<string | number, Entry2[]>();
    let cur: Entry2[];
    map2.set(t, cur = []);
    function fn(track: Track) {
        let dur = -Infinity;
        const map = new Map<IProperty<any>, Entry[]>();
        if (dur <= 0) {
            for (const [time, _entries] of map2.entries()) {
                // console.log('time', time, time.endsWith('%'));
                if (typeof time == 'number') {
                    const sec = time;
                    if (!Number.isFinite(sec)) {
                        throw new Error(`Invalid time: ${time}`);
                    } else if (sec < 0) {
                        continue;
                    } else {
                        dur = Math.max(dur, sec);
                    }
                }
            }
            if (dur <= 0) {
                // console.log(map2);
                throw new Error(`Invalid duration: ${dur}`);
            }
        }

        for (const [time, entries] of map2.entries()) {
            let sec;
            if (typeof time == 'string') {
                const cen = parseFloat(time);
                if (cen < 0 || cen > 100) {
                    throw new Error(`Unexpected time % 0-100: '${time}'`);
                }
                sec = dur * cen / 100;
            } else {
                sec = (time);
            }
            if (sec < 0) {
                sec = dur + sec;
            }
            if (sec < 0 || sec > dur) {
                throw new Error(`time '${time}' out of range 0-${dur}`);
            }
            for (const e of entries) {
                if (e._) {
                    for (const p of e.props) {
                        let a: Entry[] | undefined;
                        (a = map.get(p)) ?? map.set(p, a = []);

                        a.push({
                            _: e._, _offset: track.to_frame(sec), end: NaN, value:
                                p.check_value(e.value), extra: { ...e.extra }
                        })
                    }
                }
            }
        }
        for (const [, v] of map.entries()) {
            v.sort((a, b) => a._offset - b._offset)
        }

        return new RelA(track, map, dur);
    }
    fn.at = function (t: string | number) {
        const x = map2.get(t);
        x ? (cur = x) : map2.set(t, (cur = []));
        return this;
    };
    fn.to = function (props: IProperty<any>[] | IProperty<any>, value: any, extra: ExtraT = {}) {
        cur.push({ _: 'to', props: list_props(props), value, extra });
        return this;
    };
    fn.add = function (props: IProperty<any>[] | IProperty<any>, value: any, extra: ExtraT = {}) {
        cur.push({ _: 'add', props: list_props(props), value, extra: { ...extra, add: true } });
        return this;
    };
    return fn;
}
