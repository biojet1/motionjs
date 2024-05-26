"uses strict";
import test from "tap";
import * as m3 from '3motion';


test.test("Seq then Par", (t) => {
    const { Seq, Par, Track, To, NumericProperty } = m3;
    let o = { x: 1, y: 2, z: 3 };
    let a = new NumericProperty(o, 'x');
    let b = new NumericProperty(o, 'y');
    let c = new NumericProperty(o, 'z');
    let tr = new Track();

    tr.frame_rate = 4;
    tr.hint_dur = 4;
    tr.run(Seq(
        To([a], 9),
        To([b], 10),
        To([c], 11),
    ));
    function* getr(p, start, end) {
        for (let i = start; i < end; ++i) {
            yield p.get_value(i);
        }
    }
    function cata(p, start, end) {
        return [...getr(p, start, end)];
    }
    function catg(p, start, end) {
        return cata(p, start, end).join(':');
    }
    console.log(a.value);
    t.same(catg(a, 0, 20), "1:3:5:7:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9");
    t.same(catg(b, 0, 20), "2:2:2:2:2:4:6:8:10:10:10:10:10:10:10:10:10:10:10:10");
    t.same(catg(c, 0, 20), "3:3:3:3:3:3:3:3:3:5:7:9:11:11:11:11:11:11:11:11");


    tr.run(Par(
        To([a], 1),
        To([b], 1),
        To([c], 1),
    ));
    t.same(cata(a, 0, 20), [
        1, 3, 5, 7, 9,
        9, 9, 9, 9, 9, 9, 9,
        9, 7, 5, 3, 1, 1, 1, 1]);
    t.same(cata(b, 0, 20), [
        2, 2, 2, 2, 2, 4, 6, 8, 10,
        10, 10, 10, 10, 7.75, 5.5, 3.25, 1, 1, 1, 1]);
    t.same(cata(c, 0, 20), [
        3, 3, 3, 3, 3, 3, 3, 3, 3,
        5, 7, 9, 11, 8.5, 6, 3.5, 1, 1, 1, 1]);

    // console.log(a.value);
    // t.same(a.to_json(), { k: [{ t: 0, v: 1 }, { t: 5, h: true, v: 9 }, { t: 15, v: 9 }, { t: 20, v: 1 }] });
    // t.same(b.to_json(), { k: [{ t: 5, v: 2 }, { t: 10, h: true, v: 8 }, { t: 15, v: 8 }, { t: 20, v: 1 }] });
    // t.same(c.to_json(), { k: [{ t: 10, v: 3 }, { t: 15, v: 7 }, { t: 20, v: 1 }] });

    t.end();
});