<template>
  <div class="problem-view">
    <div class="problem-header">
      <button class="back-button" @click="router.back()">← Back to Problems</button>
    </div>
    <Splitpanes>
      <Pane size="40">
        <div class="problem-description">
          <h1>Two Sum</h1>
          <div class="difficulty">Easy</div>
          <div class="description" v-html="renderedDescription"></div>
          <div class="examples">
            <h3>Examples:</h3>
            <div v-for="(example, index) in examples" :key="index" class="example">
              <h4>Example {{ index + 1 }}:</h4>
              <pre><code>Input: {{ example.input }}
Output: {{ example.output }}</code></pre>
            </div>
          </div>
          <div class="constraints">
            <h3>Constraints:</h3>
            <ul>
              <li v-for="(constraint, index) in constraints" :key="index">{{ constraint }}</li>
            </ul>
          </div>
        </div>
      </Pane>
      <Pane size="60">
        <div class="editor-section">
          <div class="editor-header">
            <button class="run-button" @click="runCode" :disabled="isRunning">
              {{ isRunning ? 'Running...' : 'Run Code' }}
            </button>
          </div>
          <div class="editor-container">
            <MonacoEditor
              v-model="code"
              language="javascript"
              theme="vs-dark"
              :options="editorOptions"
            />
          </div>
          <div class="results-panel" v-if="results">
            <h3>Results:</h3>
            <pre><code>{{ results }}</code></pre>
          </div>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MonacoEditor from '@/components/MonacoEditor.vue'
import { marked } from 'marked'
import { judge0Service } from '@/services/judge0'

const router = useRouter()
const isRunning = ref(false)
const results = ref<string | null>(null)

const code = ref(`function twoSum(nums, target) {
  // Write your code here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Read input
const input = require('fs').readFileSync('/dev/stdin', 'utf8').split('\\n');
const nums = JSON.parse(input[0]);
const target = parseInt(input[1]);

// Run the function
console.log(JSON.stringify(twoSum(nums, target)));`)

const description = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`

const examples = [
  {
    input: 'nums = [2,7,11,15], target = 9',
    output: '[0,1]'
  },
  {
    input: 'nums = [3,2,4], target = 6',
    output: '[1,2]'
  },
  {
    input: 'nums = [3,3], target = 6',
    output: '[0,1]'
  }
]

const constraints = [
  '2 <= nums.length <= 104',
  '-109 <= nums[i] <= 109',
  '-109 <= target <= 109',
  'Only one valid answer exists.'
]

const renderedDescription = computed(() => marked(description))

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  scrollBeyondLastLine: false,
  automaticLayout: true
}

const runCode = async () => {
  try {
    isRunning.value = true
    results.value = null
    
    const token = await judge0Service.submitCode(code.value)
    const result = await judge0Service.getSubmissionResult(token)
    
    if (result.stderr) {
      results.value = `Error: ${result.stderr}`
    } else if (result.compile_output) {
      results.value = `Compilation Error: ${result.compile_output}`
    } else {
      results.value = result.stdout || 'No output'
    }
  } catch (error) {
    results.value = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
  } finally {
    isRunning.value = false
  }
}
</script>

<style scoped>
.problem-view {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

.problem-header {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.back-button {
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.editor-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  padding: 16px;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
}

.run-button {
  background-color: #00af9b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.run-button:hover:not(:disabled) {
  background-color: #009688;
}

.run-button:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.problem-description {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.difficulty {
  display: inline-block;
  padding: 4px 8px;
  background-color: #00af9b;
  color: white;
  border-radius: 4px;
  margin: 10px 0;
}

.description {
  margin: 20px 0;
  line-height: 1.6;
}

.examples {
  margin: 20px 0;
}

.example {
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.constraints {
  margin: 20px 0;
}

.editor-container {
  flex: 1;
  background-color: #1e1e1e;
}

.results-panel {
  padding: 16px;
  background-color: #1e1e1e;
  border-top: 1px solid #333;
  color: #fff;
}

.results-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style> 