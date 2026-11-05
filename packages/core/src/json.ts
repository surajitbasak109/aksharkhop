// Pretty JSON with a fixed layout: 4-space indent, Bengali written as-is, and arrays or objects that
// hold only plain values kept on one line (so a grid row reads as one line). The output depends only
// on the value, which keeps export → import → export byte-identical.

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const isFlat = (v: Json): boolean =>
    Array.isArray(v)
        ? v.every((x) => x === null || typeof x !== 'object')
        : v !== null && typeof v === 'object'
          ? isFlatObject(v)
          : true;

function isFlatObject(v: Json): boolean {
    if (v === null || typeof v !== 'object') return true;
    if (Array.isArray(v)) return false;
    return Object.values(v).every((x) => x === null || typeof x !== 'object');
}

function inline(v: Json): string {
    if (Array.isArray(v)) return `[${v.map(inline).join(', ')}]`;
    if (v !== null && typeof v === 'object') {
        return `{${Object.entries(v)
            .map(([k, x]) => `${JSON.stringify(k)}: ${inline(x)}`)
            .join(', ')}}`;
    }
    return JSON.stringify(v);
}

export function formatJson(value: unknown, indent = '    '): string {
    const walk = (v: Json, pad: string): string => {
        if (v === null || typeof v !== 'object') return JSON.stringify(v);
        const inner = pad + indent;
        if (Array.isArray(v)) {
            if (v.length === 0) return '[]';
            if (v.every((x) => x === null || typeof x !== 'object')) return inline(v);
            return `[\n${v.map((x) => inner + (isFlat(x) ? inline(x) : walk(x, inner))).join(',\n')}\n${pad}]`;
        }
        const entries = Object.entries(v);
        if (entries.length === 0) return '{}';
        return `{\n${entries
            .map(([k, x]) => `${inner}${JSON.stringify(k)}: ${isFlat(x) ? inline(x) : walk(x, inner)}`)
            .join(',\n')}\n${pad}}`;
    };
    return walk(value as Json, '') + '\n';
}
