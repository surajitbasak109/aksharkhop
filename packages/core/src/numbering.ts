// Crossword numbering. Port of pataparbon app/Services/Crossword/CrosswordNumberer.php.
// Keep identical to it: Pataparbon checks imported clue numbers against its own numberer.
//
// Scans row by row; a white cell takes the next number if it starts an across entry (left is an edge
// or block, right is white) or a down entry (top is an edge or block, below is white). Entries are at
// least 2 cells long.

export interface Entry {
    n: number;
    r: number;
    c: number;
    len: number;
}

export interface Numbering {
    /** Same shape as the grid; the clue number of each cell, or null. */
    numbers: (number | null)[][];
    across: Entry[];
    down: Entry[];
}

/** `blocks[r][c]` is true for a black square. Rows may differ in length, as in the PHP original. */
export function numberGrid(blocks: readonly (readonly boolean[])[]): Numbering {
    const white = (r: number, c: number): boolean => {
        const row = blocks[r];
        return row !== undefined && c >= 0 && c < row.length && row[c] === false;
    };

    const numbers: (number | null)[][] = [];
    const across: Entry[] = [];
    const down: Entry[] = [];
    let next = 1;

    blocks.forEach((row, r) => {
        const out: (number | null)[] = [];
        numbers.push(out);

        row.forEach((_, c) => {
            out.push(null);
            if (!white(r, c)) return;

            const startsAcross = !white(r, c - 1) && white(r, c + 1);
            const startsDown = !white(r - 1, c) && white(r + 1, c);
            if (!startsAcross && !startsDown) return;

            const n = next++;
            out[c] = n;

            if (startsAcross) {
                let len = 0;
                while (white(r, c + len)) len++;
                across.push({ n, r, c, len });
            }
            if (startsDown) {
                let len = 0;
                while (white(r + len, c)) len++;
                down.push({ n, r, c, len });
            }
        });
    });

    return { numbers, across, down };
}
