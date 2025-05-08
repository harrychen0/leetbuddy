<template>
  <div class="problem-view">
    <div class="problem-header">
      <button class="back-button" @click="goBack">← Back to Problems</button>
    </div>
    <div v-if="isLoadingProblem" class="loading-problem-message">Loading problem details...</div>
    <div v-if="problemError" class="error-problem-message">{{ problemError }}</div>

    <Splitpanes v-if="!isLoadingProblem && problemDetails" class="default-theme" style="height: calc(100vh - 70px)">
      <Pane size="40">
        <div class="left-pane-content">
          <div class="left-pane-toolbar">
            <button
              class="tab-button"
              :class="{ active: activeTab === 'description' }"
              @click="activeTab = 'description'"
            >
              Problem Description
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'testcase' }"
              @click="activeTab = 'testcase'"
            >
              Testcase
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'submissions' }"
              @click="activeTab = 'submissions'"
            >
              Submissions
            </button>
          </div>

          <div v-if="activeTab === 'description'" class="tab-content problem-description-content">
            <ProblemDescription :problem="problemDetails" />
          </div>

          <div v-if="activeTab === 'testcase'" class="tab-content testcase-results-content">
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

          <div v-if="activeTab === 'submissions'" class="tab-content submission-results-content">
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
        </div>
      </Pane>
      <Pane size="60">
        <div class="editor-section">
          <div class="editor-header">
             <button class="run-button run-tests-button" @click="runUserTests" :disabled="isLoadingProblem || isLoading || isLoadingUserTests">
              {{ isLoadingUserTests ? 'Running Custom Tests...' : 'Run Tests' }}
            </button>
            <button class="run-button submit-button" @click="runCode" :disabled="isLoadingProblem || isLoading || isLoadingUserTests">
              {{ isLoading ? 'Submitting...' : 'Submit' }}
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
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watchEffect, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MonacoEditor from '@/components/MonacoEditor.vue'
import ProblemDescription from '@/components/ProblemDescription.vue'
import type * as monaco from 'monaco-editor'
import { judge0Service, type ProblemDetails } from '@/services/judge0.ts'

const route = useRoute()
const router = useRouter()

// Problem Details State
const problemDetails = ref<ProblemDetails | null>(null)
const isLoadingProblem = ref(true)
const problemError = ref<string | null>(null)

// Editor and Submission State (mostly existing)
const isLoading = ref(false)
const isLoadingUserTests = ref(false)

const runTestsStatus = ref<string | null>(null)
const runTestsResultsOutput = ref<string | null>(null)

const submitStatus = ref<string | null>(null)
const submitResultsOutput = ref<string | null>(null)
const submitTime = ref<string | null>(null)
const submitMemory = ref<string | null>(null)
const passedTests = ref<number | null>(null)
const totalTests = ref<number | null>(null)

const activeTab = ref('description')

// Custom Test Cases (existing, might need to be adapted or integrated with fetched examples)
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

const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
  editorInstance.value = editor
}

const code = ref('')

const editorOptions = ref<monaco.editor.IStandaloneEditorConstructionOptions>({
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  renderWhitespace: 'boundary' as monaco.editor.IStandaloneEditorConstructionOptions['renderWhitespace'],
  wordWrap: 'on' as monaco.editor.IStandaloneEditorConstructionOptions['wordWrap'],
})

// Fetch problem details when slug changes or on mount
async function fetchProblemDetails(slug: string) {
  if (!slug) return
  isLoadingProblem.value = true
  problemError.value = null
  problemDetails.value = null // Reset previous problem details
  try {
    const data = await judge0Service.getProblemDetails(slug as string)
    problemDetails.value = data
    code.value = data.function_signature || '' // Set editor code
    // Reset submission status from previous problem
    submitStatus.value = null
    submitResultsOutput.value = null
    submitTime.value = null
    submitMemory.value = null
    passedTests.value = null
    totalTests.value = null
    runTestsStatus.value = null
    runTestsResultsOutput.value = null
    activeTab.value = 'description' // Default to description tab
  } catch (err) {
    console.error(`Failed to load problem details for ${slug}:`, err)
    problemError.value = `Failed to load problem details. Please check the slug or try again. (${err instanceof Error ? err.message : 'Unknown error'})`
  } finally {
    isLoadingProblem.value = false
  }
}

watchEffect(() => {
  const slug = route.params.slug
  if (slug) {
    fetchProblemDetails(slug as string)
  }
})

function goBack() {
  router.push('/') // Or router.back() if preferred
}

function statusClass(status: string | null) {
  if (!status) return ''
  if (status.toLowerCase().includes('accepted')) return 'status-accepted'
  if (status.toLowerCase().includes('error') || status.toLowerCase().includes('wrong')) return 'status-error'
  if (status.toLowerCase().includes('compilation')) return 'status-compilation-error'
  return 'status-processing'
}

