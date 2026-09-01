const { grammars, refineTree } = require('./tree');
const { refineTypeScript } = require('./typescript');
const { Spans } = require('./spans');
const { refineEmbedded } = require('./embedded');
const { refineSimple } = require('./simple');
const { addComment } = require('./comments');

const scriptLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];
const supportedLanguages = [
  ...scriptLanguages,
  ...Object.keys(grammars),
  'dotenv',
  'sass',
  'scss',
  'css',
  'c4',
];
const maximumDocumentLength = 250_000;

function refineDotenv(source) {
  const spans = new Spans(source.length);
  let offset = 0;
  for (const line of source.split('\n')) {
    const assignment = /^(\s*(?:export\s+)?)([\w.-]+)(\s*=\s*)(.*)$/.exec(line);
    if (assignment) {
      const start = offset + assignment[1].length;
      const valueStart = start + assignment[2].length + assignment[3].length;
      spans.add(start, start + assignment[2].length, 'blue');
      const value = assignment[4];
      let quote;
      let comment = value.length;
      for (let index = 0; index < value.length; index++) {
        if (value[index] === '\\' && quote !== "'") { index++; continue; }
        if (value[index] === quote) quote = undefined;
        else if (!quote && ['"', "'", '`'].includes(value[index])) quote = value[index];
        else if (!quote && value[index] === '#') { comment = index; break; }
      }
      spans.add(valueStart, valueStart + comment, 'green');
      addComment(spans, source, valueStart + comment, offset + line.length);
      if (!value.startsWith("'")) {
        for (const match of value.slice(0, comment).matchAll(/(?<!\\)\$\{([A-Za-z_][A-Za-z0-9_]*)(?::[-+?][^}]*)?\}/g)) {
          spans.add(valueStart + match.index + 2, valueStart + match.index + 2 + match[1].length, 'blue', 30);
        }
      }
    }
    offset += line.length + 1;
  }
  return spans.finish();
}

async function refine(source, language) {
  if (typeof source !== 'string' || source.length > maximumDocumentLength) return [];
  if (scriptLanguages.includes(language)) return refineTypeScript(source, language);
  if (language === 'dotenv') return refineDotenv(source);
  if (['sass', 'scss', 'css', 'c4'].includes(language)) return refineSimple(source, language);
  if (['html', 'vue', 'svelte', 'markdown'].includes(language)) return refineEmbedded(source, language, refine);
  return refineTree(source, language);
}

module.exports = { refine, supportedLanguages, maximumDocumentLength };
