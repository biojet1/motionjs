import { Property } from "./properties.js";
import { IProperty } from "./track/action.js";
import { Track } from "./track/track.js";

export * from "./keyframe.js";
export * from "./track/index.js";
export * from "./properties.js";

export function animate(fps: number, start: number, end: number, update: ((frame: number) => void)) {


    const mspf = 1000 / fps; // miliseconds per frame
    const frames = end - start + 1;
    let frame = start;

    function render(currentTime: DOMHighResTimeStamp) {
        const t = performance.now();
        {
            if (((frame) * mspf) % 1000 == 0) {
                console.info(`${frame} t=${t} frames=${frames} ${start}-${end}`);
            }
        }
        update(frame);
        frame = (frame + 1) % frames;
        const excess = mspf - (performance.now() - t);
        if (excess > 0) {
            setTimeout(() => requestAnimationFrame(render), excess);
        }
        else {
            requestAnimationFrame(render);
        }
    }
    requestAnimationFrame(render);

}

export function animate2({ fps, update, start = 0, end = Infinity, frames = Infinity }: { fps: number, start: number, end: number, frames: number, update: ((frame: number) => void) }) {
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
            if (((frame) * mspf) % 1000 == 0) {
                console.info(`${frame} t=${t} frames=${frames} ${start}-${end}`);
            }
        }
        update(frame);

        if (frames == Infinity) {
            frame = (frame + 1);
        } else {
            frame = (frame + 1) % frames;
        }
        if (frame >= end) {
            frame = end - 1;
        }
        const excess = mspf - (performance.now() - t);
        if (excess > 0) {
            setTimeout(() => requestAnimationFrame(render), excess);
        }
        else {
            requestAnimationFrame(render);
        }
    }
    requestAnimationFrame(render);
}

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
            prop.owner[prop.name] = prop.get_value(frame);
        }
    }

}