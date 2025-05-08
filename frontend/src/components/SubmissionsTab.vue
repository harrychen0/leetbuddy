<template>
  <div class="submission-results-content">
    <div class="results-panel results-submission" v-if="submitStatus || isLoading">
      <h3>Submission Result</h3>
      <div v-if="isLoading">Submitting...</div>
      <div v-else>
        <div>Status: <span :class="statusClass(submitStatus)">{{ submitStatus }}</span></div>
        <div v-if="passedTests !== null && totalTests !== null">
          Tests Passed: {{ passedTests }} / {{ totalTests }}
        </div>
        <div v-if="submitTime">Time: {{ submitTime }}</div>
        <div v-if="submitMemory">Memory: {{ submitMemory }}</div>
        <pre><code>{{ submitResultsOutput }}</code></pre>
      </div>
    </div>
    <div v-else class="no-submission-placeholder">
      Submit your code to see the results here.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Props
const props = defineProps<{
  isLoading: boolean;
  submitStatus: string | null;
  submitTime: string | null;
  submitMemory: string | null;
  passedTests: number | null;
  totalTests: number | null;
  submitResultsOutput: string | null;
}>();

function statusClass(status: string | null) {
  if (!status) return '';
  if (status.toLowerCase().includes('accepted')) return 'status-accepted';
  if (status.toLowerCase().includes('error') || status.toLowerCase().includes('wrong')) return 'status-error';
  if (status.toLowerCase().includes('compilation')) return 'status-compilation-error';
  return 'status-processing';
}
</script>

<style scoped>
.submission-results-content {
  /* Styles from ProblemView.vue's .tab-content that are relevant here */
  /* padding: 20px; /* Handled by parent's .tab-content */
  /* flex-grow: 1; /* Handled by parent's .tab-content */
  /* overflow-y: auto; /* Handled by parent's .tab-content */
}

/* Styles for .results-panel, h3, pre, etc. are assumed to be largely covered by global/parent styles. */
/* However, specific styles for .results-submission or .no-submission-placeholder should be here. */

.results-panel.results-submission {
  /* If there are any styles specific to *this* results panel variant */
}

.no-submission-placeholder {
  text-align: center;
  color: #777; /* Assuming dark theme context */
  padding: 30px;
}

/* Status styling, copied from ProblemView/TestcaseTab for self-containment */
/* Consider moving to a shared utility or global styles if used in many places */
.status-accepted { color: #5cb85c; }
.status-error { color: #d9534f; }
.status-compilation-error { color: #f0ad4e; }
.status-processing { color: #777; }

/* Copied from ProblemView for self-containment of results panel appearance */
.results-panel {
  padding: 16px;
  background-color: #252526;
  color: #ccc;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  line-height: 1.4;
  overflow-y: auto; /* This panel itself might need to scroll if content is huge */
  border-top: 1px solid #333; /* Consistent with TestcaseTab */
}
.results-panel h3 {
  margin-top: 0;
  font-size: 1.1em;
  color: #ddd;
  margin-bottom: 10px;
}
.results-panel pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #1e1e1e;
  padding: 10px;
  border-radius: 4px;
}
.results-panel div span { /* For status highlighting */
  font-weight: bold;
}
</style>
