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
            <button class="run-button" @click="runCode" :disabled="isLoading">
              {{ isLoading ? 'Running...' : 'Submit Code' }}
            </button>
          </div>
          <div class="editor-container">
            <MonacoEditor
              ref="monacoEditorRef"
              v-model="code"
              language="python"
              theme="vs-dark"
              :options="editorOptions"
              @editorDidMount="handleEditorMount"
            />
          </div>
          <div class="io-panel">
            <h3>Standard Input:</h3>
            <textarea v-model="stdinRef" placeholder="Enter standard input (if any)..."></textarea>
          </div>
          <div class="results-panel" v-if="status">
            <h3>Results:</h3>
            <div>
              Status: <span :class="statusClass">{{ status }}</span>
            </div>
            <div v-if="time">Time: {{ time }}</div>
            <div v-if="memory">Memory: {{ memory }}</div>
            <pre><code>{{ resultsOutput }}</code></pre>
          </div>
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MonacoEditor from '@/components/MonacoEditor.vue'
import type * as monaco from 'monaco-editor'
import { marked } from 'marked'
import axios from 'axios'

const router = useRouter()
const isLoading = ref(false)
const resultsOutput = ref<string | null>(null)
const status = ref<string | null>(null)
const time = ref<string | null>(null)
const memory = ref<string | null>(null)
const stdinRef = ref('')

// Ref for the Monaco editor instance
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

// Function to handle editor mount and store instance
const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
  editorInstance.value = editor
}

const code = ref(`import sys
import json

def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []

# Read input from stdin
lines = sys.stdin.readlines()
if len(lines) >= 2:
    try:
      # Assuming first line is JSON list, second line is integer target
      nums_list = json.loads(lines[0])
      target_val = int(lines[1])
      result = two_sum(nums_list, target_val)
      # Output the result as JSON
      print(json.dumps(result))
    except (json.JSONDecodeError, ValueError, IndexError) as e:
        print(f"Error processing input: {e}", file=sys.stderr)
else:
  print("Input requires at least two lines: a JSON list of nums and the target integer.", file=sys.stderr)
`)

const description = `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`

const examples = [
  {
    input: 'nums = [2,7,11,15], target = 9',
    output: '[0,1]',
  },
  {
    input: 'nums = [3,2,4], target = 6',
    output: '[1,2]',
  },
  {
    input: 'nums = [3,3], target = 6',
    output: '[0,1]',
  },
]

const constraints = [
  '2 <= nums.length <= 104',
  '-109 <= nums[i] <= 109',
  '-109 <= target <= 109',
  'Only one valid answer exists.',
]

const renderedDescription = computed(() => marked(description))

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  scrollBeyondLastLine: false,
  automaticLayout: true,
}

const runCode = async () => {
  if (!editorInstance.value) {
    console.error('Editor instance not available.')
    resultsOutput.value = 'Error: Editor not ready.'
    status.value = 'Error'
    return
  }

  isLoading.value = true
  resultsOutput.value = null // Clear previous output
  status.value = 'Submitting...'
  time.value = null
  memory.value = null

  const sourceCode = editorInstance.value.getValue()
  // TODO: Replace with dynamic language selection
  const langId = 71 // 71 is Python (3.8.1) in Judge0 CE
  const stdinputValue = stdinRef.value

  const BACKEND_PROXY_URL = 'http://localhost:3000' // Your backend proxy

  try {
    const response = await axios.post(`${BACKEND_PROXY_URL}/api/submit`, {
      source_code: sourceCode,
      language_id: langId,
      stdin: stdinputValue,
    })

    console.log('Backend Response:', response.data)

    // Update UI with results from Judge0 via your backend
    status.value = response.data.status?.description || 'Error'
    time.value = response.data.time ? `${response.data.time}s` : null
    memory.value = response.data.memory ? `${(response.data.memory / 1024).toFixed(2)} MB` : null // Convert KB to MB

    // Display relevant output
    if (response.data.status?.id === 6) {
      // Compilation Error
      resultsOutput.value = `Compilation Error:\n${response.data.compile_output || response.data.stderr || response.data.message || ''}`
    } else if (response.data.status?.id && response.data.status.id > 3) {
      // Runtime Error, TLE, etc.
      resultsOutput.value = `Error Output:\n${response.data.stderr || response.data.message || '(No error message)'}\n\nStandard Output:\n${response.data.stdout || '(No standard output)'}`
    } else {
      // Accepted or similar
      resultsOutput.value = `Output:\n${response.data.stdout || '(No output)'}`
    }
  } catch (error: any) {
    console.error('Error submitting code:', error)
    status.value = 'Submission Failed'
    resultsOutput.value = `Error: ${error.response?.data?.error || error.message || 'Unknown network or backend error'}`
  } finally {
    isLoading.value = false
  }
}

// Computed class for status styling
const statusClass = computed(() => {
  if (!status.value) return ''
  if (status.value === 'Accepted') return 'status-accepted'
  if (
    status.value.includes('Error') ||
    status.value.includes('Failed') ||
    status.value.includes('Wrong')
  )
    return 'status-error'
  if (status.value === 'Submitting...') return 'status-submitting'
  return 'status-other'
})
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

.io-panel {
  padding: 10px 16px;
  background-color: #252526; /* Slightly lighter than editor bg */
  border-top: 1px solid #333;
}

.io-panel h3 {
  margin-top: 0;
  margin-bottom: 5px;
  color: #ccc;
  font-size: 0.9rem;
}

.io-panel textarea {
  width: 100%;
  min-height: 60px; /* Adjust as needed */
  background-color: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 5px;
  font-family: monospace;
  resize: vertical; /* Allow vertical resizing */
  box-sizing: border-box; /* Include padding and border in width */
}

.results-panel {
  padding: 16px;
  background-color: #252526; /* Slightly lighter than editor bg */
  border-top: 1px solid #333;
  color: #ccc;
  font-family: monospace;
  min-height: 100px; /* Ensure panel has some height */
  overflow-y: auto; /* Add scroll if content overflows */
}

.results-panel h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: white;
}

.results-panel pre {
  white-space: pre-wrap; /* Wrap long lines */
  word-wrap: break-word;
  margin: 0;
  padding: 10px;
  background-color: #1e1e1e; /* Match editor bg */
  border-radius: 4px;
}

.status-accepted {
  color: #4caf50; /* Green */
  font-weight: bold;
}

.status-error {
  color: #f44336; /* Red */
  font-weight: bold;
}

.status-submitting {
  color: #ffc107; /* Amber */
}

.status-other {
  color: #ccc; /* Default */
}
</style>
