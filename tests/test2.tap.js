"uses strict";
import test from "tap";
import * as m3 from "3motion";
import { ratio_at } from "../dist/keyframe/kfhelper.js";
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
    t.same(tr.frame, (10 + 10) * 2);
    t.same(a.get_value(0), a.get_value(40));
    // console.log(a.value);
    // console.log(cata(a, 0, 51).map((v) => Math.round(v)));
    t.end();
});