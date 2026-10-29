const { Spans } = require('./spans');
const { addComment } = require('./comments');

// Line-oriented and markup formats do not benefit from the declaration tree
// used for programming languages. Their compact refiners model data keys,
// substitutions, commands, and references directly from source structure.

function lines(source, callback) {
  let offset = 0;
  for (const line of source.split('\n')) {
    callback(line, offset);
    offset += line.length + 1;
  }
}

function trimRange(text, start, end = text.length) {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end };
}

function separatorAt(line) {
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    if (escaped) { escaped = false; continue; }
    if (line[index] === '\\') { escaped = true; continue; }
    if (line[index] === '=' || line[index] === ':') return index;
  }
  return -1;
}

/** INI and Java properties share data roles with TOML/YAML: keys are
 * members, scalar values are strings, and substitutions are bindings. */
function refineConfig(source, language) {
  const spans = new Spans(source.length);
  let continuation = false;
  lines(source, (line, offset) => {
    const leading = line.search(/\S|$/);
    const trimmed = line.slice(leading);
    if (!trimmed) { continuation = false; return; }
    if (!continuation && (trimmed.startsWith(';') || trimmed.startsWith('#'))) {
      addComment(spans, source, offset + leading, offset + line.length);
      return;
    }
    if (!continuation && language === 'ini' && trimmed.startsWith('[') && trimmed.endsWith(']')) {
      spans.add(offset + leading, offset + leading + 1, 'white', 40);
      spans.add(offset + leading + 1, offset + line.length - 1, 'purple', 50);
      spans.add(offset + line.length - 1, offset + line.length, 'white', 40);
      return;
    }
    const separator = continuation ? -1 : separatorAt(line);
    if (separator >= 0) {
      const key = trimRange(line, leading, separator);
      spans.add(offset + key.start, offset + key.end, 'purple', 50);
      spans.add(offset + separator, offset + separator + 1,
        line[separator] === ':' ? 'white' : 'operator', 40);
    }
    const value = trimRange(line, separator >= 0 ? separator + 1 : leading);
    if (value.start < value.end) {
      spans.add(offset + value.start, offset + value.end, 'green', 30);
      const scalar = line.slice(value.start, value.end);
      if (/^(?:true|false|yes|no|on|off|null)$/i.test(scalar)) {
        spans.add(offset + value.start, offset + value.end, 'yellow', 45);
      } else if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(scalar)) {
        spans.add(offset + value.start, offset + value.end, 'orange', 45);
      }
      for (const match of scalar.matchAll(/\$\{([^}]+)\}/g)) {
        spans.add(offset + value.start + match.index, offset + value.start + match.index + 2, 'green', 55);
        spans.add(offset + value.start + match.index + 2,
          offset + value.start + match.index + match[0].length - 1, 'blue', 60);
        spans.add(offset + value.start + match.index + match[0].length - 1,
          offset + value.start + match.index + match[0].length, 'green', 55);
      }
    }
    continuation = language === 'properties' && /(?<!\\)(?:\\\\)*\\\s*$/.test(line);
  });
  return spans.finish();
}

function refineDockerfile(source) {
  const spans = new Spans(source.length);
  const stages = new Set();
  lines(source, (line, offset) => {
    const leading = line.search(/\S|$/);
    const trimmed = line.slice(leading);
    if (!trimmed) return;
    if (trimmed.startsWith('#')) {
      addComment(spans, source, offset + leading, offset + line.length);
      return;
    }
    const instruction = /^(\w+)/.exec(trimmed);
    if (!instruction) return;
    const keywordEnd = offset + leading + instruction[1].length;
    spans.add(offset + leading, keywordEnd, 'yellow', 45);
    const restStart = leading + instruction[1].length;
    const upper = instruction[1].toUpperCase();
    if (upper === 'ARG' || upper === 'ENV') {
      for (const match of line.slice(restStart).matchAll(/(?:^|\s)([A-Za-z_][\w.-]*)\s*=/g)) {
        const at = offset + restStart + match.index + match[0].indexOf(match[1]);
        spans.add(at, at + match[1].length, 'blue', 55);
      }
    }
    if (upper === 'FROM') {
      const alias = /\bAS\s+([A-Za-z_][\w.-]*)/i.exec(line);
      if (alias) {
        const at = offset + alias.index + alias[0].lastIndexOf(alias[1]);
        spans.add(at, at + alias[1].length, 'blue', 55);
        stages.add(alias[1]);
      }
    }
    if (upper === 'LABEL') {
      const key = /\b([A-Za-z_][\w.-]*)\s*=/.exec(line.slice(restStart));
      if (key) {
        const at = offset + restStart + key.index + key[0].indexOf(key[1]);
        spans.add(at, at + key[1].length, 'purple', 55);
      }
    }
    for (const match of line.matchAll(/\$\{([A-Za-z_][\w.-]*)\}/g)) {
      spans.add(offset + match.index + 2, offset + match.index + 2 + match[1].length, 'blue', 60);
    }
    for (const match of line.matchAll(/--from=([A-Za-z_][\w.-]*)/g)) {
      if (stages.has(match[1])) {
        const at = offset + match.index + match[0].lastIndexOf(match[1]);
        spans.add(at, at + match[1].length, 'blue', 60);
      }
    }
    for (const match of line.matchAll(/\b\d+(?:\.\d+)?(?:ms|s|m|h)?\b/g)) {
      spans.add(offset + match.index, offset + match.index + match[0].length, 'orange', 35);
    }
  });
  return spans.finish();
}

