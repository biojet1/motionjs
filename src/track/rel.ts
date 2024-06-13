import { Action, ExtraT, IParent, IProperty, RunGiver } from "./action.js";


type Entry = {
    _offset_sec: number;
    _offset_frames: number;
    end: number;
    value: any;
    extra: ExtraT;
    _: string;
    _next?: Entry;
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
    constructor(parent: IParent, map: Map<IProperty<any>, Entry[]>) {
        super();
        this.map = map;
        for (const v of this.map.values()) {
            for (const e of v) {
                e._offset_frames = parent.to_frame(e._offset_sec);
            }
        }
    }

    override resolve(frame: number, base_frame: number, hint_dur: number): void {
        for (const v of this.map.values()) {
            let prev: Entry | undefined = undefined;
            for (const e of v) {
                e.end = frame + e._offset_frames;
                if (!prev) {
                    if (e._offset_frames > 0) {
                        e.extra.easing = true;
                        e.extra.start = frame;
                    }
                }
                prev = e;
            }
        }
    }
    override run() {
        for (const [k, v] of this.map.entries()) {
            for (const e of v) {
                k.key_value(e.end, e.value, e.extra);
            }
        }
        this.map.clear();
    }
}

export function Rel(t: string | number) {
    return Rel.at(t);
}

Rel.at = function (t: string | number): RunGiver {
    const map2 = new Map<string | number, Entry2[]>();
    let cur: Entry2[];
    map2.set(t, cur = []);
    function fn(track: IParent) {
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
                if (!Number.isFinite(cen)) {
                    throw new Error(`Invalid time %: '${time}'`);
                } else if (cen < 0 || cen > 100) {
                    throw new Error(`Unexpected time % 0-100: '${time}'`);
                } else if (dur == undefined) {
                    throw new Error(`time % needs duration: '${time}'`);
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
                            _offset_sec: sec, _: e._, _offset_frames: NaN, end: NaN, value:
                                p.check_value(e.value), extra: { ...e.extra }
                        })
                    }
                }
            }
        }
        for (const [, v] of map.entries()) {
            v.sort((a, b) => a._offset_sec - b._offset_sec)
        }

        return new RelA(track, map);
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
