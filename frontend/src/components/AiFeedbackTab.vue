<template>
  <div class="ai-feedback-tab">
    <button @click="getAiFeedback" :disabled="isLoadingAiFeedback">
      {{ isLoadingAiFeedback ? 'Grading...' : "Grade user's code with AI" }}
    </button>
    <div v-if="aiFeedback" class="feedback-result">
      <h3>AI Feedback:</h3>
      <pre>{{ aiFeedback }}</pre>
    </div>
    <div v-if="isLoadingAiFeedback && !aiFeedback" class="loading-message">
      Getting feedback from AI...
    </div>
    <div v-if="aiError" class="error-message">
      <p>Error getting AI feedback: {{ aiError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ProblemDetails } from '@/services/problemService.ts'; // Updated path

const props = defineProps<{
  problemDetails: ProblemDetails | null;
  userCode: string;
}>();

const aiFeedback = ref<string | null>(null);
const isLoadingAiFeedback = ref(false);
const aiError = ref<string | null>(null);

const getAiFeedback = async () => {
  if (!props.problemDetails || !props.userCode) {
    aiError.value = 'Problem details or user code is missing.';
    return;
  }
  isLoadingAiFeedback.value = true;
  aiFeedback.value = null;
  aiError.value = null;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Placeholder: In a real scenario, you would call your AI service here
    // passing props.problemDetails.description and props.userCode
    aiFeedback.value = `AI Feedback for problem: ${props.problemDetails.title}\n\nUser Code:\n${props.userCode}\n\nThis is a placeholder feedback. Integrating a real AI service would go here. The AI would analyze the problem description and the provided code to give constructive suggestions, identify potential bugs, or assess correctness against the problem statement.`;

  } catch (error) {
    console.error('Error getting AI feedback:', error);
    aiError.value = error instanceof Error ? error.message : 'An unknown error occurred.';
  } finally {
    isLoadingAiFeedback.value = false;
  }
};
</script>

<style scoped>
.ai-feedback-tab {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.feedback-result {
  padding: 15px;
  background-color: #f8f9fa; /* Light background for the feedback box */
  border: 1px solid #dee2e6; /* Border for the feedback box */
  border-radius: 4px;
  white-space: pre-wrap; /* Keep formatting of the feedback */
  font-family: monospace;
}

.feedback-result pre {
  white-space: pre-wrap;    /* Ensures spaces and newlines are preserved, and wraps text */
  overflow-wrap: break-word; /* Breaks long words to prevent overflow */
  margin: 0;                 /* Reset default pre margin if any */
}

.feedback-result h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.loading-message, .error-message {
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.loading-message {
  color: #555;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
