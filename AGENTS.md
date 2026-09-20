# Vokabelheft

Vocabulary trainer for a child (11, English). Vue 3 + Vite + TypeScript + Tailwind, deployed to GitHub Pages.
UI language is German; code, comments, commit messages and docs are English.

## Content sessions: adding a lesson from a photo

This is what sessions started from the Claude app do. Scope: **only `data/lessons/`**.
No `src/`, no configs, no workflows, no other files — a pull request that touches
anything else is rejected by CI.

The user sends one or more photos of a vocabulary page from the school book —
usually nothing else. Everything the file needs (id, file name, school year) is
produced by `pnpm new-lesson`; the user does not have to know any convention.
The work has three phases. **Nothing is written to the repository before the
user has approved the transcription in phase 2.**

### Phase 1 — Transcribe

1. Read every entry on the page in the order of the book. Produce one
   `["deutsch", "fremdsprache"]` pair per entry following the data contract below.
2. Fix obvious transcription slips silently: a dropped letter, a wrong umlaut,
   spacing, a comma the book clearly has. Never "improve" wording and never
   invent a word you cannot see.
3. Note everything you are not sure about: entries you could not read, entries
   that are readable but look wrong (translation does not fit). If a whole
   region is unreadable (glare, blur, cut off), you will ask for a better photo
   of that part rather than guess.
4. Derive the metadata:
   - **title** — what the book calls the list, e.g. `Vokabelliste 1.3` or
     `Unit 2, Station 1`. If the page shows no name, propose one from the unit
     heading and say so.
   - **language** — the language being learned, as BCP-47 with region:
     `en-GB` for an English book (British school English), `fr-FR`, `es-ES`.
     Only ask if the page does not make it obvious.
5. Propose portion sizes following the rule below.

### Portion sizes (`groups`)

A portion is what the child practises in one sitting. Default rule — the user
may override it in the review, and their choice wins:

1. **Count the words** `n`. Number of portions `k = ceil(n / 16)`, at least 1 —
   as few portions as possible without exceeding 16.
2. **Split as evenly as possible**: sizes differ by at most one, larger portions
   first. `n = 48 → [16, 16, 16]`; `n = 43 → [15, 14, 14]`; `n = 20 → [10, 10]`;
   `n = 14 → [14]`.
3. **Prefer the book's own boundaries** when the page has visible sub-sections
   (headings, rules, a gap), as long as every resulting portion has 8–16 words.
   A sub-section longer than 16 is split evenly (rule 2); shorter than 8 is
   joined with its neighbour.
4. Words stay in book order — portions are consecutive ranges, never a
   reshuffle.

Present the result as ranges in phase 2. If the user asks for a different
split (more, fewer, or uneven portions), use theirs without arguing.
`pnpm validate` warns when a portion is outside 8–16; a warning on a split the
user chose is fine.

### Phase 2 — Review with the user (mandatory stop)

Present, in one message:

- the **complete** transcription as a numbered table `# | Deutsch | <Sprache>`,
  every entry, no "…"; mark uncertain entries with `?` and say what you think
  they are
- the questions from phase 1 — or "Keine offenen Fragen."
- the proposed portions as ranges, e.g. `1–14, 15–27`
- the title and language you will use

Then **wait**. Apply the user's corrections, show the changed rows again, and
repeat until the user explicitly approves (e.g. "ok", "passt", "go"). Do not
treat silence, a question, or a partial answer as approval. Do not write files,
branches or commits before that approval.

### Phase 3 — Publish

Enter this phase only when both hold: the user has approved the transcription
(phase 2) **and** validation passes (step 3 below). No pull request before that.

1. Create the file: `pnpm new-lesson --title "<title>" --language <tag>`
   (or `node scripts/new-lesson.ts …` if pnpm is unavailable). It prints the
   path of the new file, e.g. `data/lessons/2026-02-en-vokabelliste-1-3.json`,
   with `id`, `title`, `language` and `schoolYear` filled in and empty `groups`
   and `words`. Do not create the file by hand and do not edit those four fields.
   Optional `--reference 1-3` sets the last part of the file name (default: a
   slug of the title).
2. Fill in `groups` and `words` exactly as approved.
3. Run `pnpm validate` (run `pnpm install` first if `node_modules` is missing;
   `npm install` if pnpm is unavailable). It must print `OK`. Fix what it
   reports and run it again. If validation cannot be run at all, stop, say why,
   and ask the user before going on — do not open a pull request unvalidated.
4. Commit on the session's branch (cloud sessions create one, e.g.
   `claude/…`; any name is fine, **never `main`**): one commit with only the
   new file, message `Add lesson <id>: <title>` with the `id` from the file.
5. `gh pr create --base main --title "Add lesson <id>: <title>" --body "<word count, portions, transcription notes>"`.
   If `gh` is unavailable, push the branch and ask the user to open the PR from
   the session.
6. CI validates the PR and, because it changes only lesson files, merges it
   automatically and deploys. If CI fails, read the error, fix on the same
   branch, push again.
7. Report in one short message: PR link, word count, portions.

## Data contract

### Files

```
data/lessons/<school-year>-<nn>-<language>-<reference>.json   one lesson, e.g. 2026-01-en-1-2.json
data/lessons/lesson.schema.json                              JSON Schema (generated, do not edit)
```

Every other `*.json` in the directory is a lesson. **File names are produced by
`pnpm new-lesson`**; the convention is documented so that you can read it, not
so that you type it:

- `<school-year>` — calendar year the school year starts in (`2026` = 2026/27;
  a school year starts in August)
