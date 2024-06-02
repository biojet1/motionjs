"uses strict";
import test from "tap";
import * as m3 from "3motion";
import { ratio_at, iter_frame_fun } from "../dist/keyframe/kfhelper.js";
import { cata } from "./utils.js";

test.test("Easing should be symetrical", (t) => {
    const { Easing } = m3;
    function round(x) {
        return Math.round(x * 1e7);
    }
    for (let j = 0; j < 10; j++) {
        let a = Math.random(),
            b = 2 * Math.random() - 0.5,
            c = 1 - a,
            d = 1 - b;
        let easing = new Easing(a, b, c, d);
        var sym = function (x) {
            return 1 - ratio_at(easing, 1 - x);
        };
        for (let i = 0; i <= 100; i++) {
            const r = i / 100;
            t.equal(round(sym(r)), round(ratio_at(easing, r)));
        }
    }
    t.end();
});

test.test("Easing", (t) => {
    const { Track, NumericProperty, Easing, To } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 10;
    tr.easing = Easing.outback;
    tr.feed(To(a, 10000));
    // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    t.same(
        cata(a, 0, 11).map((v) => Math.round(v)),
        [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000]
    );

    t.end();
});

test.test("Step", (t) => {
    const { Track, NumericProperty, Step } = m3;
    let o = { x: 1, y: 2, z: 10 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();

    tr.frame_rate = 4;
    tr.hint_dur = 4;

    tr.step([{ t: 0, a: 10 }, { a: 6 }], { a, b, c });

    t.equal(tr.frame, 4);
    t.same(cata(a, 0, 10), [10, 9, 8, 7, 6, 6, 6, 6, 6, 6]);

    tr.step([{ t: 0, q: Step.initial }, { q: 6 }], { q: [b, c] });

    t.equal(tr.frame, 8);
    t.same(cata(b, 0, 12), [2, 2, 2, 2, 2, 3, 4, 5, 6, 6, 6, 6]);
    t.same(cata(c, 0, 12), [10, 10, 10, 10, 10, 9, 8, 7, 6, 6, 6, 6]);

    tr.step([{ t: 0, a: Step.first }, { a: 2 }], { a });
    t.equal(tr.frame, 12);
    t.same(cata(a, 0, 13), [10, 9, 8, 7, 6, 6, 6, 6, 6, 5, 4, 3, 2]);
    tr.step(
        [
            { t: 0, b: Step.first },
            { dur: 0.5, b: 4 },
        ],
        { b }
    );
    t.equal(tr.frame, 14);
    t.same(cata(b, 0, 15), [2, 2, 2, 2, 2, 3, 4, 5, 6, 6, 6, 6, 6, 5, 4]);
    t.end();
});

test.test("Step Easing", (t) => {
    const { Track, NumericProperty, Easing, Step } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let b = new NumericProperty({ x: 10000 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 10;
    tr.easing = Easing.sigmoid;
    tr.step(
        [
            { dur: 1, a: 10000, ease: Easing.outback, b: 0 },
            { dur: 1, b: 10000, a: Step.add(-10000) },
        ],
        { a, b }
    );
    // // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    t.same(
        cata(a, 0, 11).map((v) => Math.round(v)),
        [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000]
    );
    // console.log(b.value);
    t.same(
        cata(b, 0, 11).map((v) => Math.round(v)),
        [10000, 5961, 2970, 926, -302, -874, -966, -758, -425, -126, 0]
    );
    t.same(
        cata(b, 10, 21).map((v) => Math.round(v)),
        [0, 280, 1040, 2160, 3520, 5000, 6480, 7840, 8960, 9720, 10000]
    );
    t.same(
        cata(a, 10, 21).map((v) => Math.round(v)),
        [10000, 9720, 8960, 7840, 6480, 5000, 3520, 2160, 1040, 280, 0]
    );
    t.end();
});

test.test("Step Easing use track hint_dur", (t) => {
    const { Track, NumericProperty, Easing, Step } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let b = new NumericProperty({ x: 10000 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 10;
    tr.easing = Easing.sigmoid;
    tr.step(
        [
            { t: 0 },
            { a: 10000, ease: Easing.outback, b: 0 },
            { b: 10000, a: Step.add(-10000) },
        ],
        { a, b }
    );
    // // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    t.same(
        cata(a, 0, 11).map((v) => Math.round(v)),
        [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000]
    );

    t.same(
        cata(b, 0, 11).map((v) => Math.round(v)),
        [10000, 5961, 2970, 926, -302, -874, -966, -758, -425, -126, 0]
    );
    t.same(
        cata(b, 10, 21).map((v) => Math.round(v)),
        [0, 280, 1040, 2160, 3520, 5000, 6480, 7840, 8960, 9720, 10000]
    );
    t.same(
        cata(a, 10, 21).map((v) => Math.round(v)),
        [10000, 9720, 8960, 7840, 6480, 5000, 3520, 2160, 1040, 280, 0]
    );
    // console.log(b.value);
    t.end();
});

test.test("Step Easing use step hint_dur", (t) => {
    const { Track, NumericProperty, Easing, Step } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let b = new NumericProperty({ x: 10000 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 5;
    tr.easing = Easing.sigmoid;
    tr.step(
        [
            { t: 0 },
            { a: 10000, ease: Easing.outback, b: 0 },
            { b: 10000, a: Step.add(-10000) },
        ],
        { a, b }, { dur: 1 }
    );
    // // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    t.same(
        cata(a, 0, 11).map((v) => Math.round(v)),
        [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000]
    );

    t.same(
        cata(b, 0, 11).map((v) => Math.round(v)),
        [10000, 5961, 2970, 926, -302, -874, -966, -758, -425, -126, 0]
    );
    t.same(
        cata(b, 10, 21).map((v) => Math.round(v)),
        [0, 280, 1040, 2160, 3520, 5000, 6480, 7840, 8960, 9720, 10000]
    );
    t.same(
        cata(a, 10, 21).map((v) => Math.round(v)),
        [10000, 9720, 8960, 7840, 6480, 5000, 3520, 2160, 1040, 280, 0]
    );
    // console.log(tr.frame);
    t.end();
});

test.test("Step Easing use step max_dur", (t) => {
    const { Track, NumericProperty, Easing, Step } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let b = new NumericProperty({ x: 10000 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 5;
    tr.easing = Easing.sigmoid;
    tr.step(
        [
            { a: 10000, ease: Easing.outback, b: 0, t: -1 },
            { b: 10000, a: Step.add(-10000) },
        ],
        { a, b }, { dur: 1, max_dur: 2 }
    );
    // // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    t.same(
        cata(a, 0, 11).map((v) => Math.round(v)),
        [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000]
    );
    t.same(
        cata(b, 0, 11).map((v) => Math.round(v)),
        [10000, 5961, 2970, 926, -302, -874, -966, -758, -425, -126, 0]
    );
    t.same(
        cata(b, 10, 21).map((v) => Math.round(v)),
        [0, 280, 1040, 2160, 3520, 5000, 6480, 7840, 8960, 9720, 10000]
    );
    t.same(
        cata(a, 10, 21).map((v) => Math.round(v)),
        [10000, 9720, 8960, 7840, 6480, 5000, 3520, 2160, 1040, 280, 0]
    );
    // console.log(tr.frame);
    t.end();
});

test.test("Step Easing bounce", (t) => {
    const { Track, NumericProperty, Easing, Step } = m3;
    let a = new NumericProperty({ x: 0 }, "x");
    let b = new NumericProperty({ x: 10000 }, "x");
    let tr = new Track();
    tr.frame_rate = 10;
    tr.hint_dur = 10;
    tr.easing = Easing.sigmoid;
    tr.step(
        [
            { t: 0 },
            { a: 10000, ease: Easing.outback },
            { a: 20000, ease: Easing.incirc },
        ],
        { a, b }, { bounce: true }
    );
    // // console.log(cata(a, 0, 10).map(v => Math.round(v)));
    // t.same(
    //     cata(a, 0, 21).map((v) => Math.round(v)),
    //     [0, 4039, 7030, 9074, 10302, 10874, 10966, 10758, 10425, 10126, 10000, 10126, 10425, 10758, 10966, 10874, 10302, 9074, 7030, 4039, 0]
    // );

    t.equal(a.get_value(0), 0);
    t.same(tr.frame, (10 + 10) * 2);
    t.same(a.get_value(0), a.get_value(40));
    // console.log(a.value);
    // console.log(cata(a, 0, 51).map((v) => Math.round(v)));
    t.end();
});

test.test("iter_frame_fun", (t) => {
    const o = {}
    let off = iter_frame_fun(4, 4, 3, false, o);
    t.same([off(3), off(4), off(5)], [4, 4, 4]);
    t.same([o._start, o._end], [4, 4]);
    t.throws(() => {
        iter_frame_fun(5, 4, 3, false, o);
    });
    t.throws(() => {
        iter_frame_fun(3, 4, 0, false, o);
    });
    off = iter_frame_fun(4, 7, 1, false, o);
    t.same([off(1), off(2), off(3), off(4), off(5), off(6), off(7), off(8), off(9)], [4, 4, 4, 4, 5, 6, 7, 7, 7]);
    off = iter_frame_fun(9, 11, 2, true, o);
    t.same([off(8), off(9), off(10), off(11), off(12), off(13), off(14), off(15), off(16), off(17), off(18), off(19), off(20)], [9, 9, 10, 11, 10, 9, 10, 11, 10, 9, 17, 17, 17]);
    t.end();
});