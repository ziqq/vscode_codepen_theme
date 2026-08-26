<script setup lang="ts">
import { computed, ref } from 'vue';

const count = ref(0);
const theme = 'CodePen Theme Original';
const tokens = ['keyword', 'string', 'comment'];
const label = computed(() => `${theme}: ${count.value}`);

function increment(): void {
  count.value += 1;
}
</script>

<template>
  <section v-if="theme" :class="{ active: count > 0 }" :data-theme="theme">
    <button type="button" @click="increment">{{ label }}</button>
    <ul>
      <li v-for="(token, index) in tokens" :key="token" :data-index="index">
        {{ token }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
section { background: #1d1e22; padding: 1rem; }
section.active button { color: #96b38a; }
li { color: #717790; }
</style>
