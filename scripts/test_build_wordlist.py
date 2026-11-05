"""Tests for build_wordlist.py. Run: python3 -m unittest discover -s scripts -v"""

import json
import unittest

import build_wordlist as b


def fake_segmenter(words):
    # one cell per character is enough for the rules under test, except where a test supplies cells
    table = {'ক্ষমা': ['ক্ষ', 'মা'], 'সূর্য': ['সূ', 'র্য'], 'অ্যাপল': ['অ', '্', 'যা', 'প', 'ল'], 'আদিন্': ['আ', 'দি', 'ন্'],
             'উৎসব': ['উ', 'ৎ', 'স', 'ব'], 'ভা': ['ভা']}
    return {w: table.get(w, list(w)) for w in words}


class KeyAndReject(unittest.TestCase):
    def test_key_normalises(self):
        self.assertEqual(b.key('﻿ ক্‍ষ '), 'ক্ষ')
        self.assertEqual(b.key('য়'), 'য়')  # nukta letters stay decomposed

    def test_reject_reasons(self):
        self.assertEqual(b.reject_reason(''), 'empty')
        self.assertEqual(b.reject_reason('kমা'), 'latin')
        self.assertEqual(b.reject_reason('ক১'), 'digit')
        self.assertEqual(b.reject_reason('ক1'), 'digit')
        self.assertEqual(b.reject_reason('ক মা'), 'whitespace')
        self.assertEqual(b.reject_reason('কম_মা'), 'whitespace')
        self.assertEqual(b.reject_reason('অ্যাড-হক'), 'punctuation')
        self.assertEqual(b.reject_reason('কমা।'), 'punctuation')
        self.assertEqual(b.reject_reason('কমা😀'), 'non_bengali')
        self.assertIsNone(b.reject_reason('ক্ষমা'))

    def test_cell_problem(self):
        self.assertIsNone(b.cell_problem(['ক্ষ', 'মা']))
        self.assertIsNone(b.cell_problem(['উ', 'ৎ', 'স', 'ব']))
        self.assertIsNone(b.cell_problem(['অ', 'ং', 'শ']))
        self.assertIsNone(b.cell_problem(['দু', 'ঃ', 'খ']))
        self.assertEqual(b.cell_problem(['ঁ', 'ক']), 'broken_cell')
        self.assertEqual(b.cell_problem(['অ', '্', 'যা']), 'broken_cell')
        self.assertEqual(b.cell_problem(['আ', 'ন্']), 'trailing_hasanta')


class CleanShipped(unittest.TestCase):
    def test_drops_and_keeps(self):
        raw = ['ক্ষমা', 'ক্ষমা', 'সূর্য', 'ভা', 'অ্যাপল', 'আদিন্', 'অ-ক', 'abc', 'কমকম', 'ধরধর', 'xx', '']
        kept, dropped, examples = b.clean_shipped(
            raw, blocklist={'কমকম'}, variants={'ধরধর': 'ধরধার'}, segmenter=fake_segmenter
        )
        self.assertEqual(sorted(kept), ['ক্ষমা', 'সূর্য'])
        self.assertEqual(
            dict(dropped),
            {'duplicate': 1, 'single_cell': 1, 'broken_cell': 1, 'trailing_hasanta': 1, 'punctuation': 1,
             'latin': 2, 'blocklist': 1, 'bd_variant': 1, 'empty': 1},
        )
        self.assertEqual(examples['blocklist'], ['কমকম'])

    def test_length_limits(self):
        long_word = 'ক' * (b.MAX_CELLS + 1)
        kept, dropped, _ = b.clean_shipped([long_word, 'কক'], set(), {}, fake_segmenter)
        self.assertEqual(list(kept), ['কক'])
        self.assertEqual(dropped['too_long'], 1)

    def test_zwnj_variants_collapse(self):
        # the real segmenter removes ZWJ/ZWNJ; the fake one keeps characters, so feed it clean text
        kept, dropped, _ = b.clean_shipped(['কক‌', 'কক'], set(), {}, lambda ws: {w: list(w) for w in ws})
        self.assertEqual(list(kept), ['কক'])


