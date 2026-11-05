import { describe, expect, it } from 'vitest';
import { phoneticToBengali as p } from '../src/phonetic.ts';
import { segment } from '../src/segment.ts';

describe('phoneticToBengali', () => {
    it.each([
        // vowels: full form at the start or after a vowel, sign after a consonant
        ['amar', 'আমার'],
        ['ami', 'আমি'],
        ['bhai', 'ভাই'],
        ['boi', 'বই'],
        ['bou', 'বউ'],
        ['nodee', 'নদী'],
        ['nodI', 'নদী'],
        ['kul', 'কুল'],
        ['kUl', 'কূল'],
        ['krriShi', 'কৃষি'],
        ['rriShi', 'ঋষি'],
        ['ek', 'এক'],
        ['kOI', 'কৈ'],
        ['bOU', 'বৌ'],
        ['bon', 'বন'],
        ['Ola', 'ওলা'],
        ['tOmar', 'তোমার'],
        ['OIrabot', 'ঐরাবত'],
        // inherent o writes nothing and keeps consonants apart
        ['kolom', 'কলম'],
        ['amora', 'আমরা'],
        // conjuncts, phala and reph by joining
        ['kShoma', 'ক্ষমা'],
        ['strI', 'স্ত্রী'],
        ['ujjbol', 'উজ্জ্বল'],
        ['sondhya', 'সন্ধ্যা'],
        ['byokti', 'ব্যক্তি'],
        ['proshno', 'প্রশ্ন'],
        ['shrabon', 'শ্রাবন'],
        ['shrabaN', 'শ্রাবাণ'],
        ['kormo', 'কর্ম'],
        ['dhormo', 'ধর্ম'],
        ['sUrz', 'সূর্য'],
        ['baxo', 'বাক্স'],
        // marks
        ['bangla', 'বাংলা'],
        ['du:kh', 'দুঃখ'],
        ['ca^d', 'চাঁদ'],
        ['ut``sob', 'উৎসব'],
        ['o,,zaTom', 'অ্যাটম'],
        // nukta letters come out decomposed
        ['baRi', 'বাড়ি'],
        ['aShaRh', 'আষাঢ়'],
        ['naYok', 'নায়ক'],
        ['maya', 'মায়া'],
        // case
        ['Taka', 'টাকা'],
        ['taka', 'তাকা'],
        ['Kolom', 'কলম'],
        ['AMI', 'আমী'], // I has a rule of its own (ঈ), so it is not read as i
        // separator
        ['k`kh', 'কখ'],
    ])('%s → %s', (latin, bengali) => {
        expect(p(latin)).toBe(bengali.normalize('NFC'));
    });

    it('keeps Bengali text and unknown characters as they are', () => {
        expect(p('ক্ষমা')).toBe('ক্ষমা');
        expect(p('আমি ও তুমি')).toBe('আমি ও তুমি');
        expect(p('ক্ষমাa')).toBe('ক্ষমাআ');
        expect(p('12 !?')).toBe('12 !?');
        expect(p('')).toBe('');
    });

    it('feeds the segmenter like typed Bengali does', () => {
        expect(segment(p('kShoma'))).toEqual(['ক্ষ', 'মা']);
        expect(segment(p('sUrz'))).toEqual(['সূ', 'র্য']);
        expect(segment(p('du:kh'))).toEqual(['দু', 'ঃ', 'খ']);
        expect(segment(p('o,,zaTom'))).toEqual(['অ্যা', 'ট', 'ম']);
    });
});
