"uses strict";
import test from "tap";
import * as m3 from "3motion";

function* getr(p, start, end) {
    for (let i = start; i < end; ++i) {
        yield p.get_value(i);
    }
}
function cata(p, start, end) {
    return [...getr(p, start, end)];
}
// test.test("easing linear", (t) => {
//     const { Track, NumericProperty, Easing, To } = m3;
//     let o = { x: 1, y: 2, z: 9 };
//     let a = new NumericProperty(o, "x");
//     let b = new NumericProperty(o, "y");
//     let c = new NumericProperty(o, "z");
//     let tr = new Track();
//     tr.frame_rate = 4;
//     tr.hint_dur = 4;
//     tr.easing = Easing.sigmoid;
//     tr.feed(To([a], 5));
//     t.equal(tr.frame, 4);
//     tr.feed(To([b], 6));
//     t.equal(tr.frame, 8);
//     tr.feed(To([c], 5));
//     t.equal(tr.frame, 12);
//     console.log(c.value);
//     console.log(b.value);
//     console.log(a.value);
//     t.same(cata(a, 0, 10), [1, 2, 3, 4, 5, 5, 5, 5, 5, 5]);
//     t.same(cata(b, 0, 10), [2, 2, 2, 2, 2, 3, 4, 5, 6, 6]);
//     t.same(cata(c, 0, 14), [9, 9, 9, 9, 9, 9, 9, 9, 9, 8, 7, 6, 5, 5]);
//     t.end();
// });