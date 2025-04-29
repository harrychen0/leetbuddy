<template>
  <div>
    <h1>Problem {{ id }}</h1>
    <router-link to="/">Back to Home</router-link>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  id: string
}>()
</script>
