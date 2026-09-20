# Vokabelheft

A small web app for practising school vocabulary, built for the children of
one family — one device per child, each on their own grade. Runs as a static
site on GitHub Pages; learning progress stays on the device.

The UI is German; code, comments and documentation are English.

## What it does

- **Three steps per portion**: **Lesen** (see the word, reveal the answer),
  **Ankreuzen** (pick one of four), **Schreiben** (type it). Lessons are split
  into portions of about 15 words. Only typing scores.
- **A word *sits*** once it has been typed correctly on two different calendar
  days. Words that were practised but do not sit yet are collected as
  *Wackelkandidaten* across all lessons of the grade.
- **Forgiving checker**: alternatives, optional brackets, `(= …)` spelling
  variants, a missing `to` or article are accepted; a single typo gets a
  "Fast!" hint instead of a mistake.
- **Read-aloud** of every answer in the lesson's language (Web Speech API, no
  external service), with an on/off switch.
- **Grades**: lessons carry the school grade; once more than one grade exists,
  a sticky switch on the overview selects the grade a device practises.
- **Picks up where the child left off**: an interrupted round (help page,
  overview, the iOS reload of the installed app) is restored, same word, same
  tally.
- **New lessons announce themselves**: a "Neu" badge on the overview, and an
  update bar when a newer build is deployed ("Neu laden" — progress is kept).
- **Help page** (`#/hilfe`) explaining the rules and answering the usual
  questions, in German, for the child.

## Install on the device

Open the site in Safari and use **Add to Home Screen** (iOS/iPadOS) or **Add
to Dock** (macOS). The installed app has its own storage, separate from the
Safari tab and from any other installation, and is exempt from Safari's
seven-day storage eviction — so: always practise from the icon, on the same
device. Deleting the icon deletes the progress; "Fortschritt löschen" in the
footer does the same after a confirmation.

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
   > photo" procedure in AGENTS.md: show me the transcription for review, and
   > after my ok validate it and open the pull request.

   Or save this link on the phone — it opens a new session with the repository
   and the prompt already filled in, so only the photo is left to attach:
   <https://claude.ai/code?repositories=schapka/vokabelheft&prompt=New%20lesson%20from%20the%20attached%20photo.%20Follow%20the%20%22Adding%20a%20lesson%20from%20a%20photo%22%20procedure%20in%20AGENTS.md%3A%20show%20me%20the%20transcription%20for%20review%2C%20and%20after%20my%20ok%20validate%20it%20and%20open%20the%20pull%20request.>

   That's all — title, language, school year, grade, file name and id are
   derived by Claude and the `new-lesson` script; it asks if the grade isn't
   obvious from the book. Add a hint only if you want something specific
   ("Klasse 2", "title: Unit 2 Vokabeln").
3. **Review.** Claude answers with the complete transcription as a table, its
   open questions, the proposed portions and the title — and stops. Check the
   table against the book, answer the questions (retake a photo if asked),
   adjust portions or title if you like. Nothing is written until you say "ok".
4. **Publish.** After your ok, Claude creates the lesson file, runs
   `pnpm validate`, and — only when that passes — opens a pull request
   `Add lesson <id>: <title>`.
5. CI checks the PR; if it passes and the PR changes nothing but lesson files,
   it is merged and deployed automatically, usually within a few minutes.
   Claude watches the whole chain and sends one final message in the session:
   the site URL when the deployment is through, or the failing step and the
   error if something broke (it fixes data problems itself, anything else it
   reports).

The rules Claude follows — what it fixes on its own, what it asks about, and the
exact data format — are the "Data contract" section in `AGENTS.md`.

## Adding a lesson by hand

1. `pnpm new-lesson --title "Vokabelliste 1.3" --grade 6` (add `--language fr-FR`
   for another language). It creates `data/lessons/<school-year>-g<grade>-<nn>-<language>-<reference>.json`
   with a generated `id`, the title, the language, the current school year and
   the grade:

   ```json
   {
     "id": "51b4636e",
     "title": "Vokabelliste 1.3",
     "language": "en-GB",
     "schoolYear": 2026,
     "grade": 6,
     "groups": [],
     "words": []
   }
   ```

2. Fill in `words` as `["deutsch", "fremdsprache"]` pairs in book order, and
   `groups` with the portion sizes (they must add up to the number of words;
   8–16 per portion, split evenly — `pnpm validate` warns otherwise):

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
| `title`, `language`, `schoolYear`, `grade`, `groups`, foreign side | Yes, any time | Display, voice, grouping, portions — no progress involved. |
| file name | Yes | Only sets the position on the overview page; keep school year, grade and language in sync with the fields (`pnpm validate` checks). |

Conventions, in case you want to know them: `schoolYear` is the calendar year
the school year starts in (`2026` = 2026/27, new year in August); the file name
is `<school-year>-g<grade>-<nn>-<language>-<reference>.json`, ordered numerically; the
`id` is 8 random hex characters and carries no meaning. `pnpm new-lesson`
produces all of it.

The foreign side may contain alternatives — commas, slashes, brackets and
`(= …)` are all accepted when checking: `to have, had`,
`to organize (= organise)`, `to have (a lot of) fun`.

`pnpm validate` fails on: a missing, invalid or duplicate `id`; a file name
outside the convention or not matching `schoolYear`/`grade`/`language`; missing
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
pnpm new-id       # print a fresh lesson id
pnpm schema       # regenerate data/lessons/lesson.schema.json
```

Layout:

```
data/lessons/       content — the only thing touched for new lessons
                    (lesson.schema.json is generated: pnpm schema)
src/domain/         framework-free logic: schema, answer checking, progress, speech
src/app/            Vue: views, components, composables
src/styles/         design tokens (light/dark) and Tailwind
public/             icons, manifest, link-preview image (spec in docs/image-assets.md)
tests/              vitest — the answer checker is pinned here
scripts/            validate, new-lesson, new-id, schema — plain Node, no build
```

Device state lives in `localStorage`: `vokabelheft-progress` (the learning
progress, format documented in `src/domain/progress.ts`), `vokabelheft-sound`,
`vokabelheft-seen-lessons`, `vokabelheft-round` (the interrupted round) and
`vokabelheft-grade`. Changing the progress format or `wordKey` in
`src/domain/lesson.ts` resets progress on every device — add a migration
instead. There is no sync between devices.

## Deployment

A push to `main` runs `.github/workflows/pages.yml`, which builds and deploys to
GitHub Pages (the build id is written to `version.json`, which the app polls to
offer a reload). One-time repository setting: **Settings → Pages → Source:
GitHub Actions**. `ci.yml` checks every push and pull request (validate, lint,
typecheck, test, build); for pull requests that change nothing but
`data/lessons/*.json`, it also merges the PR after the checks pass and then
dispatches the Pages workflow on `main`. Any other PR is left for you to merge.
Deployments only ever run from `main` — keep the `github-pages` environment's
branch rule set to `main`.

No analytics, no tracking, no external requests apart from Google Fonts.
