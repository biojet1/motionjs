import { Track } from "./track/track.js";

export * from "./keyframe.js";
export * from "./track/index.js";

export function animate(fps: number, start: number, end: number, update: ((frame: number) => void)) {


    const mspf = 1000 / fps; // miliseconds per frame
    const frames = end - start + 1;
    let frame = start;

    function render(currentTime: DOMHighResTimeStamp) {
        const t = performance.now();
        {
            if (((frame + 1) * mspf) % 1000 == 0) {
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

export class Root {
    frame_rate: number = 60;
    hint_dur: number = 60; // 1s * frame_rate
    easing: Iterable<number> | boolean = false;

    track(frame: number = 0) {
        const tr = new Track();
        tr.frame_rate = this.frame_rate;
        tr.hint_dur = 1 * this.hint_dur;
        tr.easing = this.easing;
        tr.frame = frame;
        return tr;
    }
}