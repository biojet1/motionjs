export class Stepper<V = void> {
    start: number;
    end: number;
    step: ((frame: number) => V);

    constructor(step: (frame: number) => V, start: number, end: number) {
        this.step = step;
        this.start = start;
        this.end = end;
    }

    repeat(count: number) {
        const E = this.end;
        const S = this.start;
        const u = this.step;
        const d = E - S; // duration

        const i = d + 1; // iter duration
        const a = count * i; // active duration
        const Z = S + a - 1; // last frame

        return new Stepper((frame: number) => u(S + ((frame - S) % i)), S, Z);
    }

    bounce(repeat_count: number = 1) {
        const E = this.end;
        const S = this.start;
        const u = this.step;
        const d = E - S; // duration

        const i = (d + 1) * 2 - 1; // iter duration
        const p = i - 1;
        const h = p / 2;
        const a = p * repeat_count;
        const Z = S + a;

        return new Stepper((frame: number) => u(S + (h - Math.abs(((((frame - S) % p) + p) % p) - h))), S, Z);
    }

    clamp() {
        const E = this.end;
        const S = this.start;
        const u = this.step;
        return new Stepper((frame: number) => u((frame <= S) ? S : ((frame >= E) ? E : frame)), S, E);
    }

    slice(start: number, end: number) {
        const { start: S, end: E } = this;
        let e = end ?? E;
        let s = start ?? S;
        if (e < 0) e += E;
        if (s < 0) s += E;
        return new Stepper(this.step, s, e);
    }

    start_at(start: number) {
        const u = this.step;
        const c = this.start;
        const d = this.end;
        return new Stepper(((frame: number) => u(c + (frame - start))), start, start + (d - c));
    }

    remap_range(s?: number, e?: number) {
        const a = this.start;
        const b = this.end;
        const c = s ?? this.start;
        const d = e ?? this.end;
        const u = this.step;
        const da = (b - a);
        const dc = (d - c);
        return new Stepper(((frame: number) => u(c + (frame - a) * dc / da)), a, b);
    }

    stepper() {
        return this;
    }

    *iter(start?: number, end?: number, inc: number = 1) {
        const e = end ?? this.end;
        for (let i = start ?? this.start; i <= e; i += inc) {
            yield this.step(i);
        }
    }

    static create<U>(step: (frame: number) => U, start: number, end: number) {
        return new Stepper<U>(step, start, end);
    }
    static echo(start: number, end: number) {
        return new Stepper((x) => x, start, end);
    }
}

export interface Steppable {
    stepper(): Stepper;
}