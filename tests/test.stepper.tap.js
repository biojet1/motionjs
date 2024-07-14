import test from "tap";
import * as m3 from "3motion";

class StepList extends m3.Stepper {
    constructor(start, end) {
        const ls = [];
        super((x) => {
            ls.push(x);
            return x;
        }, start, end);
        this.ls = ls;
    }
}
class StepEcho extends m3.Stepper {
    constructor(start, end) {
        super((x) => x, start, end);
    }
}

test.test("StepList", (t) => {
    const s = new StepList(70, 70 + 7);
    s.step(71);
    s.step(72);
    s.step(74);
    t.same(s.ls, [(71), (72), (74)]);
    for (const x of s.iter(7, 9)) {

    }
    t.same(s.ls, [71, 72, 74, 7, 8, 9]);
    t.end();
});

test.test("stepper_repeat_2x", (t) => {
    let s = new StepList(70, 70 + 3);
    for (const x of s.repeat(2).iter(70, 77)) { }
    t.same(s.ls, [70, 71, 72, 73, 70, 71, 72, 73]);
    t.end();
});

test.test("stepper_bounce", (t) => {
    const s = new StepEcho(70, 70 + 3);
    const r = s.bounce(1, false);
    t.same(Array.from(r.iter(70 - 3, 76 + 3)), [73, 72, 71, 70, 71, 72, 73, 72, 71, 70, 71, 72, 73]);
    t.end();
});

test.test("stepper_repeat_2.5x", (t) => {
    const s = new StepEcho(70, 70 + 3);
    t.same([...s.repeat(2.5).iter()], [70, 71, 72, 73, 70, 71, 72, 73, 70, 71]);
    t.end();
});

test.test("stepper_clamp", (t) => {
    const s = new StepEcho(70, 70 + 3);
    t.same([...s.clamp().iter(65, 75)], [70, 70, 70, 70, 70, 70, 71, 72, 73, 73, 73]);
    t.end();
});

test.test("stepper_slice", (t) => {
    let s = new StepEcho(70, 70 + 3);
    t.same([...s.repeat(2).slice(71, 75).iter()], [71, 72, 73, 70, 71]);
    t.end();
});

test.test("stepper_slice", (t) => {
    let s = new StepEcho(70, 70 + 3);
    t.same([...s.start_at(10).iter(10, 13)], [70, 71, 72, 73]);
    t.end();
});