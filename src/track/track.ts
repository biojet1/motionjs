import { Updateable, Updater } from "../keyframe/keyframe.js";
import { IAction, RunGiver } from "./action.js";
import { PropMap, Step, UserEntry } from "./steps.js";

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
        this.hint_dur = this.to_frame(hint_dur / frame_rate)
        return this;
    }
    set_frame(sec: number) {
        this.frame = this.to_frame(sec)
        return this;
    }
    feed(cur: IAction) {
        const d = feed(this, cur, this.frame, this.frame);
        this.frame += d;
        return this;
    }
    step(step: UserEntry[], vars: PropMap, params: any) {
        return this.run(Step(step, vars, params));
    }
    run(...args: Array<RunGiver | Array<RunGiver>>) {
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

        for (const cur of (this.updates ?? [])) {
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
            start, end, update(frame: number) {
                for (const up of ups) {
                    up.update(frame);
                }
            }
        }
    }
}

function feed(track: Track, cur: IAction, frame: number, base_frame: number) {
    // cur.ready(track);
    cur.resolve(frame, base_frame, track.hint_dur);
    const d = cur.get_active_dur();
    /* c8 ignore start */
    if (d < 0) {
        throw new Error(`Unexpected`);
    }
    /* c8 ignore stop */
    cur.run();
    return d;
}