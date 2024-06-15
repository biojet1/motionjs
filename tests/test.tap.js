"uses strict";
import test from "tap";
import * as m3 from "3motion";
import { cata, catg } from "./utils.js";

test.test("Seq then Par", (t) => {
    const { Seq, Par, Track, To, NumericProperty } = m3;
    let o = { x: 1, y: 2, z: 3 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();

    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Seq([To([a], 9), To([b], 10), To([c], 11)]));

    console.log(a.value);
    t.same(catg(a, 0, 20), "1:3:5:7:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9");
    t.same(catg(b, 0, 20), "2:2:2:2:2:4:6:8:10:10:10:10:10:10:10:10:10:10:10:10");
    t.same(catg(c, 0, 20), "3:3:3:3:3:3:3:3:3:5:7:9:11:11:11:11:11:11:11:11");

    tr.run(Par([To([a], 1), To([b], 1), To([c], 1)]));
    t.same(
        cata(a, 0, 20),
        [1, 3, 5, 7, 9, 9, 9, 9, 9, 9, 9, 9, 9, 7, 5, 3, 1, 1, 1, 1]
    );
    t.same(
        cata(b, 0, 20),
        [2, 2, 2, 2, 2, 4, 6, 8, 10, 10, 10, 10, 10, 7.75, 5.5, 3.25, 1, 1, 1, 1]
    );
    t.same(
        cata(c, 0, 20),
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 7, 9, 11, 8.5, 6, 3.5, 1, 1, 1, 1]
    );

    // console.log(a.value);
    // t.same(a.to_json(), { k: [{ t: 0, v: 1 }, { t: 5, h: true, v: 9 }, { t: 15, v: 9 }, { t: 20, v: 1 }] });
    // t.same(b.to_json(), { k: [{ t: 5, v: 2 }, { t: 10, h: true, v: 8 }, { t: 15, v: 8 }, { t: 20, v: 1 }] });
    // t.same(c.to_json(), { k: [{ t: 10, v: 3 }, { t: 15, v: 7 }, { t: 20, v: 1 }] });

    t.end();
});

test.test("Seq stagger", (t) => {
    const { Track, NumericProperty, Seq, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Seq([To([a], 5), To([b], 6), To([c], 5)], { stagger: 0.25 }));
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(b, 0, 10), [2, 2, 3, 4, 5, 6, 6, 6, 6, 6]);
    t.same(cata(c, 0, 10), [9, 9, 9, 8, 7, 6, 5, 5, 5, 5]);
    t.end();
});

test.test("Seq delay", (t) => {
    const { Track, NumericProperty, Seq, Add } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Seq([Add([a], 4), Add([b], 4), Add([c], -4)], { delay: 0.25 }));
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(b, 0, 14), [2, 2, 2, 2, 2, 2, 3, 4, 5, 6, 6, 6, 6, 6]);
    t.same(
        cata(c, 0, 18),
        [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 5, 5, 5]
    );
    t.end();
});

test.test("ParE", (t) => {
    const { Track, NumericProperty, ParE, Add } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(ParE([Add([a], 4), Add([b], 4, { dur: 2 }), Add([c], -4)]));
    t.equal(tr.frame, 4 + 4);
    t.same(cata(a, 0, 10), [1, 1, 1, 1, 1, 2, 3, 4, 5, 5]);
    t.same(cata(b, 0, 10), [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6]);
    t.same(cata(c, 0, 10), [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 5]);
    t.end();
});

test.test("Par", (t) => {
    const { Track, NumericProperty, Par, Add } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Par([Add([a], 4), Add(b, 4, { dur: 2 }), Add([c], -4)]));
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(b, 0, 10), [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6]);
    t.same(cata(c, 0, 10), [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 5]);
    t.end();
});

test.test("run parallel", (t) => {
    const { Track, NumericProperty, Add } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run([Add(a, 4), Add(b, 4, { dur: 2 }), Add(c, -4)]);
    t.equal(tr.frame, 8);
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(b, 0, 10), [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6]);
    t.same(cata(c, 0, 10), [9, 8, 7, 6, 5, 5, 5, 5, 5, 5]);
    t.end();
});

