<template>
  <div class="problem-description-container">
    <h1>{{ problem.title }}</h1>
    <div :class="['difficulty', problem.difficulty.toLowerCase()]">{{ problem.difficulty }}</div>
    <div class="description" v-html="renderedDescription"></div>

    <div v-if="problem.examples && problem.examples.length" class="examples">
      <h3>Examples:</h3>
      <div v-for="(example, index) in problem.examples" :key="index" class="example">
        <h4>Example {{ index + 1 }}:</h4>
        <pre><code>Input: {{ example.input }}
Output: {{ example.output }}<template v-if="example.explanation">
Explanation: {{ example.explanation }}</template></code></pre>
      </div>
    </div>

    <div v-if="problem.constraints && problem.constraints.length" class="constraints">
      <h3>Constraints:</h3>
      <ul>
        <li v-for="(constraint, index) in problem.constraints" :key="index">{{ constraint }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { ProblemDetails } from '@/services/judge0.ts' // Assuming ProblemDetails is exported

// Define props
const props = defineProps<{
  problem: ProblemDetails
}>()

// Computed property to render Markdown description
const renderedDescription = computed(() => {
  if (props.problem && props.problem.description) {
    // Basic sanitization or use a more robust library if allowing complex HTML
    return marked.parse(props.problem.description.replace(/\\n/g, '\n'))
  }
  return ''
})

</script>

<style scoped>
.problem-description-container {
  /* Add any container-specific padding if needed, or rely on parent padding */
}

h1 {
  font-size: 1.8em;
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.difficulty {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.8em;
  color: white;
  margin-bottom: 15px;
  text-transform: capitalize;
}
.difficulty.easy { background-color: #5cb85c; }
.difficulty.medium { background-color: #f0ad4e; }
.difficulty.hard { background-color: #d9534f; }

.description {
  margin-bottom: 20px;
  line-height: 1.6;
  color: #333;
}
/* Use :deep() to style content rendered by v-html from marked */
.description :deep(p) { margin-bottom: 10px; }
.description :deep(pre) {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
.description :deep(code) {
  font-family: 'Courier New', Courier, monospace;
  background-color: #eee; /* Slight background for inline code */
  padding: 2px 4px;
  border-radius: 3px;
}
.description :deep(pre code) {
  background-color: transparent; /* Reset background for code within pre */
  padding: 0;
  border-radius: 0;
}
.description :deep(ul), .description :deep(ol) {
  padding-left: 25px;
  margin-bottom: 10px;
}
.description :deep(li) {
  margin-bottom: 5px;
}


.examples h3, .constraints h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 1.2em;
  color: #333;
}

.example {
  background-color: #f8f9fa;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
  border: 1px solid #eee;
}
.example h4 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 1em;
    font-weight: normal;
    color: #555;
}
.example pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.example pre code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.95em;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.constraints ul {
  padding-left: 20px;
  margin: 0;
  color: #333;
}
.constraints li {
  margin-bottom: 5px;
}
</style>