- `<nn>` — running number within that school year, `01`, `02`, …; the overview
  lists lessons in this order (numerically aware)
- `<language>` — primary subtag of the lesson's language (`en`, `fr`)
- `<reference>` — free text in `[a-z0-9-]`, whatever helps a human find the
  lesson (the book's list number, a slug of the title)

The file name is for humans and ordering only. Renaming a file changes its
position and nothing else; the validator checks that school year and language
in the name match the fields inside.

### Lesson file

```json
{
  "id": "f1e88eb8",
  "title": "Vokabelliste 1.2",
  "language": "en-GB",
  "schoolYear": 2026,
  "groups": [15, 14, 14],
  "words": [
    ["tausend", "thousand"],
    ["haben", "to have, had"]
  ]
}
```

| Field | Type | Meaning and rules |
|---|---|---|
| `id` | string, required | Opaque identity: 8 hex characters, generated (`pnpm new-lesson`, `pnpm new-id`). Unique across all files. **Never changed** after publishing — every word's progress is keyed by it. Carries no meaning on purpose. |
| `title` | string, required | Shown in the app, e.g. `Vokabelliste 1.2`. Display only — free to change any time. |
| `language` | string, required | BCP-47 tag of the language being learned, with region: `en-GB`, `fr-FR`. Drives the read-aloud voice, the input's language and the display name (Englisch, Französisch). Free to change. |
| `schoolYear` | integer, required | Calendar year the school year starts in: `2026` means 2026/27. Set automatically from the date the lesson is added. Used for grouping; free to change (keep the file name in sync). |
| `groups` | integer[] ≥ 1, required | Portion sizes in book order. Must add up to `words.length`. Free to change. |
| `words` | `[string, string][]`, required, ≥ 1 | `["deutsch", "fremdsprache"]` in book order. Both sides non-empty. |

No other fields (`additionalProperties: false`). Formatting: 2-space indent,
one word pair per line, UTF-8, trailing newline.

Only two things have side effects on stored progress: changing `id` (whole
lesson resets) and changing a German entry (that one word resets). Everything
else — title, language, school year, groups, foreign side, file name — is free.

Extension path, for later: a word may become an object
`{ "de": "…", "en": "…", "note": "…" }` next to the tuples when per-word data is
needed. Until the schema says so, use tuples only.

### Word pairs

**German side** (what the child sees, and the progress key):

- Copy the book: `(der) Strand`, `(die/der) Römer*in, römisch`, `(viel) Spaß haben`.
- Must be unique within the lesson after lower-casing and removing everything
  but letters — `haben` and `Haben,` would collide. If the book really has two
  entries with the same German word, make them distinguishable
  (`laufen (zu Fuß)` / `laufen (rennen)`).
- Must contain at least one letter.

**Foreign side** (what the child types, and what the checker accepts). The
checker understands this notation — use it, and nothing else:

| Notation | Meaning | Example | Accepted answers |
|---|---|---|---|
| `a, b` | alternatives, any one is right | `to have, had` | `to have`, `had`, `have had`, … |
| `a / b` | same as comma | `big / large` | `big`, `large` |
| `(…)` | optional part | `to have (a lot of) fun` | `to have fun`, `have a lot of fun` |
| `(= b)` | spelling variant | `to organize (= organise)` | `to organize`, `organise` |
| `to …` | infinitive marker, optional when typing | `to compare` | `compare`, `to compare` |
| `the …`, `a …` | article, optional when typing | `the airport` | `airport` |

Rules:

- Irregular verbs as the book lists them: `to swim, swam` (checker accepts either form).
- Keep the book's spelling (British: `colour`, `organise`).
- No explanations, grammar notes, example sentences or pronunciation in the
  foreign side. If the book has a note, drop it. `beach` — not `beach (noun)`.
- No trailing punctuation, no quotes, no numbering.
- Letters, spaces and the characters `, / ( ) = ' -` only. Everything else is
  stripped by the checker and would silently loosen the comparison.

### Mistakes to avoid

- Creating the lesson file by hand instead of with `pnpm new-lesson`, or
  editing the generated `id`, `schoolYear` or file name.
- Changing an existing `id`, or reusing one for a different lesson.
- Editing a word in an existing lesson without being asked — a changed German
  side resets that word's progress.
- Adding fields the schema does not know (`subject`, `titel`, `note`, `page`).
- Portions that do not add up; a `groups` value of 0.
- Putting two book entries into one pair, or one entry into two pairs.
- Guessing an unreadable word instead of asking.

## Development

- `pnpm dev` · `pnpm test` · `pnpm lint` · `pnpm typecheck` · `pnpm build` · `pnpm validate` · `pnpm new-lesson` · `pnpm new-id` · `pnpm schema` (regenerate `lesson.schema.json` after changing `src/domain/lesson.ts`)
- `src/domain/lessonFileName.ts` and `schoolYear.ts` must stay dependency-free: `scripts/new-lesson.ts` runs without `pnpm install`.
- Node 24 (`.nvmrc`), pnpm via corepack.
- `src/domain/` is framework-free and tested; `src/app/` is Vue. Logic belongs in `domain`, not in components.
- No abbreviations in identifiers (`lesson`, not `l`; `index`, not `idx`). Tailwind: default scale only, no arbitrary values.
- Things that affect stored progress (change only with a migration): localStorage keys `vokabelheft-progress` and `vokabelheft-sound`, the stored format in `progress.ts`, `wordKey` in `lesson.ts`. The answer checker in `judge.ts` is pinned by `tests/judge.test.ts`.
