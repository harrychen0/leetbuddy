import { createRouter, createWebHistory } from 'vue-router';
import ProblemListView from '@/views/ProblemListView.vue';
import ProblemView from '@/views/ProblemView.vue';

const routes = [
  { path: '/', component: ProblemListView },
  { path: '/problem/:slug', component: ProblemView, props: true },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
