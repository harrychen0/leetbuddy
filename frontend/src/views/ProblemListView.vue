<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { judge0Service, type ProblemListItem } from '@/services/judge0.ts'

const problems = ref<ProblemListItem[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

async function fetchProblems() {
  isLoading.value = true
  error.value = null
  try {
    problems.value = await judge0Service.getProblems()
  } catch (err) {
    console.error('Failed to load problems:', err)
    error.value = 'Failed to load problems. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProblems()
})
</script>

<template>
  <main class="home-view">
    <h1>All Problems</h1>
    <div v-if="isLoading" class="loading-message">Loading problems...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="problems.length === 0" class="no-problems-message">
      No problems found.
    </div>

    <ul v-else class="problem-list">
      <li v-for="problem in problems" :key="problem.id" class="problem-list-item">
        <RouterLink :to="`/problem/${problem.slug}`" class="problem-link">
          <span class="problem-title">{{ problem.title }}</span>
          <span :class="['problem-difficulty', problem.difficulty.toLowerCase()]">
            {{ problem.difficulty }}
          </span>
        </RouterLink>
      </li>
    </ul>

    <button @click="fetchProblems" :disabled="isLoading" class="refresh-button" v-if="!isLoading">
      Refresh Problems
    </button>
  </main>
</template>


<style scoped>
.home-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.loading-message,
.error-message,
.no-problems-message {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
  color: #555;
}

.error-message {
  color: #d9534f; /* Red for errors */
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  border-radius: 4px;
}

.problem-list {
  list-style: none;
  padding: 0;
}

.problem-list-item {
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: background-color 0.2s ease-in-out;
}

.problem-list-item:hover {
  background-color: #f9f9f9;
}

.problem-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  text-decoration: none;
  color: #337ab7; /* Bootstrap link color */
}

.problem-title {
  font-weight: bold;
  font-size: 1.2em;
}

.problem-difficulty {
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9em;
  color: white;
  text-transform: capitalize;
}

.problem-difficulty.easy {
  background-color: #5cb85c; /* Green */
}

.problem-difficulty.medium {
  background-color: #f0ad4e; /* Orange */
}

.problem-difficulty.hard {
  background-color: #d9534f; /* Red */
}

.refresh-button {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  font-size: 1em;
  color: white;
  background-color: #337ab7;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background-color: #286090;
}

.refresh-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
