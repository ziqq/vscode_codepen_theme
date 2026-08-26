<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
const theme = 'CodePen Theme Original';
</script>

<template>
  <button v-if="theme" :class="{ active: count > 0 }" @click="count += 1">
    {{ theme }}: {{ count }}
  </button>
</template>

<style scoped>
button.active { color: #96b38a; }
</style>
