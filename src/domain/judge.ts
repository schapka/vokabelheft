/**
 * Answer checking — ported from the prototype, behaviour unchanged.
 * Any change here changes what counts as "right"; the tests in
 * tests/judge.test.ts pin the behaviour.
 */

export type Verdict = 'yes' | 'close' | 'no'

/** lower-case, letters only, single spaces */
export function clean(text: string): string {
  return text.toLowerCase().replace(/[^a-zäöüß ]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** the cleaned form, plus it without "to" and without a leading article */
function trimForms(cleaned: string): string[] {
  return [
    cleaned,
    cleaned.replace(/\bto\b/g, ' ').replace(/\s+/g, ' ').trim(),
    cleaned.replace(/^(der|die|das|the|a|an)\s+/, ''),
  ]
}

/**
 * Every accepted spelling of an expected answer: the whole thing, with and
 * without bracketed parts, each comma/slash/"or" alternative, and "(= …)" synonyms.
 */
export function variants(answer: string): string[] {
  const forms = [answer, answer.replace(/\([^)]*\)/g, ' '), answer.replace(/[()=]/g, ' ')]
  const collected: string[] = []
  function add(raw: string): void {
    const cleaned = clean(raw)
    if (!cleaned)
      return
    trimForms(cleaned).forEach((form) => {
      if (form)
        collected.push(form)
    })
  }
  forms.forEach((form) => {
    add(form)
    form.split(/[,/;]|\bor\b/).forEach(add)
  })
  ;(answer.match(/\(\s*=[^)]*\)/g) || []).forEach(add)
  return collected.filter((variant, position) => variant && collected.indexOf(variant) === position)
}

/** word-order independent form, ignoring "to" */
export function bagOf(text: string): string {
  return clean(text).split(' ').filter(word => word && word !== 'to').sort().join(' ')
}

/** Levenshtein distance between two strings */
export function levenshtein(left: string, right: string): number {
  const leftLength = left.length
  const rightLength = right.length
  let previousRow: number[] = []
  const currentRow: number[] = []
  for (let column = 0; column <= rightLength; column++) previousRow[column] = column
  for (let row = 1; row <= leftLength; row++) {
    currentRow[0] = row
    for (let column = 1; column <= rightLength; column++) {
      const substitution = previousRow[column - 1]! + (left[row - 1] === right[column - 1] ? 0 : 1)
      currentRow[column] = Math.min(previousRow[column]! + 1, currentRow[column - 1]! + 1, substitution)
    }
    previousRow = currentRow.slice()
  }
  return previousRow[rightLength]!
}

export function judge(typed: string, answer: string): Verdict {
  const cleanedTyped = clean(typed)
  if (!cleanedTyped)
    return 'no'
  const accepted = variants(answer)
  for (const variant of accepted) {
    if (cleanedTyped === variant)
      return 'yes'
  }
  const typedBag = bagOf(cleanedTyped)
  for (const variant of accepted) {
    if (typedBag && typedBag === bagOf(variant))
      return 'yes'
  }
  for (const variant of accepted) {
    if (variant.length < 4)
      continue
    const distance = levenshtein(cleanedTyped, variant)
    if (distance === 1)
      return 'close'
    if (distance === 2 && variant.length >= 9 && cleanedTyped.slice(0, 3) === variant.slice(0, 3))
      return 'close'
  }
  return 'no'
}
