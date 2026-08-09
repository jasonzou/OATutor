import { createRouter, createWebHashHistory } from 'vue-router'

// Routes mirror the React app's App.js. Not-yet-ported screens point at
// Placeholder.vue; they're swapped to real views as components are converted
// (Problem/Platform -> Phase 3, TextbookReader -> Phase 4, etc.).
const Placeholder = () => import('@/views/Placeholder.vue')

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/LessonSelection.vue') },
    { path: '/demo/input', name: 'inputDemo', component: () => import('@/views/InputDemo.vue') },
    { path: '/demo/problem', name: 'problemDemo', component: () => import('@/views/ProblemDemo.vue') },
    { path: '/demo/lesson', name: 'lessonDemo', component: () => import('@/views/LessonDemo.vue') },
    { path: '/courses/:courseNum', name: 'course', component: Placeholder, props: { title: 'Course lessons' } },
    { path: '/lessons/:id', name: 'lesson', component: () => import('@/views/Platform.vue') },
    { path: '/lessons/:id/problems', name: 'lessonProblems', component: Placeholder, props: { title: 'All problems' } },
    { path: '/debug/:id', name: 'debug', component: Placeholder, props: { title: 'Debug' } },
    { path: '/textbook/:book/:section', name: 'textbook', component: Placeholder, props: { title: 'Textbook reader' } },
    { path: '/posts', name: 'posts', component: Placeholder, props: { title: 'Posts' } },
    { path: '/assignment-not-linked', component: Placeholder, props: { title: 'Assignment not linked' } },
    { path: '/assignment-already-linked', component: Placeholder, props: { title: 'Assignment already linked' } },
    { path: '/session-expired', component: Placeholder, props: { title: 'Session expired' } },
    { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('@/views/NotFound.vue') },
  ],
})