function refineBibtex(source) {
  const spans = new Spans(source.length);
  for (const match of source.matchAll(/@(\w+)\s*\{\s*([^,\s]+)/g)) {
    spans.add(match.index, match.index + 1, 'white', 45);
    spans.add(match.index + 1, match.index + 1 + match[1].length, 'yellow', 50);
    const keyAt = match.index + match[0].lastIndexOf(match[2]);
    spans.add(keyAt, keyAt + match[2].length, 'blue', 50);
  }
  for (const match of source.matchAll(/^\s*([A-Za-z][\w-]*)\s*=/gm)) {
    const at = match.index + match[0].indexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 55);
  }
  return spans.finish();
}

function maskLatex(source, spans) {
  return source.replace(/%[^\n]*/g, (text, at) => {
    addComment(spans, source, at, at + text.length);
    return ' '.repeat(text.length);
  });
}

function refineLatex(source) {
  const spans = new Spans(source.length);
  const masked = maskLatex(source, spans);
  for (const match of masked.matchAll(/\\[A-Za-z@]+|\\./g)) {
    spans.add(match.index, match.index + match[0].length, 'yellow', 40);
  }
  for (const match of masked.matchAll(/\\(?:newcommand|renewcommand|providecommand)\s*(?:\{\s*)?(\\[A-Za-z@]+)|\\(?:def|edef|gdef|xdef)\s*(\\[A-Za-z@]+)/g)) {
    const name = match[1] ?? match[2];
    const at = match.index + match[0].lastIndexOf(name);
    spans.add(at, at + name.length, 'blue', 65);
  }
  for (const match of masked.matchAll(/#\d+/g)) {
    spans.add(match.index, match.index + match[0].length, 'blue', 60);
  }
  for (const match of masked.matchAll(/\\(?:documentclass|usepackage|begin|end|label|ref|cite)\s*(?:\[[^\]]*\]\s*)?\{([^}]*)\}/g)) {
    const value = match[1];
    const at = match.index + match[0].lastIndexOf(value);
    spans.add(at, at + value.length, /^(?:sec:|fig:|tab:)/.test(value) ? 'blue' : 'green', 55);
  }
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    spans.add(match.index, match.index + match[0].length, 'orange', 30);
  }
  for (const match of masked.matchAll(/[+\-*/=<>]/g)) spans.add(match.index, match.index + 1, 'operator', 35);
  return spans.finish();
}