test.test("run one", (t) => {
    const { Track, NumericProperty, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(To([a], 5));
    t.equal(tr.frame, 4);
    tr.run(To([b], 6));
    t.equal(tr.frame, 8);
    tr.run(To([c], 5));
    t.equal(tr.frame, 12);
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(b, 0, 10), [2, 2, 2, 2, 2, 3, 4, 5, 6, 6]);
    t.same(cata(c, 0, 14), [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 5]);
    t.end();
});

test.test("Pass", (t) => {
    const { Track, NumericProperty, Pass, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(To([a], 5));
    t.equal(tr.frame, 4);
    tr.run(Pass(1));
    t.equal(tr.frame, 8);
    tr.run(To([c], 5));
    t.equal(tr.frame, 12);
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
    t.same(cata(c, 0, 14), [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 5]);
    t.end();
});

test.test("Pass 2", (t) => {
    const { Track, NumericProperty, Pass, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Pass());
    t.equal(tr.frame, 4);
    tr.run(Pass(1));
    t.equal(tr.frame, 8);
    tr.run(To([c], 5));
    t.equal(tr.frame, 12);
    t.same(cata(c, 0, 14), [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 5]);
    t.end();
});

test.test("bounce repeat one", (t) => {
    const { Track, NumericProperty, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(To(a, 5));
    t.equal(tr.frame, 4);
    tr.run(To(b, 6));
    t.equal(tr.frame, 8);
    tr.run(To(c, 5));
    t.equal(tr.frame, 12);
    a.repeat(1, true);
    t.same(a.frame_range(), [0, 9]);
    t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 4, 3, 2, 1, 1]);
    b.repeat(2);
    t.same(b.frame_range(), [4, 14]);
    t.same(cata(b, 0, 16), [2, 2, 2, 2, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 6, 6]);
    c.repeat(2, true);
    t.same(cata(c, 0, 27), [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 6, 7, 8, 9, 8, 7, 6, 5, 6, 7, 8, 9, 9, 9]);
    t.same(c.frame_range(), [8, 25]);
    a.repeat(-1);
    t.same(cata(a, 0, 20), [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5]);
    a.repeat(-1, true);
    t.same(cata(a, 0, 24), [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]);
    t.end();
});

test.test("easing linear", (t) => {
    const { Track, NumericProperty, Easing, To } = m3;
    let o = { x: 1, y: 2, z: 9 };
    let a = new NumericProperty(o, "x");
    let b = new NumericProperty(o, "y");
    let c = new NumericProperty(o, "z");
    let tr = new Track();
    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.easing = Easing.linear;
    tr.run(To([a], 5));
    t.equal(tr.frame, 4);
    tr.run(To([b], 6));
    t.equal(tr.frame, 8);
    tr.run(To([c], 5));
    t.equal(tr.frame, 12);
    // console.log(c.value);
    t.same(cata(a, 0, 10).map(v => Math.round(v * 100)), [100, 200, 300, 400, 500, 500, 500, 500, 500, 500]);
    t.same(cata(b, 0, 10).map(v => Math.round(v * 100)), [200, 200, 200, 200, 200, 300, 400, 500, 600, 600]);
    t.same(cata(c, 0, 14).map(v => Math.round(v * 100)), [900, 900, 900, 900, 900, 900, 900, 900, 900, 800, 700, 600, 500, 500]);
    t.end();
});

test.test("key_value incresing", (t) => {
    const { NumericProperty } = m3;
    let a = new NumericProperty({ x: 5 }, "x");
    a.key_value(0, 6);
    a.key_value(1, 5);
    t.throws(() => {
        a.key_value(0, 8);
        console.log(a.kfs);
    });
    a.key_value(2, 4, { start: 1 });
    t.throws(() => {
        a.key_value(3, 4, { start: 1 });
    });
    t.same(cata(a, 0, 3), [6, 5, 4]);
    a.hold_last_value(7);
    t.same(cata(a, 0, 7), [6, 5, 4, 4, 4, 4, 4]);
    t.end();
});