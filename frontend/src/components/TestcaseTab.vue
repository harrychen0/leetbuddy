<template>
  <div class="testcase-tab-content">
    <div class="testcase-toolbar">
      <button @click="addTestCase" :disabled="customTestCases.length >= 5">
        Add Test Case
      </button>
      <button @click="deleteSelectedTestCase" :disabled="customTestCases.length <= 1">
        Delete Selected
      </button>
    </div>

    <div class="custom-testcases-list">
      <div
        v-for="(testCase, index) in customTestCases"
        :key="testCase.id"
        class="testcase-item"
        :class="{ selected: testCase.id === selectedTestCaseId }"
      >
        <input
          type="radio"
          name="selectedTestCase"
          :id="`testcase-radio-${testCase.id}`"
          :value="testCase.id"
          v-model="selectedTestCaseId"
          class="testcase-radio"
        />
        <label :for="`testcase-radio-${testCase.id}`" class="testcase-label">
          Test Case {{ index + 1 }}
        </label>
        <div class="testcase-inputs">
            <div class="input-group">
                <label :for="`nums-input-${testCase.id}`">Nums:</label>
                <input
                    type="text"
                    :id="`nums-input-${testCase.id}`"
                    v-model.trim="testCase.numsInput"
                    placeholder="[2, 7, 11, 15]"
                />
            </div>
             <div class="input-group">
                <label :for="`target-input-${testCase.id}`">Target:</label>
                <input
                    type="text"
                    :id="`target-input-${testCase.id}`"
                    v-model.trim="testCase.targetInput"
                    placeholder="9"
                />
            </div>
        </div>
      </div>
    </div>

    <div class="results-panel results-run-tests" v-if="runTestsStatus || isLoadingUserTests">
        <h3>Custom Test Results</h3>
        <div v-if="isLoadingUserTests">Running...</div>
        <div v-else>
            <div>Status: <span :class="statusClass(runTestsStatus)">{{ runTestsStatus }}</span></div>
            <pre><code>{{ runTestsResultsOutput }}</code></pre>
        </div>
     </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type * as monaco from 'monaco-editor'
import { judge0Service } from '@/services/judge0.ts'
import type { ProblemDetails } from '@/services/problemService.ts'

// Props
const props = defineProps<{
  problemDetails: ProblemDetails | null
  editorInstance: monaco.editor.IStandaloneCodeEditor | null
}>()

// Custom Test Cases State
interface CustomTestCase {
  id: number
  numsInput: string
  targetInput: string
}
let nextTestCaseId = ref(1)
const customTestCases = ref<CustomTestCase[]>([
  { id: nextTestCaseId.value++, numsInput: '[2, 7, 11, 15]', targetInput: '9' },
])
const selectedTestCaseId = ref(customTestCases.value[0].id)

// Test Execution State
const isLoadingUserTests = ref(false)
const runTestsStatus = ref<string | null>(null)
const runTestsResultsOutput = ref<string | null>(null)

function statusClass(status: string | null) {
  if (!status) return ''
  if (status.toLowerCase().includes('accepted')) return 'status-accepted'
  if (status.toLowerCase().includes('error') || status.toLowerCase().includes('wrong')) return 'status-error'
  if (status.toLowerCase().includes('compilation')) return 'status-compilation-error'
  return 'status-processing'
}

async function runUserTests() {
  if (!props.editorInstance || !props.problemDetails) return

  const selectedTest = customTestCases.value.find(tc => tc.id === selectedTestCaseId.value)
  if (!selectedTest) {
    runTestsStatus.value = "No test case selected or found."
    runTestsResultsOutput.value = ""
    return
  }

  // TODO: Generalize stdin creation based on problem type
  // For now, assuming 'two-sum' structure for custom test cases
  const stdin = `${selectedTest.numsInput}\n${selectedTest.targetInput}`

  isLoadingUserTests.value = true
  runTestsStatus.value = 'Running...'
  runTestsResultsOutput.value = null

  const currentCode = props.editorInstance.getValue()
  try {
    // Assuming Python (language_id: 71)
    const result = await judge0Service.submitCode(currentCode, 71, stdin)

    runTestsStatus.value = result.status.description
    if (result.status.id === 3) { // Accepted
      runTestsResultsOutput.value = `Output:\n${result.stdout || '(No output)'}`
    } else if (result.compile_output) {
      runTestsResultsOutput.value = `Compilation Error:\n${result.compile_output}`
    } else if (result.stderr) {
      runTestsResultsOutput.value = `Runtime Error:\n${result.stderr}`
    } else if (result.message) {
      runTestsResultsOutput.value = `Message:\n${result.message}`
    } else {
      runTestsResultsOutput.value = `Status: ${result.status.description}`
    }
  } catch (error: any) {
    console.error('Run user tests error:', error)
    runTestsStatus.value = 'Test Run Failed'
    runTestsResultsOutput.value = error.response?.data?.error || error.message || 'An unknown error occurred.'
  } finally {
    isLoadingUserTests.value = false
    // No longer setting activeTab here, parent handles tab visibility
  }
}