function refineWat(source) {
  const spans = new Spans(source.length);
  const masked = source.replace(/;;[^\n]*|\(;[\s\S]*?(?:;\)|$)|"(?:\\.|[^"\\])*(?:"|$)/g,
    (text, at) => {
      if (text.startsWith(';')) addComment(spans, source, at, at + text.length);
      else spans.add(at, at + text.length, 'green', 50);
      return text.replace(/[^\n]/g, ' ');
    });
  const declarations = new Set();
  const addDeclaration = (at, name) => {
    spans.add(at, at + name.length, 'blue', 60);
    declarations.add(at);
  };
  // A type is declared only when it opens a top-level form. `(type $name)`
  // inside a function is a reference to the declared signature instead.
  for (const match of masked.matchAll(/^\s*\(type\s+(\$[\w.$-]+)/gm)) {
    const nameAt = match.index + match[0].lastIndexOf(match[1]);
    addDeclaration(nameAt, match[1]);
  }
  for (const match of masked.matchAll(/\((func|param|local|global|memory|table)\s+(\$[\w.$-]+)/g)) {
    const lineStart = masked.lastIndexOf('\n', match.index) + 1;
    const prefix = masked.slice(lineStart, match.index);
    // `(export "name" (func $name))` references an existing function.
    if (match[1] === 'func' && /\(export\b/.test(prefix)) continue;
    const nameAt = match.index + match[0].lastIndexOf(match[2]);
    addDeclaration(nameAt, match[2]);
  }
  for (const match of masked.matchAll(/\bcall\s+(\$[\w.$-]+)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 65);
  }
  for (const match of masked.matchAll(/\(type\s+(\$[\w.$-]+)\)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    if (!declarations.has(at)) spans.add(at, at + match[1].length, 'white', 65);
  }
  for (const match of masked.matchAll(/\(export\b[^()]*\(func\s+(\$[\w.$-]+)\)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 65);
  }
  for (const match of masked.matchAll(/\$[\w.$-]+/g)) {
    if (!declarations.has(match.index)) spans.add(match.index, match.index + match[0].length, 'blue', 45);
  }
  return spans.finish();
}

/** TOML keys and table names are members. Both popular TOML grammars color
 * strings, numbers, and booleans, but the mise extension's grammar leaves keys
 * and table names unscoped, so model them from the document structure. Strings
 * stay with the grammar so template injections such as `{{ version }}` survive. */
function refineToml(source) {
  const spans = new Spans(source.length);
  const stack = [];
  let expectKey = true;
  let index = 0;
  const lineEnd = (at) => { const end = source.indexOf('\n', at); return end < 0 ? source.length : end; };
  function stringEnd(at) {
    const quote = source[at];
    const triple = source.startsWith(quote.repeat(3), at);
    let cursor = at + (triple ? 3 : 1);
    while (cursor < source.length) {
      if (quote === '"' && source[cursor] === '\\') { cursor += 2; continue; }
      if (!triple && source[cursor] === '\n') return cursor;
      if (triple ? source.startsWith(quote.repeat(3), cursor) : source[cursor] === quote) {
        // A closing delimiter may absorb up to two adjacent quote characters.
        let end = cursor + (triple ? 3 : 1);
        while (triple && source[end] === quote && end < cursor + 5) end++;
        return end;
      }
      cursor++;
    }
    return source.length;
  }
  let lastKey = '';
  // Keys are bare, quoted, or dotted segments of either; each name is a member.
  function readKey(at, close) {
    let cursor = at;
    while (cursor < source.length) {
      while (source[cursor] === ' ' || source[cursor] === '\t') cursor++;
      const start = cursor;
      if (source[cursor] === '"' || source[cursor] === "'") cursor = stringEnd(cursor);
      else while (cursor < source.length && /[A-Za-z0-9_-]/.test(source[cursor])) cursor++;
      if (cursor === start) return cursor;
      spans.add(start, cursor, 'purple', 50);
      lastKey = source.slice(start, cursor).replace(/^["']|["']$/g, '');
      while (source[cursor] === ' ' || source[cursor] === '\t') cursor++;
      if (source[cursor] !== '.') return close && source.startsWith(close, cursor) ? cursor + close.length : cursor;
      cursor++;
    }
    return cursor;
  }
  // Tera-style `{{ value.field | filter }}` templates (mise, Cargo generators)
  // are bindings inside the string; the braces keep the string color.
  function templates(start, end) {
    const text = source.slice(start, end);
    for (const match of text.matchAll(/\{\{(.*?)\}\}/g)) {
      const body = start + match.index + 2;
      let previous = '';
      for (const name of match[1].matchAll(/[A-Za-z_][\w]*|[.|]/g)) {
        if (name[0] === '.' || name[0] === '|') { previous = name[0]; continue; }
        const role = previous === '.' ? 'purple' : previous === '|' ? 'yellow' : 'blue';
        spans.add(body + name.index, body + name.index + name[0].length, role, 60);
        previous = '';
      }
    }
  }
  // mise `*_expr` values are expr-lang code: functions, members, the `#`
  // element, nested strings, and operators take their code roles.
  const exprKeywords = new Set(['true', 'false', 'nil', 'and', 'or', 'not', 'in', 'matches',
    'contains', 'startsWith', 'endsWith', 'let', 'if', 'else']);
  function expression(start, end) {
    spans.add(start, end, 'white', 55);
    let cursor = start;
    while (cursor < end) {
      if (/\s/.test(source[cursor])) { cursor++; continue; }
      const rest = source.slice(cursor, end);
      const escaped = rest.startsWith('\\"');
      if (escaped || /^["`]/.test(rest)) {
        const close = escaped ? '\\"' : rest[0];
        let stop = cursor + close.length;
        while (stop < end && !source.startsWith(close, stop)) stop += source[stop] === '\\' && !escaped ? 2 : 1;
        stop = Math.min(end, stop + close.length);
        spans.add(cursor, stop, 'green', 60);
        cursor = stop;
        continue;
      }
      const token = /^(?:#[A-Za-z_]\w*|#|[A-Za-z_]\w*|\d+(?:\.\d+)?|\?\?|[=!<>]=|&&|\|\||[|!<>+\-*/%?:]|\S)/.exec(rest)[0];
      const before = source.slice(start, cursor).trimEnd();
      let role;
      if (token.startsWith('#')) role = 'blue';
      else if (/^[A-Za-z_]/.test(token)) {
        role = before.endsWith('.') ? 'purple'
          : exprKeywords.has(token) || /^\s*\(/.test(source.slice(cursor + token.length, end)) ? 'yellow' : 'blue';
      } else if (/^\d/.test(token)) role = 'orange';
      else if (/^[(){}[\],.]$/.test(token)) role = undefined;
      else role = 'operator';
      if (role) spans.add(cursor, cursor + token.length, role, 60);
      cursor += token.length;
    }
  }
  const date = /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?(?:[Zz]|[+-]\d{2}:\d{2})?|^\d{2}:\d{2}:\d{2}(?:\.\d+)?/;
  const number = /^[+-]?(?:0x[\da-fA-F_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?|inf|nan)$/;
  while (index < source.length) {
    const char = source[index];
    if (char === '\n') { if (!stack.length) expectKey = true; index++; continue; }
    if (/\s/.test(char)) { index++; continue; }
    if (char === '#') { const end = lineEnd(index); addComment(spans, source, index, end); index = end; continue; }
    if (expectKey && !stack.length && char === '[') {
      const array = source[index + 1] === '[';
      index = readKey(index + (array ? 2 : 1), array ? ']]' : ']');
      expectKey = false;
      continue;
    }
    if (expectKey && char !== '}') {
      index = readKey(index);
      if (source[index] === '=') { expectKey = false; index++; } else index = Math.max(index, lineEnd(index));
      continue;
    }
    if (char === '"' || char === "'") {
      const end = stringEnd(index);
      const delimiter = source.startsWith(char.repeat(3), index) ? 3 : 1;
      if (/(?:^|_)expr$/.test(lastKey) && end - index > delimiter * 2) {
        expression(index + delimiter, end - delimiter);
      } else templates(index, end);
      index = end;
      continue;
    }
    if (char === '[') { stack.push('array'); index++; continue; }
    if (char === '{') { stack.push('table'); expectKey = true; index++; continue; }
    if (char === ']' || char === '}') { stack.pop(); expectKey = false; index++; continue; }
    if (char === ',') { expectKey = stack.at(-1) === 'table'; index++; continue; }
    const match = date.exec(source.slice(index, lineEnd(index)));
    if (match) { spans.add(index, index + match[0].length, 'green', 30); index += match[0].length; continue; }
    const start = index;
    while (index < source.length && !/[\s,\]}#]/.test(source[index])) index++;
    const word = source.slice(start, index);
    if (word === 'true' || word === 'false') spans.add(start, index, 'yellow', 30);
    else if (number.test(word)) spans.add(start, index, 'orange', 30);
  }
  return spans.finish();
}

function refineFormat(source, language) {
  if (language === 'toml') return refineToml(source);
  if (language === 'ini' || language === 'properties') return refineConfig(source, language);
  if (language === 'dockerfile') return refineDockerfile(source);
  if (language === 'bibtex') return refineBibtex(source);
  if (language === 'latex' || language === 'tex') return refineLatex(source);
  if (language === 'wat') return refineWat(source);
  return [];
}

const formatLanguages = ['ini', 'properties', 'toml', 'dockerfile', 'bibtex', 'latex', 'tex', 'wat'];

module.exports = { refineFormat, formatLanguages };
