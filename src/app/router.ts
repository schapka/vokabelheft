import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import LessonView from './views/LessonView.vue'
import ReviewView from './views/ReviewView.vue'

// Hash history keeps the prototype's URLs: #/l/<id> and #/wiederholen
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/l/:id', name: 'lesson', component: LessonView, props: true },
    { path: '/wiederholen', name: 'review', component: ReviewView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