class Build(unittest.TestCase):
    def test_build_only_sources_never_add_words(self):
        entries, _, _ = b.build(
            ['ক্ষমা', 'সূর্য'],
            hunspell={'ক্ষমা', 'নতুন'}, minhas={'নতুনশব্দ'}, iwn={'সূর্য'},
            subtitles={'ক্ষমা': 100, 'আমি': 1000}, kaikki={'ক্ষমা': []},
            blocklist=set(), variants={}, segmenter=fake_segmenter,
        )
        self.assertEqual([e['w'] for e in entries], ['ক্ষমা', 'সূর্য'])
        by = {e['w']: e for e in entries}
        self.assertEqual(by['ক্ষমা']['src'], ['kawshik', 'hunspell', 'opensubtitles', 'kaikki'])
        self.assertEqual(by['সূর্য']['src'], ['kawshik', 'iwn'])
        self.assertEqual(by['সূর্য']['freq'], 0.0)
        self.assertGreater(by['ক্ষমা']['freq'], 0)
        self.assertEqual(by['ক্ষমা']['cells'], ['ক্ষ', 'মা'])
        self.assertEqual(by['ক্ষমা']['len'], 2)

    def test_entries_are_sorted_by_word(self):
        entries, _, _ = b.build(['কখ', 'অআ', 'গঘ'], set(), set(), set(), {}, {}, set(), {}, lambda ws: {w: list(w) for w in ws})
        self.assertEqual([e['w'] for e in entries], sorted(e['w'] for e in entries))


class Frequency(unittest.TestCase):
    def test_scale(self):
        f = b.scale_frequency({'ক': 1000, 'খ': 10, 'গ': 1})
        self.assertEqual(f['ক'], 1.0)
        self.assertTrue(0 < f['গ'] < f['খ'] < f['ক'] <= 1)
        self.assertEqual(b.scale_frequency({}), {})


class Output(unittest.TestCase):
    entries = [
        {'w': 'কখ', 'cells': ['ক', 'খ'], 'len': 2, 'freq': 0.5, 'src': ['kawshik'], 'tags': []},
        {'w': 'গঘ', 'cells': ['গ', 'ঘ'], 'len': 2, 'freq': 0.0, 'src': ['kawshik', 'iwn'], 'tags': []},
    ]

    def test_render_list_is_valid_json_and_repeatable(self):
        text = b.render_list(self.entries)
        self.assertEqual(text, b.render_list(self.entries))
        data = json.loads(text)
        self.assertEqual(data['count'], 2)
        self.assertEqual(data['words'], self.entries)
        self.assertIn('কখ', text)  # Bengali written as-is, not \u escapes
        self.assertEqual(text.count('\n'), 4)  # one entry per line

    def test_enriched_has_only_listed_words(self):
        out = b.render_enriched(self.entries, {'কখ': [{'pos': 'noun', 'glosses': ['x']}], 'ঙচ': [{'pos': 'noun', 'glosses': ['y']}]})
        rows = [json.loads(l) for l in out.strip().split('\n')]
        self.assertEqual([r['w'] for r in rows], ['কখ'])

    def test_variant_candidates(self):
        es = [
            {'w': 'কি', 'freq': 0.0, 'src': ['kawshik']}, {'w': 'কী', 'freq': 0.0, 'src': ['kawshik']},
            {'w': 'পুর', 'freq': 0.0, 'src': ['kawshik']}, {'w': 'পূর', 'freq': 0.0, 'src': ['kawshik']},
            {'w': 'অন্য', 'freq': 0.0, 'src': ['kawshik']},
        ]
        pairs = b.variant_candidates(es)
        self.assertEqual([(a['w'], c['w']) for a, c in pairs], [('কি', 'কী'), ('পুর', 'পূর')])


class RealSegmenter(unittest.TestCase):
    def test_node_cli(self):
        cells = b.segment_all(['ক্ষমা', 'উৎসব', 'অ্যাপল', 'অসদ্‌বুদ্ধি', 'অংশ', 'দুঃখ', 'চাঁদ'])
        self.assertEqual(cells['অংশ'], ['অ', 'ং', 'শ'])
        self.assertEqual(cells['দুঃখ'], ['দু', 'ঃ', 'খ'])
        self.assertEqual(cells['চাঁদ'], ['চাঁ', 'দ'])
        self.assertEqual(b.segment_all(['অ্যাপল'])['অ্যাপল'], ['অ্যা', 'প', 'ল'])
        self.assertEqual(cells['ক্ষমা'], ['ক্ষ', 'মা'])
        self.assertEqual(cells['উৎসব'], ['উ', 'ৎ', 'স', 'ব'])
        self.assertEqual(cells['অসদ্‌বুদ্ধি'], ['অ', 'স', 'দ্বু', 'দ্ধি'])  # ZWNJ removed from the cell


if __name__ == '__main__':
    unittest.main()
