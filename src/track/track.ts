import { Updateable, Updater } from "../keyframe/keyframe.js";
import { Proxy, Resolver } from "./action.js";


export class Track implements Updateable {
    frame: number = 0;
    frame_rate: number = 60;
    hint_dur: number = 60; // 1s * frame_rate
    easing?: Iterable<number> | true;
    updates?: Set<Updateable>;

    add_update(up: Updateable) {
        this.updates?.add(up);
    }
    to_frame(sec: number) {
        return Math.round(this.frame_rate * sec);
    }
    set_frame_rate(n_per_sec: number) {
        const { hint_dur, frame_rate } = this;
        this.frame_rate = n_per_sec;
        this.hint_dur = this.to_frame(hint_dur / frame_rate);
        return this;
    }
    set_frame(sec: number) {
        this.frame = this.to_frame(sec);
        return this;
    }
    feed(cur: Resolver) {
        const d = feed(this, cur, this.frame, this.frame);
        this.frame += d;
        return this;
    }

    run(...args: Array<Proxy | Array<Proxy>>) {
        let I = this.frame;
        let B = this.frame;
        for (const act of args) {
            let D = 0;
            if (!Array.isArray(act)) {
                D = feed(this, act(this), I, B);
            } else {
                for (const a of act) {

                    let d = feed(this, a(this), I, B);
                    D = Math.max(d, D);
                }
            }
            I += D;
        }
        this.frame = I;
    }
    track() {
        const tr = new Track();
        tr.frame_rate = this.frame_rate;
        tr.hint_dur = this.hint_dur;
        tr.easing = this.easing;
        tr.frame = this.frame;
        tr.updates = this.updates;
        // tr.in_frame = tr.out_frame = this.out_frame;
        return tr;
    }
    pass(sec: number) {
        this.frame += this.to_frame(sec);
        return this;
    }

    updater(): Updater {
        let ups: Updater[] = [];
        let end = -1;
        let start = -1;
        if ((this.updates?.size ?? 0) <= 0) {
            throw Error(`No updatables`);
        }
        for (const cur of this.updates ?? []) {
            const up = cur.updater();
            const { start: S, end: E } = up;
            if (isFinite(E) && E > end) {
                end = E;
            }
            if (S < start) {
                start = S;
            }
            ups.push(up);
        }
        return {
            start,
            end,
            update(frame: number) {
                // this.start + (frame - _start)
                for (const up of ups) {
                    const { start: s, end: e } = up;
                    if (frame < s || frame >= e) {
                        continue;
                    }
                    up.update(frame);
                }
            },
        };
    }
    // give(): RunGiver {
    //     const self = this;
    //     return (track: Track) => {
    //         let ups: Updater[] = [];
    //         if ((self.updates?.size ?? 0) <= 0) {
    //             throw Error(`No updatables`);
    //         }
    //         let _out = -Infinity;
    //         let _in = -Infinity;
    //         for (const cur of this.updates ?? []) {
    //             const up = cur.updater();
    //             const { start: S, end: E } = up;
    //             if (isFinite(E) && E > _out) {
    //                 _out = E;
    //             }
    //             if (S < _in) {
    //                 _in = S;
    //             }
    //             ups.push(up);
    //         }
    //         if (_out <= _in) {
    //             throw Error(`Unexpected`);
    //         }

    //         return {
    //             _start: -Infinity,
    //             _end: -Infinity,
    //             resolve(frame: number, base_frame: number, hint_dur: number): void {
    //                 this._start = frame;
    //                 this._end = frame + (_out - _in);
    //             },
    //             run(): void {
    //                 const start = this._start;
    //                 const end = this._end;
    //                 if (end <= start) {
    //                     throw Error(`Unexpected`);
    //                 }
    //                 if (_out - _in !== end - start) {
    //                     throw Error(`Unexpected`);
    //                 }
    //                 track.add_update({
    //                     updater() {
    //                         return {
    //                             start,
    //                             end,
    //                             update(frame: number) {
    //                                 const off = _in + (frame - start);
    //                                 for (const up of ups) {
    //                                     const { start: s, end: e } = up;
    //                                     if (e <= s) {
    //                                         throw Error(`Unexpected`);
    //                                     }
    //                                     if (off < s || off >= e) {
    //                                         continue;
    //                                     }
    //                                     up.update(off);
    //                                 }
    //                             },
    //                         };
    //                     },
    //                 });
    //             },
    //             get_active_dur(): number {
    //                 return this._end - this._start;
    //             },
    //         };
    //     };
    // }
}

function feed(track: Track, cur: Resolver, frame: number, base_frame: number) {
    const x = cur(frame, base_frame, track.hint_dur);
    const d = x.end - x.start;
    // cur.resolve(frame, base_frame, track.hint_dur);
    // const d = cur.get_active_dur();
    /* c8 ignore start */
    if (d < 0) {
        throw new Error(`Unexpected`);
    }
    /* c8 ignore stop */
    // cur.run();
    x(track);
    return d;
}
