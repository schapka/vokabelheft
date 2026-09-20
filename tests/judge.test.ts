import { describe, expect, it } from 'vitest'
import { bagOf, clean, judge, levenshtein, variants } from '@/domain/judge.ts'
import { spokenForm } from '@/domain/speech.ts'

/**
 * The answer checker is the part that would cost the most if it broke.
 * These cases pin its behaviour; change them only on purpose.
 */

describe('judge', () => {
  describe('against "to have, had"', () => {
    const answer = 'to have, had'

    it.each([
      'to have, had',
      '(to) have, had',
      'to have,had',
      'to have/had',
      'had, to have',
      'have had',
      'to have',
      'had',
      'TO HAVE, HAD',
      '  to have , had  ',
    ])('accepts %j', (typed) => {
      expect(judge(typed, answer)).toBe('yes')
    })

    it('flags a single typo as close', () => {
      expect(judge('to hav, had', answer)).toBe('close')
    })

    it('rejects a different word', () => {
      expect(judge('to be', answer)).toBe('no')
    })

    it('rejects empty input', () => {
      expect(judge('', answer)).toBe('no')
      expect(judge('   ', answer)).toBe('no')
    })
  })

  it('accepts "(= …)" synonyms', () => {
    expect(judge('organise', 'to organize (= organise)')).toBe('yes')
    expect(judge('to organize', 'to organize (= organise)')).toBe('yes')
  })

  it('accepts optional bracketed parts either way', () => {
    expect(judge('to have fun', 'to have (a lot of) fun')).toBe('yes')
    expect(judge('have a lot of fun', 'to have (a lot of) fun')).toBe('yes')
  })

  it('treats a missing letter in a long word as a typo', () => {
    expect(judge('unfortunatly', 'unfortunately')).toBe('close')
  })

  it('does not treat a missing prefix as a typo', () => {
    expect(judge('fortunately', 'unfortunately')).toBe('no')
  })

  it('accepts the "or" form and a dropped article', () => {
    expect(judge('mile', 'a mile or the mile')).toBe('yes')
    expect(judge('airport', 'the airport')).toBe('yes')
  })

  it('does not fuzzy-match very short answers', () => {
    expect(judge('tap', 'tip')).toBe('no')
  })
})

describe('helpers', () => {
  it('clean lowercases and strips punctuation', () => {
    expect(clean('  To   Have, had! ')).toBe('to have had')
  })

  it('variants lists every accepted form once', () => {
    const accepted = variants('to organize (= organise)')
    expect(accepted).toContain('to organize')
    expect(accepted).toContain('organize')
    expect(accepted).toContain('organise')
    expect(new Set(accepted).size).toBe(accepted.length)
  })

  it('bagOf ignores word order and "to"', () => {
    expect(bagOf('had to have')).toBe(bagOf('to have, had'))
  })

  it('levenshtein is the edit distance', () => {
    expect(levenshtein('', 'abc')).toBe(3)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('same', 'same')).toBe(0)
  })
})

describe('spokenForm', () => {
  it('reads synonyms with an English "or" and drops brackets', () => {
    expect(spokenForm('to organize (= organise)')).toBe('to organize or organise')
    expect(spokenForm('to have (a lot of) fun')).toBe('to have a lot of fun')
  })
})
