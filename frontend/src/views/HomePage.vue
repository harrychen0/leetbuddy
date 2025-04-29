<template>
  <div class="home-page">
    <h1>LeetCode Problems</h1>
    <div class="problems-list">
      <div class="problem-card" @click="navigateToProblem(1)">
        <div class="problem-title">1. Two Sum</div>
        <div class="problem-difficulty easy">Easy</div>
        <div class="problem-description">
          Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToProblem = (id: number) => {
  router.push(`/problem/${id}`)
}
</script>

<style scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.problems-list {
  margin-top: 20px;
}

.problem-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.problem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.problem-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.problem-difficulty {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.problem-difficulty.easy {
  background-color: #00af9b;
  color: white;
}

.problem-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>
