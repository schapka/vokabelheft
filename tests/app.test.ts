// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { SOUND_KEY } from '@/app/composables/useSpeech.ts'
import { STORE_KEY } from '@/domain/progress.ts'

/**
 * Walks through the app once with the real lesson data: overview → lesson →
 * read → write. Guards the wiring between views, composables and storage.
 */

async function mountApp(hash = '') {
  // the progress store is a module singleton that reads localStorage on import,
  // so every test gets fresh modules
  vi.resetModules()
  // no network in tests: the update check must find nothing
  vi.stubGlobal('fetch', async () => ({ ok: false }))
  const [{ default: App }, { router: appRouter }] = await Promise.all([
    import('@/app/App.vue'),
    import('@/app/router.ts'),
  ])
  const router = createRouter({ history: createWebHashHistory(), routes: appRouter.options.routes })
  window.location.hash = hash
  await router.push(hash ? hash.slice(1) : '/')
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  await router.isReady()
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
})

describe('app', () => {
  it('shows the lesson overview', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.text()).toContain('Vokabeln üben')
    expect(wrapper.text()).toContain('Vokabelliste 1.2')
    expect(wrapper.text()).toContain('0 von 43 sitzen')
    expect(wrapper.text()).toContain('Klasse 6, 2026/27')
    expect(wrapper.text()).not.toContain('Wackelkandidaten')
  })

  it('opens a lesson via its hash URL and reads through the first portion', async () => {
    const { wrapper } = await mountApp('#/l/f1e88eb8')
    expect(wrapper.text()).toContain('Vokabelliste 1.2')
    expect(wrapper.text()).toContain('Englisch, Klasse 6, 2026/27, 43 Wörter')
    expect(wrapper.text()).toContain('Wort 1 von 15')
    expect(wrapper.text()).toContain('tausend')

    await wrapper.find('button[aria-pressed]').exists()
    const reveal = wrapper.findAll('button').find(button => button.text() === 'Lösung zeigen')!
    await reveal.trigger('click')
    expect(wrapper.text()).toContain('thousand')

    const next = wrapper.findAll('button').find(button => button.text() === 'Weiter')!
    await next.trigger('click')
    expect(wrapper.text()).toContain('Wort 2 von 15')
  })

  it('records a correct typed answer and a mistake in localStorage', async () => {
    const { wrapper } = await mountApp('#/l/f1e88eb8')
    const writeMode = wrapper.findAll('button').find(button => button.text().includes('Schreiben'))!
    await writeMode.trigger('click')

    // the prompt is the German side; look up the expected English answer
    const german = wrapper.find('[data-testid="prompt"]').text()
    const { default: lesson } = await import('@data/lessons/2026-g06-01-en-1-2.json')
    const pair = lesson.words.find(([candidate]) => candidate === german)!

    const input = wrapper.find('input[type="text"]')
    expect(input.attributes('autocorrect')).toBe('off')
    expect(input.attributes('spellcheck')).toBe('false')
    await input.setValue(pair[1])
    await input.trigger('keydown.enter')
    expect(wrapper.text()).toContain('Richtig.')
    expect(wrapper.text()).toContain('Morgen nochmal, dann sitzt es.')

    await wrapper.findAll('button').find(button => button.text() === 'Weiter')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Ich weiß es nicht')!.trigger('click')
    expect(wrapper.text()).toContain('Richtig wäre:')

    const stored = JSON.parse(localStorage.getItem(STORE_KEY)!)
    const entries = Object.values(stored.words) as { days: string[], errors: number }[]
    expect(entries.some(entry => entry.days.length === 1 && entry.errors === 0)).toBe(true)
    expect(entries.some(entry => entry.days.length === 0 && entry.errors === 1)).toBe(true)
  })

  it('offers the shaky-word review once a mistake was made', async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      words: { 'f1e88eb8|tausend': { days: [], errors: 1, lastError: '2026-09-19' } },
      lessons: {},
    }))
    const { wrapper, router } = await mountApp()
    expect(wrapper.text()).toContain('Ein Wort, das noch nicht sitzt')

    await router.push('/wiederholen')
    await flushPromises()
    expect(wrapper.text()).toContain('Wackelkandidaten')
    expect(wrapper.text()).toContain('Wort 1 von 1')
    expect(wrapper.text()).toContain('tausend')
  })

  it('persists the read-aloud switch', async () => {
    // happy-dom has no speech synthesis; a stub is enough for the switch to render
    Object.assign(window, {
      speechSynthesis: { getVoices: () => [], cancel: () => {}, speak: () => {} },
      SpeechSynthesisUtterance: class {},
    })
    const { wrapper } = await mountApp('#/l/f1e88eb8')
    const toggle = wrapper.find('[role="switch"]')
    expect(toggle.attributes('aria-checked')).toBe('true')
    expect(toggle.text()).toContain('Vorlesen an')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(toggle.text()).toContain('Vorlesen aus')
    expect(localStorage.getItem(SOUND_KEY)).toBe('false')
  })

  it('reads the stored progress format', async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      words: { 'f1e88eb8|tausend': { days: ['2026-09-18', '2026-09-19'], errors: 0, lastError: null } },
      lessons: { f1e88eb8: { read: '2026-09-19' } },
    }))
    const { wrapper } = await mountApp()
    expect(wrapper.text()).toContain('1 von 43 sitzt')
    expect(wrapper.text()).toContain('1 Lesen ✓')
  })

  it('marks lessons this device has not seen yet as new', async () => {
    localStorage.setItem('vokabelheft-seen-lessons', JSON.stringify(['some-other-lesson']))
    const { wrapper } = await mountApp()
    expect(wrapper.text()).toContain('Neu')

    await wrapper.find('a[href="#/l/f1e88eb8"]').trigger('click')
    await flushPromises()
    expect(JSON.parse(localStorage.getItem('vokabelheft-seen-lessons')!)).toContain('f1e88eb8')
  })

  it('treats every lesson as seen on the very first start', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.text()).not.toContain('Neu')
    const seen = JSON.parse(localStorage.getItem('vokabelheft-seen-lessons')!) as string[]
    expect(seen).toContain('f1e88eb8')
    expect(seen.length).toBe(wrapper.findAll('a[href^="#/l/"]').length)
  })

  it('has a help page', async () => {
    const { wrapper, router } = await mountApp()
    expect(wrapper.find('a[href="#/hilfe"]').exists()).toBe(true)
    await router.push('/hilfe')
    await flushPromises()
    expect(wrapper.text()).toContain('So funktioniert das Vokabelheft')
    expect(wrapper.text()).toContain('2 verschiedenen Tagen')
  })

  it('deletes progress only after confirmation', async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      words: { 'f1e88eb8|tausend': { days: ['2026-09-18', '2026-09-19'], errors: 0, lastError: null } },
      lessons: {},
    }))
    const { wrapper } = await mountApp()
    expect(wrapper.text()).toContain('1 von 43 sitzt')

    await wrapper.findAll('button').find(button => button.text() === 'Fortschritt löschen')!.trigger('click')
    expect(wrapper.text()).toContain('Wirklich den gesamten Fortschritt')
    await wrapper.findAll('button').find(button => button.text() === 'Abbrechen')!.trigger('click')
    expect(wrapper.text()).not.toContain('Wirklich den gesamten Fortschritt')
    expect(wrapper.text()).toContain('1 von 43 sitzt')

    await wrapper.findAll('button').find(button => button.text() === 'Fortschritt löschen')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Ja, alles löschen')!.trigger('click')
    expect(wrapper.text()).toContain('Fortschritt gelöscht.')
    expect(wrapper.text()).toContain('0 von 43 sitzen')
    expect(JSON.parse(localStorage.getItem(STORE_KEY)!)).toEqual({ words: {}, lessons: {} })
  })

  it('resumes an interrupted round after visiting another page', async () => {
    const { wrapper, router } = await mountApp('#/l/f1e88eb8')
    await wrapper.findAll('button').find(button => button.text().includes('Schreiben'))!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Ich weiß es nicht')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Weiter')!.trigger('click')
    expect(wrapper.text()).toContain('Wort 2 von 15, 0 richtig')
    const prompt = wrapper.find('[data-testid="prompt"]').text()

    await router.push('/hilfe')
    await flushPromises()
    await router.push('/l/f1e88eb8')
    await flushPromises()
    expect(wrapper.text()).toContain('Wort 2 von 15, 0 richtig')
    expect(wrapper.find('[data-testid="prompt"]').text()).toBe(prompt)
    expect(wrapper.findAll('button[aria-pressed="true"]').some(button => button.text().includes('Schreiben'))).toBe(true)
  })

  it('resumes a stored round, including the end screen', async () => {
    localStorage.setItem('vokabelheft-round', JSON.stringify({
      scope: 'f1e88eb8',
      group: 1,
      mode: 'quiz',
      order: ['f1e88eb8|tausend'],
      index: 1,
      right: 1,
      missed: [],
      revealed: false,
      savedAt: Date.now(),
    }))
    const { wrapper } = await mountApp('#/l/f1e88eb8')
    expect(wrapper.text()).toContain('Alles richtig.')
    // continuing from the end screen starts the next step of that portion (group 1 has 14 words)
    await wrapper.findAll('button').find(button => button.text() === 'Zum Schreiben')!.trigger('click')
    expect(wrapper.text()).toContain('Wort 1 von 14')
  })

  it('ignores a stored round of another lesson or an unknown word', async () => {
    localStorage.setItem('vokabelheft-round', JSON.stringify({
      scope: 'f1e88eb8',
      group: 0,
      mode: 'write',
      order: ['f1e88eb8|gibtesnicht'],
      index: 0,
      right: 0,
      missed: [],
      revealed: false,
      savedAt: Date.now(),
    }))
    const { wrapper } = await mountApp('#/l/f1e88eb8')
    expect(wrapper.text()).toContain('Wort 1 von 15')
    expect(wrapper.text()).toContain('Lösung zeigen')
  })

  it('leads back to the lesson from the help page when that is where the user came from', async () => {
    const { wrapper, router } = await mountApp('#/l/f1e88eb8')
    await router.push({ name: 'help' })
    await flushPromises()
    const back = wrapper.find('a[href="#/l/f1e88eb8"]')
    expect(back.exists()).toBe(true)
    expect(back.text()).toBe('← Zurück zur Lektion')

    await router.push({ name: 'home' })
    await router.push({ name: 'help' })
    await flushPromises()
    expect(wrapper.find('a[href="#/"]').text()).toBe('← Übersicht')
  })

  it('shows no grade switch while all lessons are of one grade', async () => {
    // the switch itself is covered in tests/grade.test.ts; the data set here has one grade
    const { wrapper } = await mountApp()
    expect(wrapper.find('nav[aria-label="Klasse"]').exists()).toBe(false)
  })
})
