import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import ProblemView from '@/views/ProblemView.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/problem/:id', component: ProblemView, props: true },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
