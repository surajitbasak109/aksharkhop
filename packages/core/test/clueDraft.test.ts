import { describe, expect, it } from 'vitest';
import {
    buildCopyPrompt,
    buildDraftPrompt,
    readPastedReply,
    DraftError,
    draftClues,
    filterDrafts,
    leaksAnswer,
    parseDrafts,
} from '../src/clueDraft.ts';

const reply =
    (text: string, status = 200) =>
    async () => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => ({ content: [{ type: 'text', text }] }),
    });

describe('leaksAnswer', () => {
    it('catches the whole answer and any run of 2+ cells', () => {
        expect(leaksAnswer('ক্ষমা চাওয়া', 'ক্ষমা')).toBe(true);
        expect(leaksAnswer('মাথার ওপরের অংশ', 'মাথা')).toBe(true);
        expect(leaksAnswer('অংশগ্রহণ করা', 'অংশগ্রহণকারী')).toBe(true); // অংশ|গ্র|হ|ণ run
    });
    it('allows a single shared cell and unrelated text', () => {
        expect(leaksAnswer('যে কথা বলে', 'মাথা')).toBe(false);
        expect(leaksAnswer('দেহের উপরিভাগ', 'মাথা')).toBe(false);
    });
});

describe('parseDrafts / filterDrafts', () => {
    it('reads the JSON array even with text around it', () => {
        expect(parseDrafts('Here: ["এক", "দুই"] done')).toEqual(['এক', 'দুই']);
    });
    it('gives [] for anything else', () => {
        expect(parseDrafts('no array')).toEqual([]);
        expect(parseDrafts('[1, 2')).toEqual([]);
    });
    it('drops leaks, empties and repeats, and keeps at most 3', () => {
        const out = filterDrafts(
            ['মাথা ঘামানো', '', 'দেহের উপরিভাগ', 'দেহের উপরিভাগ', 'ক ____', 'খ ____', 'গ ____'],
            'মাথা',
        );
        expect(out).toEqual(['দেহের উপরিভাগ', 'ক ____', 'খ ____']);
    });
});

describe('draftClues', () => {
    it('returns filtered drafts and sends the key only in the header', async () => {
        let seen: { headers: Record<string, string>; body: string } | undefined;
        const out = await draftClues('sk-test', 'মাথা', async (_u, init) => {
            seen = init;
            return reply('["দেহের উপরিভাগ", "মাথা ঘামানো"]')();
        });
        expect(out).toEqual(['দেহের উপরিভাগ']);
        expect(seen?.headers['x-api-key']).toBe('sk-test');
        expect(seen?.body).not.toContain('sk-test');
    });
    it('maps failures to codes without the key', async () => {
        const code = async (f: Parameters<typeof draftClues>[2], key = 'sk-secret') => {
            try {
                await draftClues(key, 'মাথা', f);
            } catch (e) {
                expect(e).toBeInstanceOf(DraftError);
                expect((e as Error).message).not.toContain('sk-secret');
                return (e as DraftError).code;
            }
        };
        expect(await code(reply('', 401))).toBe('bad_key');
        expect(await code(reply('', 429))).toBe('rate_limit');
        expect(await code(reply('', 500))).toBe('server');
        expect(await code(async () => Promise.reject(new Error('sk-secret')))).toBe('network');
        expect(await code(reply('["মাথা"]'))).toBe('no_usable_clue');
        expect(await code(reply('[]'), '  ')).toBe('no_key');
    });
    it('puts the answer in the prompt', () => {
        expect(buildDraftPrompt('ক্ষমা').user).toContain('ক্ষমা');
    });
});

describe('copy and paste mode', () => {
    it('makes one prompt with the answer in it', () => {
        const t = buildCopyPrompt('মাথা');
        expect(t).toContain('মাথা');
        expect(t).toContain('JSON');
    });
    it('reads a JSON reply, also inside a code block', () => {
        expect(readPastedReply('```json\n["দেহের উপরিভাগ", "ক ____"]\n```', 'মাথা')).toEqual([
            'দেহের উপরিভাগ',
            'ক ____',
        ]);
    });
    it('reads a plain list and still drops leaks', () => {
        const reply = '1. দেহের উপরিভাগ\n2) "ক ____"\n- মাথা ঘামানো\n';
        expect(readPastedReply(reply, 'মাথা')).toEqual(['দেহের উপরিভাগ', 'ক ____']);
    });
    it('gives [] for an empty paste', () => {
        expect(readPastedReply('  \n ', 'মাথা')).toEqual([]);
    });
});