async function runCode() {
  if (!editorInstance.value || !problemDetails.value) return
  isLoading.value = true
  submitStatus.value = 'Submitting...'
  submitResultsOutput.value = null
  submitTime.value = null
  submitMemory.value = null
  passedTests.value = null
  totalTests.value = null

  const currentCode = editorInstance.value.getValue()
  try {
    // Assuming Python (language_id: 71) for now
    const result = await judge0Service.runTests(problemDetails.value.slug, 71, currentCode)

    submitStatus.value = result.status
    submitTime.value = result.time
    submitMemory.value = result.memory?.toString() || null // Ensure memory is string or null
    passedTests.value = result.passedTests
    totalTests.value = result.totalTests

    if (result.status === 'Accepted') {
      submitResultsOutput.value = result.output || 'All tests passed!'
    } else {
      submitResultsOutput.value = `${result.error || 'An error occurred.'}\n`
      if (result.details) {
        submitResultsOutput.value += `Input: ${JSON.stringify(result.details.input)}\n`
        if (result.details.expected !== undefined) {
          submitResultsOutput.value += `Expected: ${JSON.stringify(result.details.expected)}\n`
        }
        if (result.details.got !== undefined) {
          submitResultsOutput.value += `Got: ${JSON.stringify(result.details.got)}\n`
        }
         if (result.details.error && typeof result.details.error === 'string' && !submitResultsOutput.value.includes(result.details.error)) {
           submitResultsOutput.value += `Details: ${result.details.error}`
        }
      }
    }
  } catch (error: any) {
    console.error('Submission error:', error)
    submitStatus.value = 'Submission Failed'
    submitResultsOutput.value = error.response?.data?.error || error.message || 'An unknown error occurred during submission.'
  } finally {
    isLoading.value = false
    activeTab.value = 'submissions'
  }
}

async function runUserTests() {
  if (!editorInstance.value || !problemDetails.value) return

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

  const currentCode = editorInstance.value.getValue()
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
    activeTab.value = 'testcase'
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
      // Select the first test case if the deleted one was selected
      if (customTestCases.value.length > 0) {
        selectedTestCaseId.value = customTestCases.value[0].id
      } else {
        // This case should ideally not be reached if "Delete" is disabled for <=1
        addTestCase() // Add a new one if all are deleted (though button is disabled)
      }
    }
  }
}

</script>

<style scoped>
.problem-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden; /* Prevent scrolling of the entire page */
}

.problem-header {
  padding: 10px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  height: 50px; /* Fixed height */
  flex-shrink: 0;
}

.back-button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 1rem;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e9ecef;
}

.splitpanes.default-theme {
  /* Height is set inline for now, calc(100vh - 70px) */
}

.left-pane-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  overflow-y: hidden; /* Prevent this pane from scrolling, content will scroll */
}

.left-pane-toolbar {
  display: flex;
  border-bottom: 1px solid #dee2e6;
  padding: 0 10px;
  flex-shrink: 0; /* Prevent toolbar from shrinking */
}

.tab-button {
  padding: 10px 15px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px; /* Overlap with pane border */
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.tab-content {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto; /* Allow content within tab to scroll */
}

.editor-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e; /* Editor background color */
}

.editor-header {
  display: flex;
  justify-content: flex-end;
  padding: 10px;
  background-color: #252526; /* Slightly lighter than editor bg */
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.run-button {
  padding: 8px 15px;
  margin-left: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}
.run-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.run-tests-button {
  background-color: #4CAF50; /* Green */
  color: white;
}
.run-tests-button:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-button {
  background-color: #007bff; /* Blue */
  color: white;
}
.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.editor-container {
  flex-grow: 1; /* Editor takes remaining space */
  overflow: hidden; /* Important for Monaco editor to not overflow */
}

.results-panel {
  padding: 16px;
  background-color: #252526;
  color: #ccc;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
  line-height: 1.4;
  overflow-y: auto;
  border-top: 1px solid #333; /* if it's below testcase inputs */
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
  background-color: #1e1e1e; /* Match editor bg */
  padding: 10px;
  border-radius: 4px;
}
.results-panel div span { /* For status highlighting */
    font-weight: bold;
}
.status-accepted { color: #5cb85c; }
.status-error { color: #d9534f; }
.status-compilation-error { color: #f0ad4e; }
.status-processing { color: #777; }

.no-submission-placeholder {
    text-align: center;
    color: #777;
    padding: 30px;
}

/* For loading problem details */
.loading-problem-message, .error-problem-message {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #555;
}
.error-problem-message {
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  border-radius: 4px;
  margin: 20px;
}


/* Test Case Specific Styles */
.testcase-results-content {
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensure it tries to fill parent if possible */
}
.testcase-toolbar {
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #333;
  display: flex;
  gap: 10px;
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
  margin-bottom: 15px;
}

.testcase-item {
  padding: 10px;
  border: 1px solid #333;
  border-radius: 4px;
  margin-bottom: 10px;
  background-color: #2a2a2a;
}
.testcase-item.selected {
  border-color: #007bff;
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
.results-run-tests {
    /* This panel might need a max-height if custom-testcases-list doesn't fill remaining space well */
    /* Or a fixed height, or let the parent scroll if it's too much content */
    flex-shrink: 0; /* Prevent it from shrinking if content above is large */
}

</style>
