import { createRouter, createWebHashHistory } from 'vue-router'
import HelpView from './views/HelpView.vue'
import HomeView from './views/HomeView.vue'
import LessonView from './views/LessonView.vue'
import ReviewView from './views/ReviewView.vue'

// Hash history keeps the prototype's URLs: #/l/<id>, #/wiederholen, #/hilfe
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/l/:id', name: 'lesson', component: LessonView, props: true },
    { path: '/wiederholen', name: 'review', component: ReviewView },
    { path: '/hilfe', name: 'help', component: HelpView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
