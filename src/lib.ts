import { Property } from "./properties.js";
import { IProperty } from "./track/action.js";
import { Track } from "./track/track.js";

export * from "./keyframe.js";
export * from "./track/index.js";
export * from "./properties.js";
const { floor } = Math;

export function formatTime(sec: number) {
    if (sec === Infinity) {
        return 'IN:FI:NIT';
    }
    const u = floor(sec * 1000); // miliseconds
    const [h, a] = [floor(u / (3600 * 1000)), u % (3600 * 1000)];
    const [m, b] = [floor(a / (60 * 1000)), a % (60 * 1000)];
    const [s, z] = [floor(b / 1000), b % 1000];
    return (
        `${h > 0 ? `${h > 9 ? '' : '0'}${h}:` : ''}` +
        `${m < 10 ? '0' : ''}${m}:` +
        `${s < 10 ? '0' : ''}${s}` +
        `${z <= 0 ? '' : z < 10 ? '.00' + z : z < 100 ? '.0' + z : ('.' + z).replace(/0+$/, '')}`
    );
}

export function animate({
    fps,
    update,
    start = 0,
    end = Infinity,
    frames = Infinity,
    loop = true,
}: {
    fps: number;
    start: number;
    end: number;
    frames: number;
    loop: boolean;
    update: (frame: number) => void;
}) {
    const mspf = 1000 / fps; // miliseconds per frame
    let frame = start;
    if (frames === Infinity) {
        if (Number.isFinite(end)) {
            frames = end - start + 1;
        }
    }
    function render(currentTime: DOMHighResTimeStamp) {
        const t = performance.now();
        {
            if ((frame * mspf) % 1000 == 0) {
                console.info(`${frame} t=${formatTime(t)} frames=${frames} ${start}-${end}`);
            }
        }
        update(frame);

        if (frames == Infinity) {
            frame = frame + 1;
        } else {
            if (frame >= end) {
                if (loop) {
                    frame = start;
                } else {
                    frame = end - 1;
                }
            } else {
                frame = (frame + 1) % frames;
            }
        }

        const excess = mspf - (performance.now() - t);
        if (excess > 0) {
            setTimeout(() => requestAnimationFrame(render), excess);
        } else {
            requestAnimationFrame(render);
        }
    }
    requestAnimationFrame(render);
}

// pause start end

export class Root {
    frame_rate: number = 60;
    hint_dur: number = 60; // 1s * frame_rate
    easing: Iterable<number> | boolean = false;
    prop_set = new Set<Property<any>>();

    track(frame: number = 0) {
        const tr = new Track();
        tr.frame_rate = this.frame_rate;
        tr.hint_dur = this.hint_dur;
        tr.easing = this.easing;
        tr.frame = frame;
        tr.prop_set = this.prop_set;
        return tr;
    }
    update(frame: number = 0) {
        for (const prop of this.prop_set) {
            prop.update(frame);
        }
    }
    calc_time_range() {
        let max = 0;
        let min = 0;

        for (const prop of this.prop_set) {
            const [S, E] = prop.frame_range();
            if (Number.isFinite(E)) {
                if (E > max) {
                    max = E;
                }
            }
            if (S < min) {
                min = S;
            }
        }

        return [min, max];
    }

    // throw Error(`Unexpected by '${this.constructor.name}'`);
}
