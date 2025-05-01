<template>
  <div class="problem-view">
    <div class="problem-header">
      <button class="back-button" @click="router.back()">← Back to Problems</button>
    </div>
    <Splitpanes class="default-theme" style="height: calc(100vh - 70px)">
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
            <button class="run-button run-tests-button" @click="runUserTests" :disabled="isLoading || isLoadingUserTests">
              {{ isLoadingUserTests ? 'Running Custom Tests...' : 'Run Tests' }}
            </button>
            <button class="run-button submit-button" @click="runCode" :disabled="isLoading || isLoadingUserTests">
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
import { ref, computed, shallowRef, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import MonacoEditor from '@/components/MonacoEditor.vue'
import type * as monaco from 'monaco-editor'
import { marked } from 'marked'
import axios from 'axios'

const router = useRouter()
const isLoading = ref(false)
const isLoadingUserTests = ref(false)

const runTestsStatus = ref<string | null>(null)
const runTestsResultsOutput = ref<string | null>(null)
const customTestResults = ref<Array<{ id: number; index: number; status: string; output?: string; error?: string; expected?: string; got?: string }>>([])

const submitStatus = ref<string | null>(null)
const submitResultsOutput = ref<string | null>(null)
const submitTime = ref<string | null>(null)
const submitMemory = ref<string | null>(null)
const passedTests = ref<number | null>(null)
const totalTests = ref<number | null>(null)

const activeTab = ref('description')

interface CustomTestCase {
  id: number;
  numsInput: string;
  targetInput: string;
}
let nextTestCaseId = ref(1);
const customTestCases = ref<CustomTestCase[]>([
  { id: nextTestCaseId.value++, numsInput: '[2, 7, 11, 15]', targetInput: '9' },
]);
const selectedTestCaseId = ref(customTestCases.value[0].id);

const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
  editorInstance.value = editor
}

