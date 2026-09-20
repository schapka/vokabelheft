# Vokabelheft

A small web app for learning English vocabulary alongside school, built for a
child. Runs as a static site on GitHub Pages; learning progress stays in the
browser of the device.

Three steps per portion: **Lesen** (read), **Ankreuzen** (multiple choice),
**Schreiben** (type it yourself). A word *sits* once it has been typed correctly
on two different calendar days. Words that were practiced but do not sit yet
show up as *Wackelkandidaten* (shaky words).

The UI is German; code, comments and documentation are English.

## Adding a lesson from a photo (Claude on your phone)

The intended way to add lessons: photograph the vocabulary page, hand it to
Claude in the Claude app, let it transcribe and commit. The rules for the agent
live in `AGENTS.md`, which Claude Code reads automatically (as do most other coding agents).

### One-time setup

1. **Give Claude access to the repository.** Install the Claude GitHub App on
   this repository: <https://github.com/apps/claude> → *Configure* → select the
   repository. This is what lets cloud sessions clone and push; a personal access
   token is not needed. (Alternative for the terminal-minded: run `/web-setup`
   in a local Claude Code session to share your `gh` token instead.)
2. **Connect GitHub in Claude.** Open <https://claude.ai/code> once in a
   browser, authorise GitHub when asked and pick this repository. Cloud sessions
   need a Pro, Max or Team plan.
3. **Let the session install dependencies** so it can run `pnpm validate`: at
   <https://claude.ai/code> → *Environments* → your environment → setup script:

   ```sh
   corepack enable && pnpm install --frozen-lockfile
   ```

   Optional — without it the agent skips local validation and CI catches
   problems in the pull request.
4. **Allow GitHub Actions to merge**: *Settings → Actions → General → Workflow
   permissions* → "Read and write permissions". Optionally protect `main` so
   that only pull requests can change it; the auto-merge works either way.

### Each new lesson

1. Take a photo of the vocabulary page (one photo per page, straight on, good
   light). Two photos for a double page are fine.
2. In the Claude app open **Code**, choose this repository and the `main`
   branch, attach the photo(s) and send:

   > New lesson from the attached photo. Follow the "Adding a lesson from a
   > photo" procedure in AGENTS.md.

   That's all — title, language, school year, file name and id are derived by
   Claude and the `new-lesson` script. Add a hint only if you want something
   specific ("title: Unit 2 Vokabeln").
3. **Review.** Claude answers with the complete transcription as a table, its
   open questions, the proposed portions and the title — and stops. Check the
   table against the book, answer the questions (retake a photo if asked),
   adjust portions or title if you like. Nothing is written until you say "ok".
4. **Publish.** After your ok, Claude creates the lesson file, runs
   `pnpm validate`, and opens a pull request `Add lesson <id>: <title>` from a
   branch `lesson/<id>`.
5. CI validates the data; if it passes and the PR touches nothing outside
   `data/lessons/`, it is merged and deployed automatically, usually within a
   few minutes. If it fails, the PR stays open with the error — tell Claude to
   fix it.

The rules Claude follows — what it fixes on its own, what it asks about, and the
exact data format — are the "Data contract" section in `AGENTS.md`.

## Adding a lesson by hand

1. `pnpm new-lesson --title "Vokabelliste 1.3"` (add `--language fr-FR` for
   another language). It creates `data/lessons/<school-year>-<nn>-<language>-<reference>.json`
   with a generated `id`, the title, the language and the current school year:

   ```json
   {
     "id": "51b4636e",
     "title": "Vokabelliste 1.3",
     "language": "en-GB",
     "schoolYear": 2026,
     "groups": [],
     "words": []
   }
   ```

2. Fill in `words` as `["deutsch", "fremdsprache"]` pairs in book order, and
   `groups` with the portion sizes (they must add up to the number of words;
   12–15 per portion works well):

   ```json
   {
     "groups": [14, 13],
     "words": [
       ["(der) Strand", "beach"],
       ["schwimmen", "to swim, swam"]
     ]
   }
   ```

3. Run `pnpm validate`. It reports the file and the exact place when something
   is wrong.
4. Commit and push to `main` — the rest is automatic.

### What can be changed

| Field | Changeable? | Why |
|---|---|---|
| `id` | **No** | Progress keys depend on it. Changing it resets every word of the lesson. |
| German side | Yes, but | A corrected German entry resets the progress of **that one word** (the key is `<id>` + `\|` + the German side, lower-cased, letters only). |
| `title`, `language`, `schoolYear`, `groups`, foreign side | Yes, any time | Display, voice, grouping, portions — no progress involved. |
| file name | Yes | Only sets the position on the overview page; keep school year and language in sync with the fields (`pnpm validate` checks). |

Conventions, in case you want to know them: `schoolYear` is the calendar year
the school year starts in (`2026` = 2026/27, new year in August); the file name
is `<school-year>-<nn>-<language>-<reference>.json`, ordered numerically; the
`id` is 8 random hex characters and carries no meaning. `pnpm new-lesson`
produces all of it.

The foreign side may contain alternatives — commas, slashes, brackets and
`(= …)` are all accepted when checking: `to have, had`,
`to organize (= organise)`, `to have (a lot of) fun`.

`pnpm validate` fails on: a missing, invalid or duplicate `id`; a file name
outside the convention or not matching `schoolYear`/`language`; missing
`title`, `language` or `schoolYear`; `groups` not adding up to the word count;
empty or one-sided word pairs; a duplicate German side within a lesson.

## Development

Node 24 (`.nvmrc`) and pnpm (`corepack enable`).

```
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # vitest
pnpm lint         # eslint (@antfu/eslint-config)
pnpm typecheck    # vue-tsc
pnpm build        # dist/
pnpm validate     # check the lesson data only
pnpm new-lesson   # create a lesson file that follows the conventions
pnpm schema       # regenerate data/lessons/lesson.schema.json
```

Layout:

```
data/lessons/       content — the only thing touched for new lessons
                    (lesson.schema.json is generated: pnpm schema)
src/domain/         framework-free logic: schema, answer checking, progress, speech
src/app/            Vue: views, components, composables
src/styles/         design tokens (light/dark) and Tailwind
tests/              vitest — the answer checker is pinned here
scripts/            validate, new-lesson, new-id, schema — plain Node, no build
```

Progress lives in `localStorage` under `vokabelheft-progress` (format documented
in `src/domain/progress.ts`), the sound preference under `vokabelheft-sound`.
Changing the format or `wordKey` in `src/domain/lesson.ts` resets progress on
every device — add a migration instead.

## Deployment

A push to `main` runs `.github/workflows/pages.yml`, which builds and deploys to
GitHub Pages. One-time repository setting: **Settings → Pages → Source: GitHub
Actions**. `ci.yml` checks every push and pull request (validate, lint,
typecheck, test, build); for pull requests from `lesson/*` branches that change
only `data/lessons/`, it also merges the PR after the checks pass and triggers
the deploy.

No analytics, no tracking, no external requests apart from Google Fonts.
