/** @file Filter the static example gallery and enlarge its real-editor captures. */
const search = document.querySelector('#language-search');
const examples = [...document.querySelectorAll('.example')];
const count = document.querySelector('#example-count');
const empty = document.querySelector('#empty');
const viewer = document.querySelector('#viewer');
const preview = viewer.querySelector('img');
const title = viewer.querySelector('strong');

const heroPreview = document.querySelector('.hero-preview');
const languageButtons = [...document.querySelectorAll('.preview-languages button')];

/** Reuse the gallery's real captures for the manually selected hero language. */
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    const example = document.getElementById(button.dataset.example);
    const image = example.querySelector('.preview img');
    const name = example.querySelector('h3').textContent;
    heroPreview.href = image.src;
    heroPreview.dataset.title = name;
    heroPreview.setAttribute('aria-label', `Enlarge ${name} screenshot`);
    heroPreview.querySelector('img').src = image.src;
    heroPreview.querySelector('img').alt = image.alt;
    for (const languageButton of languageButtons) {
      languageButton.setAttribute('aria-pressed', String(languageButton === button));
    }
  });
}
document.querySelector('.preview-languages').hidden = false;

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
