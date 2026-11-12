<script lang="ts">
  let count = 0;
  const theme = 'CodePen Theme Original';
  const tokens = ['keyword', 'string', 'comment'];

  const increment = () => {
    count += 1;
  };

  $: label = `${theme}: ${count}`;
</script>

<section class:active={count > 0} aria-label={theme}>
  <button on:click={increment}>{label}</button>
  <ul>
    {#each tokens as token, index}
      <li data-index={index}>{token}</li>
    {/each}
  </ul>
</section>

<style>
  section { background: #1d1e22; padding: 1rem; }
  section.active button { color: #96b38a; }
  li { color: #717790; }
</style>

{#if count > 2}
  <aside data-state="busy">
    {@html `<strong>${theme}</strong>`}
  </aside>
{:else if count === 0}
  <small>Choose a token to start.</small>
{:else}
  <small>{count} token{count === 1 ? '' : 's'} selected.</small>
{/if}

<svelte:head>
  <meta name="theme-color" content="#1d1e22" />
</svelte:head>
