<script lang="ts">
  let count = 0;
  const theme = 'CodePen Theme Original';
</script>

<button class:active={count > 0} on:click={() => count += 1}>
  {theme}: {count}
</button>

<style>
  button.active { color: #96b38a; }
</style>