function addTestCase() {
  if (customTestCases.value.length < 5) {
    const newId = nextTestCaseId.value++
    customTestCases.value.push({ id: newId, numsInput: '', targetInput: '' })
    selectedTestCaseId.value = newId // Auto-select the new test case
  }
}

function deleteSelectedTestCase() {
  if (customTestCases.value.length > 1) {
    const indexToDelete = customTestCases.value.findIndex(tc => tc.id === selectedTestCaseId.value)
    if (indexToDelete !== -1) {
      customTestCases.value.splice(indexToDelete, 1)
      if (customTestCases.value.length > 0) {
        selectedTestCaseId.value = customTestCases.value[0].id
      } else {
        addTestCase()
      }
    }
  }
}

// Expose method and state for parent component
defineExpose({
  runUserTests,
  isLoadingUserTests
})
</script>

<style scoped>
.testcase-tab-content { /* Changed from problem-view .testcase-results-content */
  display: flex;
  flex-direction: column;
  height: 100%;
  /* padding: 20px; /* This was on .tab-content, will be handled by parent */
  /* flex-grow: 1; /* This was on .tab-content */
  /* overflow-y: auto; /* This was on .tab-content */
}

.testcase-toolbar {
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #333; /* Assuming dark theme context from parent */
  display: flex;
  gap: 10px;
  flex-shrink: 0; /* Prevent toolbar from shrinking */
}
.testcase-toolbar button {
  padding: 8px 12px;
  border: 1px solid #555;
  background-color: #3e3e3e;
  color: #ccc;
  border-radius: 4px;
  cursor: pointer;
}
.testcase-toolbar button:hover:not(:disabled) {
  background-color: #4a4a4a;
}
.testcase-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-testcases-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 15px; /* Space before results panel */
}

.testcase-item {
  padding: 10px;
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 10px;
  background-color: #2a2a2a;
}
.testcase-item.selected {
  border-color: #007bff; /* Highlight color */
  background-color: #30353b;
}

.testcase-radio {
  margin-right: 8px;
  vertical-align: middle;
}
.testcase-label {
  font-weight: bold;
  color: #ddd;
  margin-bottom: 8px;
  display: block;
}

.testcase-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.input-group {
  display: flex;
  flex-direction: column;
}
.input-group label {
  font-size: 0.85em;
  color: #aaa;
  margin-bottom: 3px;
}
.input-group input[type="text"] {
  padding: 6px 8px;
  background-color: #1e1e1e;
  border: 1px solid #444;
  color: #ccc;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
}

/* Styles for results panel, assuming parent provides .results-panel base styles */
.results-run-tests {
  flex-shrink: 0; /* Prevent it from shrinking if content above is large */
  /* Base .results-panel, h3, pre styles are expected from ProblemView.vue or global */
}

/* Status styling, duplicated for self-containment for now */
.status-accepted { color: #5cb85c; }
.status-error { color: #d9534f; }
.status-compilation-error { color: #f0ad4e; }
.status-processing { color: #777; }

/* Styles for .results-panel and its children like h3, pre, etc. */
/* These are copied from ProblemView.vue to make this component self-contained with its result display */
/* This assumes .results-panel is defined on the child component's template */
.results-panel {
  padding: 16px;
  background-color: #252526; /* Parent's style */
  color: #ccc; /* Parent's style */
  font-family: 'Courier New', Courier, monospace; /* Parent's style */
  font-size: 0.9em; /* Parent's style */
  line-height: 1.4; /* Parent's style */
  overflow-y: auto;
  border-top: 1px solid #333;
}
.results-panel h3 {
    margin-top: 0;
    font-size: 1.1em;
    color: #ddd; /* Parent's style */
    margin-bottom: 10px;
}
.results-panel pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #1e1e1e; /* Parent's style */
  padding: 10px;
  border-radius: 4px;
}
.results-panel div span { /* For status highlighting from parent */
    font-weight: bold;
}
</style>
