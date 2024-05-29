export function* getr(p, start, end) {
    for (let i = start; i < end; ++i) {
        yield p.get_value(i);
    }
}
export function cata(p, start, end) {
    return [...getr(p, start, end)];
}
export function catg(p, start, end) {
    return cata(p, start, end).join(":");
}