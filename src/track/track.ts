import { Proxy, Resolver } from "./action.js";
import { Steppable, Stepper } from "./stepper.js";


export class Track implements Steppable {
    frame: number = 0;
    frame_rate: number = 60;
    hint_dur: number = 60; // 1s * frame_rate
    easing?: Iterable<number> | true;
    steppers?: Set<Steppable>;

    supply(up: Steppable) {
        this.steppers?.add(up);
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
        tr.steppers = this.steppers;
        // tr.in_frame = tr.out_frame = this.out_frame;
        return tr;
    }
    pass(sec: number) {
        this.frame += this.to_frame(sec);
        return this;
    }
    stepper(): Stepper {
        const { steppers } = this;
        if (!steppers || steppers.size <= 0) {
            throw Error(`No steppers`);
        }
        let end = -1;
        let start = -1;
        let steps: Stepper[] = [];
        for (const cur of steppers) {
            const up = cur.stepper();
            const { start: S, end: E } = up;
            if (isFinite(E) && E > end) {
                end = E;
            }
            if (isFinite(S) && S < start) {
                start = S;
            }
            steps.push(up);
        }
        return this.check_stepper(Stepper.create((frame: number) => {
            for (const st of steps) {
                const { start: s, end: e } = st;
                if (frame >= s && frame <= e) {
                    st.step(frame);
                }
            }
        }, start, end));
    }
    check_stepper<U>(stepper: Stepper<U>) {
        return stepper;
    }

}

function feed(track: Track, cur: Resolver, frame: number, base_frame: number) {
    const x = cur(frame, base_frame, track.hint_dur);
    const d = x.end - x.start;
    /* c8 ignore start */
    if (d < 0) {
        throw new Error(`Unexpected`);
    }
    /* c8 ignore stop */
    x(track);
    return d;
}
