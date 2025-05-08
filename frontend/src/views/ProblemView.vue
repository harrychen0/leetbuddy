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
            <TestcaseTab ref="testcaseTabRef" :problemDetails="problemDetails" :editorInstance="editorInstance.value" />
          </div>

          <div v-if="activeTab === 'submissions'" class="tab-content submission-results-content">
            <SubmissionsTab
              :isLoading="isLoading"
              :submitStatus="submitStatus"
              :submitTime="submitTime"
              :submitMemory="submitMemory"
              :passedTests="passedTests"
              :totalTests="totalTests"
              :submitResultsOutput="submitResultsOutput"
            />
          </div>
        </div>
      </Pane>
      <Pane size="60">
        <CodeEditorPane
          v-model:codeValue="code"
          :editorOptions="editorOptions"
          :isLoadingProblem="isLoadingProblem"
          :isSubmitting="isLoading"
          :isTesting="testcaseTabRef?.isLoadingUserTests ?? false"
          @run-tests-clicked="testcaseTabRef?.runUserTests()"
          @submit-code-clicked="runCode"
          @editor-mounted="handleEditorMount"
        />
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
import TestcaseTab from '@/components/TestcaseTab.vue'
import SubmissionsTab from '@/components/SubmissionsTab.vue'
import CodeEditorPane from '@/components/CodeEditorPane.vue'
import type * as monaco from 'monaco-editor'
import { judge0Service, type ProblemDetails } from '@/services/judge0.ts'

const route = useRoute()
const router = useRouter()

// Problem Details State
const problemDetails = ref<ProblemDetails | null>(null)
const isLoadingProblem = ref(true)
const problemError = ref<string | null>(null)

// Editor and Submission State
const isLoading = ref(false) // For main submission

const submitStatus = ref<string | null>(null)
const submitResultsOutput = ref<string | null>(null)
const submitTime = ref<string | null>(null)
const submitMemory = ref<string | null>(null)
const passedTests = ref<number | null>(null)
const totalTests = ref<number | null>(null)

const activeTab = ref('description')

const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const testcaseTabRef = ref<InstanceType<typeof TestcaseTab> | null>(null) // Ref for TestcaseTab component

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

/* For loading problem details */
.loading-problem-message, .error-problem-message {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #555;
  margin: 20px;
}
.error-problem-message {
  color: #d9534f;
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  border-radius: 4px;
}

</style>
