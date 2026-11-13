/** @file Compare inline and dialog editing while retaining one Monaco instance and its models. */
const names = { typescript: ['TypeScript React', 'typescriptreact', 'index.tsx'], dart: ['Dart', 'dart', 'main.dart'], rust: ['Rust', 'rust', 'main.rs'] };
const dialog = document.querySelector('#editor-dialog');
const screenshot = document.querySelector('#screenshot');
const inlineHost = document.querySelector('#inline-host');
const dialogHost = document.querySelector('#dialog-host');
const editButton = document.querySelector('#edit');
const status = document.querySelector('#load-status');
const caption = document.querySelector('#preview-caption');
let mode = 'inline';
let language = 'typescript';
let preview;
let panel;
let loading;
let active = false;

/** Move the existing editor between layouts, preserving text, cursor and undo history. */
function render() {
  const inDialog = active && mode === 'dialog';
  inlineHost.hidden = !active || inDialog;
  screenshot.hidden = active && !inDialog;
  if (active) {
    (inDialog ? dialogHost : inlineHost).append(panel);
    document.querySelector('#file-name').textContent = names[language][2];
    if (inDialog && !dialog.open) dialog.showModal();
    if (!inDialog && dialog.open) dialog.close();
    preview.layout();
  }
  editButton.textContent = active ? (inDialog ? 'Editor open' : 'Editing') : (mode === 'dialog' ? 'Open editor ↗' : 'Edit code ↗');
  caption.textContent = active && !inDialog ? 'Browser preview · Your edits stay in this tab.' : 'Real VS Code screenshot · Select “Edit code” to try the browser preview.';
}

/** Load Monaco only after a deliberate edit action; retain the screenshot if loading fails. */
async function startEditing() {
  editButton.disabled = true;
  status.textContent = 'Loading editor and theme highlighting…';
  try {
    if (!preview) {
      loading ??= (async () => {
        const module = await import('./build/editor.js');
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = new URL('./build/editor.css', import.meta.url).href;
        await new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; document.head.append(css); });
        panel = document.querySelector('#editor-template').content.firstElementChild.cloneNode(true);
        inlineHost.append(panel);
        preview = module.createPreview(panel.querySelector('#editor-container'));
        await preview.ready;
        panel.querySelector('#reset').addEventListener('click', () => { preview.reset(); preview.focus(); });
      })();
      await loading;
    }
    await preview.setLanguage(language);
    active = true;
    render();
    preview.focus();
    status.textContent = '';
  } catch (error) {
    if (!active && preview) { preview.dispose(); preview = undefined; panel?.remove(); panel = undefined; }
    loading = undefined;
    status.textContent = 'Editor could not load. The screenshot is still available; try again.';
    console.error(error);
  } finally { editButton.disabled = false; }
}
editButton.addEventListener('click', startEditing);
for (const button of document.querySelectorAll('[data-language]')) {
  button.addEventListener('click', () => {
    language = button.dataset.language;
    const [name, image] = names[language];
    screenshot.href = `../screenshots/${image}.webp`;
    screenshot.querySelector('img').src = screenshot.href;
    screenshot.querySelector('img').alt = `${name} in CodePen Theme Original`;
    for (const item of document.querySelectorAll('[data-language]')) item.setAttribute('aria-pressed', String(item.dataset.language === language));
    if (preview) preview.setLanguage(language).catch(console.error);
    render();
  });
}
for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    for (const item of document.querySelectorAll('[data-mode]')) item.setAttribute('aria-pressed', String(item === button));
    document.querySelector('#concept-description').textContent = mode === 'inline'
      ? 'Код редактируется прямо в первом экране. Редактор загрузится только после нажатия кнопки.'
      : 'Первый экран остаётся со скриншотом, редактор открывается в большом окне. Правки сохраняются при смене варианта.';
    render();
  });
}
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { if (mode === 'dialog') { active = false; render(); } });