const code = ref(`from typing import List

def two_sum(nums: List[int], target: int) -> List[int]:
    """
    Given an array of integers nums and an integer target, return indices
    of the two numbers such that they add up to target.

    You may assume that each input would have exactly one solution,
    and you may not use the same element twice.

    You can return the answer in any order.

    Args:
        nums: A list of integers.
        target: The target sum.

    Returns:
        A list containing the indices of the two numbers.
        Return an empty list if no solution is found.
    """
    # --- WRITE YOUR SOLUTION HERE ---

    pass # Remove this line and implement your solution

    # --- END OF SOLUTION ---
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

const BACKEND_PROXY_URL = 'http://localhost:3000'

const formatStdin = (numsStr: string, targetStr: string): string | null => {
  let formattedNums = numsStr.trim();
  if (!formattedNums.startsWith('[') || !formattedNums.endsWith(']')) {
      if (!formattedNums.includes('[') && formattedNums.includes(',')) {
          formattedNums = `[${formattedNums}]`;
      } else {
          console.warn('Cannot reliably format nums input into a list.');
          return null;
      }
  }
  try {
    JSON.parse(formattedNums);
  } catch { 
    console.error('Nums input is not valid JSON'); 
    return null;
  }
  if (isNaN(parseInt(targetStr.trim()))) { 
    console.error('Target input is not a valid number'); 
    return null; 
  }

  return `${formattedNums}\n${targetStr.trim()}`;
};

const clearResults = () => {
  runTestsStatus.value = null;
  runTestsResultsOutput.value = null;
  customTestResults.value = [];

  submitStatus.value = null;
  submitResultsOutput.value = null;
  submitTime.value = null;
  submitMemory.value = null;
  passedTests.value = null;
  totalTests.value = null;
}

const addTestCase = () => {
  if (customTestCases.value.length < 5) {
    const newId = nextTestCaseId.value++;
    customTestCases.value.push({ id: newId, numsInput: '', targetInput: '' });
    selectedTestCaseId.value = newId;
  }
};

const deleteSelectedTestCase = () => {
  if (customTestCases.value.length > 1) {
    const indexToDelete = customTestCases.value.findIndex(tc => tc.id === selectedTestCaseId.value);
    if (indexToDelete !== -1) {
      customTestCases.value.splice(indexToDelete, 1);
      if (indexToDelete > 0) {
        selectedTestCaseId.value = customTestCases.value[indexToDelete - 1].id;
      } else if (customTestCases.value.length > 0) {
        selectedTestCaseId.value = customTestCases.value[0].id;
      }
    }
  }
};

const runCode = async () => {
  if (!editorInstance.value) {
    console.error('Editor instance not available.')
    submitResultsOutput.value = 'Error: Editor not ready.'
    submitStatus.value = 'Error'
    return
  }

  isLoading.value = true
  clearResults()
  submitStatus.value = 'Submitting...'
  activeTab.value = 'submissions'

  const userSolutionCode = editorInstance.value.getValue()
  const problemId = 'two-sum'

  try {
    const response = await axios.post(`${BACKEND_PROXY_URL}/api/run-tests`, {
      problem_id: problemId,
      language_id: 71,
      user_code: userSolutionCode,
    })
    console.log('Backend Submit Response:', response.data)

    submitStatus.value = response.data.status || 'Unknown Status'
    submitTime.value = response.data.time ? `${response.data.time}s` : null
    submitMemory.value = response.data.memory ? `${(response.data.memory / 1024).toFixed(2)} MB` : null
    passedTests.value = response.data.passedTests
    totalTests.value = response.data.totalTests

    if (response.data.status === 'Accepted') {
      submitResultsOutput.value = response.data.output || 'Accepted'
    } else {
      let failureMsg = response.data.error || 'Execution failed.'
      if (response.data.details) {
        failureMsg += `\n---\nDetails:\n`
        if (response.data.details.input) {
          failureMsg += `Input: ${JSON.stringify(response.data.details.input)}\n`
        }
        if (response.data.details.error && typeof response.data.details.error === 'string') {
           if (!failureMsg.includes(response.data.details.error)) {
                 failureMsg += `Error Info: ${response.data.details.error}\n`
            }
        }
      }
      submitResultsOutput.value = failureMsg;
    }
  } catch (error: any) {
    console.error('Error submitting code:', error)
    submitStatus.value = error.response?.data?.status || 'Submission Failed'
    submitResultsOutput.value = `Error: ${error.response?.data?.error || error.message || 'Unknown network or backend error'}`
  } finally {
    isLoading.value = false
  }
}

const runUserTests = async () => {
  if (!editorInstance.value) return;
  isLoadingUserTests.value = true;
  clearResults();
  runTestsStatus.value = 'Running Custom Tests...';
  activeTab.value = 'testcase';

  const userCode = editorInstance.value.getValue();
  const results: typeof customTestResults.value = [];
  let overallStatus = "All Passed";

  for (let i = 0; i < customTestCases.value.length; i++) {
    const testCase = customTestCases.value[i];
    const currentTestIndex = i + 1;
    runTestsStatus.value = `Running Custom Test ${currentTestIndex}/${customTestCases.value.length}...`;

    const stdin = formatStdin(testCase.numsInput, testCase.targetInput);
    if (!stdin) {
      results.push({ id: testCase.id, index: currentTestIndex, status: 'Input Error', error: 'Invalid input format for Nums or Target.' });
      overallStatus = "Input Error";
      continue;
    }

    try {
      const [userResult, correctResult] = await Promise.all([
        axios.post(`${BACKEND_PROXY_URL}/api/submit`, { language_id: 71, source_code: userCode, stdin: stdin }),
        axios.post(`${BACKEND_PROXY_URL}/api/submit`, { language_id: 71, source_code: correctSolutionCode, stdin: stdin })
      ]);

      console.log(`Custom Test ${currentTestIndex} User Result:`, userResult.data);
      console.log(`Custom Test ${currentTestIndex} Correct Result:`, correctResult.data);

      const userStatusId = userResult.data?.status?.id;
      const correctStatusId = correctResult.data?.status?.id;

      if (correctStatusId !== 3) {
          results.push({ id: testCase.id, index: currentTestIndex, status: 'System Error', error: `Correct solution failed (Status: ${correctResult.data?.status?.description}). Check test input or backend.`, output: `Correct stderr: ${correctResult.data?.stderr}` });
          overallStatus = "System Error";
          continue;
      }

      if (userStatusId !== 3) {
         results.push({ id: testCase.id, index: currentTestIndex, status: userResult.data?.status?.description || 'Failed', error: `Execution failed.`, output: `stderr: ${userResult.data?.stderr || userResult.data?.compile_output || ''}` });
         overallStatus = userResult.data?.status?.description || 'Failed';
         continue;
      }

      const userOutput = userResult.data.stdout?.trim();
      const correctOutput = correctResult.data.stdout?.trim();

      if (userOutput === correctOutput) {
        results.push({ id: testCase.id, index: currentTestIndex, status: 'Passed', output: userOutput });
      } else {
        results.push({ id: testCase.id, index: currentTestIndex, status: 'Wrong Answer', expected: correctOutput, got: userOutput });
        overallStatus = "Wrong Answer";
      }

    } catch (error: any) {
      console.error(`Error running custom test case ${currentTestIndex}:`, error);
      results.push({ id: testCase.id, index: currentTestIndex, status: 'Network/Server Error', error: error.message });
      overallStatus = "Network/Server Error";
    }
  }

  customTestResults.value = results;
  runTestsStatus.value = overallStatus;

  let summary = `Finished running ${customTestCases.value.length} custom tests.
Status: ${overallStatus}

`;
  results.forEach(r => {
      summary += `Test Case ${r.index}: ${r.status}
`;
      if (r.status !== 'Passed') {
          if (r.expected) summary += `  Expected: ${r.expected}
`;
          if (r.got) summary += `  Got: ${r.got}
`;
          if (r.error) summary += `  Error: ${r.error}
`;
          if (r.output) summary += `  Output/stderr: ${r.output}
`;
      }
       summary += `----\n`;
  });
  runTestsResultsOutput.value = summary;

  isLoadingUserTests.value = false;
};

const statusClass = (currentStatus: string | null) => {
  if (!currentStatus) return '';
  if (currentStatus === 'Accepted' || currentStatus === 'All Passed') return 'status-accepted';
  if (currentStatus === 'Input Error' || currentStatus === 'Configuration Error' || currentStatus === 'System Error' || currentStatus === 'Network/Server Error') return 'status-error';
  if (currentStatus.includes('Error') || currentStatus.includes('Failed') || currentStatus.includes('Wrong')) return 'status-error';
  if (currentStatus.startsWith('Submitting') || currentStatus.startsWith('Running')) return 'status-submitting';
  return 'status-other';
};

const correctSolutionCode = `
from typing import List

def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            # Ensure indices are sorted for consistent comparison
            res = sorted([seen[complement], i]) 
            return res
        seen[num] = i
    # According to problem constraints, a solution always exists,
    # but return empty list as a fallback (though it shouldn't be reached)
    return []
`;
</script>

<style scoped>
.problem-view {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}

.problem-header {
  padding: 10px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
  height: 50px;
  display: flex;
  align-items: center;
}

.back-button {
  background: none;
  border: none;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.splitpanes {
  flex-grow: 1;
}

.left-pane-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.left-pane-toolbar {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.tab-button {
  padding: 10px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 0.9rem;
  color: #666;
}

.tab-button.active {
  border-bottom-color: #00af9b;
  color: #00af9b;
  font-weight: 600;
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.testcase-results-content {
    /* Container for testcase management and results */
}

.testcase-toolbar {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.testcase-toolbar button {
  padding: 5px 10px;
  font-size: 0.85rem;
  background-color: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.testcase-toolbar button:hover:not(:disabled) {
  background-color: #d5d5d5;
}

.testcase-toolbar button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.custom-testcases-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.testcase-item {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  align-items: flex-start;
  background-color: #f9f9f9;
}

.testcase-item.selected {
  border-color: #00af9b;
  background-color: #e6f7f5;
}

.testcase-radio {
  margin-right: 10px;
  margin-top: 5px;
  flex-shrink: 0;
}

.testcase-label {
    font-weight: 600;
    margin-right: 15px;
    min-width: 80px;
    margin-top: 8px;
    flex-shrink: 0;
    cursor: pointer;
}

.testcase-inputs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-grow: 1;
}

.input-group {
    display: flex;
    align-items: center;
    gap: 5px;
}

.input-group label {
    font-size: 0.85rem;
    min-width: 50px;
    text-align: right;
}

.input-group input[type="text"] {
    flex-grow: 1;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 4px 6px;
    font-family: monospace;
    font-size: 0.9rem;
}

.results-panel {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 150px;
    padding: 10px 15px;
    margin-top: 15px;
}

.results-run-tests h3 {
    font-size: 1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
    margin-bottom: 8px;
    color: #333;
    flex-shrink: 0;
}

.results-run-tests > div { margin-bottom: 5px; flex-shrink: 0; }

.results-run-tests pre {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    color: #333;
    flex-grow: 1;
    min-height: 50px;
    overflow-y: auto;
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.85rem;
}

.results-submission {
    background-color: #f0f0f0;
    color: #333;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 150px;
    padding: 10px 15px;
    margin-top: 15px;
}

.results-submission h3 {
    font-size: 1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
    margin-bottom: 8px;
    color: #333;
    flex-shrink: 0;
}

.results-submission > div { margin-bottom: 5px; flex-shrink: 0; }

.results-submission pre {
    background-color: #fff;
    border: 1px solid #e0e0e0;
    color: #333;
    flex-grow: 1;
    min-height: 50px;
    overflow-y: auto;
    margin-top: 10px;
    padding: 10px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.85rem;
}

.no-submission-placeholder {
    padding: 20px;
    text-align: center;
    color: #777;
    font-style: italic;
}

.editor-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1e1e1e;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
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

.editor-container {
  flex-grow: 1;
  background-color: #1e1e1e;
  min-height: 0;
}

.submit-button {
    /* background-color: #007bff; */
}

.results-panel.results-run-tests .custom-test-result {
    margin-bottom: 5px;
    padding-bottom: 5px;
    border-bottom: 1px dashed #eee;
}
.results-panel.results-run-tests .custom-test-result:last-child {
    border-bottom: none;
}
</style>
