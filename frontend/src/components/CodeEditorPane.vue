<template>
  <div class="editor-section">
    <div class="editor-header">
      <button
        class="run-button run-tests-button"
        @click="$emit('run-tests-clicked')"
        :disabled="isLoadingProblem || isSubmitting || isTesting"
      >
        {{ isTesting ? 'Running Custom Tests...' : 'Run Tests' }}
      </button>
      <button
        class="run-button submit-button"
        @click="$emit('submit-code-clicked')"
        :disabled="isLoadingProblem || isSubmitting || isTesting"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </div>
    <div class="editor-container">
      <MonacoEditor
        :modelValue="localCode"
        @update:modelValue="onCodeUpdate"
        language="python"
        theme="vs-dark"
        :options="editorOptions"
        @editorDidMount="onEditorMount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type * as monaco from 'monaco-editor'
import MonacoEditor from '@/components/MonacoEditor.vue'

const props = defineProps<{
  codeValue: string
  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions
  isLoadingProblem: boolean
  isSubmitting: boolean
  isTesting: boolean
}>()

const emit = defineEmits<{
  (e: 'update:codeValue', value: string): void
  (e: 'run-tests-clicked'): void
  (e: 'submit-code-clicked'): void
  (e: 'editor-mounted', editor: monaco.editor.IStandaloneCodeEditor): void
}>()

const localCode = ref(props.codeValue)

watch(() => props.codeValue, (newValue) => {
  if (newValue !== localCode.value) {
    localCode.value = newValue
  }
})

const onCodeUpdate = (newCode: string) => {
  localCode.value = newCode
  emit('update:codeValue', newCode)
}

const onEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
  emit('editor-mounted', editor)
}
</script>

<style scoped>
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
  overflow: hidden; /* Added by previous step, seems fine */
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
</style>
