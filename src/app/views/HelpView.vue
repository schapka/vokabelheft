<script setup lang="ts">
import BackLink from '@/app/components/BackLink.vue'
import { SITS_AFTER } from '@/domain/progress.ts'

const faq = [
  {
    question: 'Warum ist ein Wort wieder da, das ich schon konnte?',
    answer: `Ein Wort sitzt erst, wenn du es an ${SITS_AFTER} verschiedenen Tagen richtig geschrieben hast. Einmal richtig reicht nicht — morgen nochmal, dann bleibt es.`,
  },
  {
    question: 'Was sind Wackelkandidaten?',
    answer: 'Wörter, die du schon geübt hast, die aber noch nicht sitzen: falsch angekreuzt, falsch geschrieben oder erst an einem Tag richtig. Der Knopf oben auf der Übersicht sammelt sie aus allen Lektionen — kurz üben, fertig.',
  },
  {
    question: 'Ich habe das Wort richtig, aber es sagt „Fast“?',
    answer: 'Dann steckt ein Tippfehler drin, meistens ein Buchstabe. Schau genau hin und tippe es nochmal. Das zählt noch nicht als Fehler.',
  },
  {
    question: 'Muss ich alles tippen, was im Buch steht?',
    answer: 'Nein. Bei „to have, had“ reicht „to have“ oder „had“. Das „to“ darfst du weglassen, ebenso „the“ oder „a“ am Anfang. Klammern sind freiwillig: bei „to have (a lot of) fun“ ist „to have fun“ richtig. Groß- und Kleinschreibung ist egal.',
  },
  {
    question: 'Zählt Ankreuzen als gelernt?',
    answer: 'Nein. Ankreuzen ist zum Wiedererkennen. Ein Fehler beim Ankreuzen macht das Wort zum Wackelkandidaten, aber richtig ankreuzen bringt keinen Punkt. Sitzen tut ein Wort nur durch Schreiben.',
  },
  {
    question: 'Warum sehe ich auf dem anderen Tablet meinen Fortschritt nicht?',
    answer: 'Der Fortschritt wird nur auf dem Gerät gespeichert, auf dem du übst — und nur in der App, die du vom Startbildschirm öffnest. Bleib deshalb bei einem Gerät. Wird die App vom Startbildschirm gelöscht, ist der Fortschritt weg.',
  },
  {
    question: 'Was bedeutet „Neu“ bei einer Lektion?',
    answer: 'Diese Lektion ist neu dazugekommen, seit du zuletzt hier warst. Sobald du sie einmal öffnest, verschwindet das Schild.',
  },
  {
    question: 'Es gibt eine neue Version — was tun?',
    answer: 'Auf „Neu laden“ tippen. Dein Fortschritt bleibt dabei erhalten.',
  },
  {
    question: 'Das Vorlesen geht nicht.',
    answer: 'Prüfe den Schalter „Vorlesen an/aus“ über der Übung und ob das Gerät nicht stummgeschaltet ist. Steht dort „Vorlesen geht hier nicht“, kann der Browser keine Sprache ausgeben — das ist selten, ein anderer Browser hilft.',
  },
  {
    question: 'Ein Wort in der Liste ist falsch abgetippt.',
    answer: 'Kann passieren, die Listen sind von Fotos abgeschrieben. Sag Bescheid, dann wird es korrigiert. Wird die deutsche Seite eines Wortes geändert, beginnt nur dieses eine Wort wieder bei null.',
  },
]
</script>

<template>
  <BackLink />
  <h1 class="mt-2 text-2xl font-semibold tracking-tight">
    So funktioniert das Vokabelheft
  </h1>
  <p class="mt-1 text-foreground-muted">
    Kurz erklärt, damit du weißt, was die App von dir will.
  </p>

  <section class="mt-8">
    <h2 class="text-lg font-semibold">
      Drei Schritte pro Portion
    </h2>
    <p class="mt-2 text-foreground-muted">
      Jede Lektion ist in Portionen von etwa 15 Wörtern geteilt. Eine Portion übst du in drei Schritten, immer in dieser Reihenfolge:
    </p>
    <ol class="mt-4 space-y-3">
      <li class="flex gap-3">
        <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">1</span>
        <span><span class="font-medium">Lesen.</span> Du siehst das deutsche Wort, überlegst, und deckst dann die Lösung auf. Kennenlernen, kein Test.</span>
      </li>
      <li class="flex gap-3">
        <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">2</span>
        <span><span class="font-medium">Ankreuzen.</span> Vier Möglichkeiten, eine ist richtig. Zum Wiedererkennen.</span>
      </li>
      <li class="flex gap-3">
        <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">3</span>
        <span><span class="font-medium">Schreiben.</span> Du tippst das Wort selbst. Nur hier sammelst du Punkte.</span>
      </li>
    </ol>
  </section>

  <section class="mt-8">
    <h2 class="text-lg font-semibold">
      Wann ein Wort sitzt
    </h2>
    <p class="mt-2 text-foreground-muted">
      Ein Wort sitzt, wenn du es an <span class="font-medium text-foreground">{{ SITS_AFTER }} verschiedenen Tagen</span> richtig geschrieben hast.
      Heute richtig und morgen nochmal richtig — dann bleibt es. Zweimal am selben Tag zählt nur einmal, denn es geht darum, dass du es auch nach dem Schlafen noch weißt.
    </p>
    <p class="mt-2 text-foreground-muted">
      Auf der Übersicht siehst du pro Lektion, wie viele Wörter schon sitzen. Ein Häkchen an einer Portion heißt: alle Wörter darin sitzen.
    </p>
  </section>

  <section class="mt-8">
    <h2 class="text-lg font-semibold">
      Ein guter Tag
    </h2>
    <ul class="mt-2 list-disc space-y-1 pl-5 text-foreground-muted">
      <li>Erst die Wackelkandidaten, wenn es welche gibt — das sind höchstens 15 Wörter.</li>
      <li>Dann eine Portion der aktuellen Lektion: lesen, ankreuzen, schreiben.</li>
      <li>Nach dem Schreiben zeigt dir „Nur die Fehler“ die Wörter, die daneben gingen. Einmal durch, dann Feierabend.</li>
      <li>Lieber jeden Tag zehn Minuten als einmal die Woche eine Stunde — sonst werden es keine zwei verschiedenen Tage.</li>
    </ul>
  </section>

  <section class="mt-8">
    <h2 class="text-lg font-semibold">
      Fragen
    </h2>
    <dl class="mt-2 divide-y divide-border">
      <div v-for="entry in faq" :key="entry.question" class="py-3">
        <dt class="font-medium">
          {{ entry.question }}
        </dt>
        <dd class="mt-1 text-foreground-muted">
          {{ entry.answer }}
        </dd>
      </div>
    </dl>
  </section>
</template>
