/** @file Filter the static example gallery and enlarge its real-editor captures. */
const search = document.querySelector('#language-search');
const examples = [...document.querySelectorAll('.example')];
const count = document.querySelector('#example-count');
const empty = document.querySelector('#empty');
const viewer = document.querySelector('#viewer');
const preview = viewer.querySelector('img');
const title = viewer.querySelector('strong');

/** Switch the hero between real captures without loading an editor. */
const hero = document.querySelector('.hero-preview');
document.querySelector('#preview-language').addEventListener('change', event => {
  const example = document.getElementById(event.target.value);
  const image = example.querySelector('.preview img');
  const name = example.querySelector('h3').textContent;
  hero.href = image.src;
  hero.dataset.title = name;
  hero.setAttribute('aria-label', `Enlarge ${name} screenshot`);
  hero.querySelector('img').src = image.src;
  hero.querySelector('img').alt = image.alt;
  document.querySelector('.hero-editor figcaption').textContent = `${name} · Captured in Visual Studio Code`;
});

/** Keep the result count and empty state in sync with visible examples. */
search.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  for (const example of examples) {
    example.hidden = !example.dataset.search.includes(query);
    if (!example.hidden) visible++;
  }
  count.textContent = `${visible} of ${examples.length} languages`;
  empty.hidden = visible !== 0;
});

// The ordinary image links remain usable when JavaScript is unavailable.
for (const link of document.querySelectorAll('.preview')) {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    preview.src = link.href;
    preview.alt = link.querySelector('img').alt;
    title.textContent = link.dataset.title ?? link.closest('.example').querySelector('h3').textContent;
    viewer.showModal();
  });
}
viewer.querySelector('button').addEventListener('click', () => viewer.close());
