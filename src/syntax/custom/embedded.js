const { withTree } = require('./tree');
const { refineTypeScript } = require('./typescript');
const { Spans } = require('./spans');
const { addComment } = require('./comments');

async function refineEmbedded(source, language, refine) {
  return withTree(source, language, async (root) => {
    const spans = new Spans(source.length);
    const nodes = [];
    const stack = [root];
    while (stack.length) {
      const node = stack.pop(); nodes.push(node); stack.push(...node.namedChildren);
    }
    const script = nodes.filter((node) => node.type === 'raw_text' && node.parent.type === 'script_element');
    const style = nodes.filter((node) => node.type === 'raw_text' && node.parent.type === 'style_element');
    function scriptMode(node) {
      const tag = node.parent.namedChildren.find((child) => child.type === 'start_tag')?.text ?? '';
      if (/\btype\s*=\s*["']application\/(?:ld\+)?json["']/.test(tag)) return 'json';
      if (/\btype\s*=\s*["']text\/plain["']/.test(tag)) return undefined;
      const mode = /\blang\s*=\s*["'](jsx|tsx?|javascript|typescript)["']/.exec(tag)?.[1];
      return { jsx: 'javascriptreact', ts: 'typescript', tsx: 'typescriptreact',
        javascript: 'javascript', typescript: 'typescript' }[mode] ?? 'javascript';
    }
    const scriptRegions = script.map((node) => ({ node, mode: scriptMode(node) }));
    // SFC template expressions share script declarations but do not execute code.
    const declarations = scriptRegions
      .filter(({ mode }) => mode?.includes('script'))
      .map(({ node }) => node.text)
      .join('\n');
    for (const { node, mode } of scriptRegions) {
      if (!mode) continue;
      const refined = mode === 'json' ? await refine(node.text, mode) : refineTypeScript(node.text, mode);
      for (const span of refined) {
        spans.add(node.startIndex + span.start, node.startIndex + span.end, span.role, 20);
      }
    }
    for (const node of style) {
      const tag = node.parent.namedChildren.find((child) => child.type === 'start_tag')?.text ?? '';
      const mode = /\blang\s*=\s*["'](sass|scss)["']/.exec(tag)?.[1] ?? 'css';
      for (const span of await refine(node.text, mode)) {
        spans.add(node.startIndex + span.start, node.startIndex + span.end,
          span.role, 20, span.fontStyle);
      }
    }
    const embeddedJson = nodes.filter((node) => node.type === 'text' && node.parent.type === 'element' &&
      /^<i18n\b[^>]*\blang\s*=\s*["']json["']/i.test(
        node.parent.namedChildren.find((child) => child.type === 'start_tag')?.text ?? '',
      ));
    for (const node of embeddedJson) {
      for (const span of await refine(node.text, 'json')) {
        spans.add(node.startIndex + span.start, node.startIndex + span.end,
          span.role, 20, span.fontStyle);
      }
    }
    const ancestor = (node, predicate) => {
      for (let parent = node.parent; parent; parent = parent.parent) if (predicate(parent)) return parent;
    };
    function fragment(node, text, at, prefix, suffix) {
      for (const span of refineTypeScript(`${prefix}${text}${suffix}`, 'typescript')) {
        const start = Math.max(span.start - prefix.length, 0);
        const end = Math.min(span.end - prefix.length, text.length);
        if (start < end) spans.add(node.startIndex + at + start, node.startIndex + at + end, span.role, 20);
      }
    }
    for (const node of nodes) {
      if (/comment/.test(node.type)) {
        addComment(spans, source, node.startIndex, node.endIndex);
        continue;
      }
      if (language === 'markdown' && node.type === 'code_fence_content') {
        const info = node.parent.namedChildren.find((child) => child.type === 'info_string')?.text.trim().split(/\s+/)[0];
        const mode = { js: 'javascript', javascript: 'javascript', ts: 'typescript', typescript: 'typescript',
          jsx: 'javascriptreact', tsx: 'typescriptreact', dart: 'dart', java: 'java', py: 'python',
          python: 'python', rust: 'rust', go: 'go', kotlin: 'kotlin', swift: 'swift', cpp: 'cpp',
          c: 'c', csharp: 'csharp', make: 'makefile', just: 'just', sh: 'shellscript' }[info];
        if (mode) for (const span of await refine(node.text, mode)) {
          spans.add(node.startIndex + span.start, node.startIndex + span.end, span.role, 20, span.fontStyle);
        }
        continue;
      }
      const expression = (language === 'svelte' && node.type === 'raw_text_expr') ||
        (language === 'svelte' && node.type === 'raw_text_each') ||
        (language === 'vue' && node.type === 'raw_text' && node.parent.type === 'interpolation') ||
        (language === 'vue' && node.type === 'attribute_value' && ancestor(node, (item) => item.type === 'directive_attribute'));
      if (!expression) continue;
      const directive = ancestor(node, (item) => item.type === 'directive_attribute');
      if (directive && /^v-for\s*=/.test(directive.text)) {
        const loop = /^\s*(?:\(([^)]+)\)|([\w$]+))\s+(?:in|of)\s+([\s\S]+)$/d.exec(node.text);
        if (loop) {
          const binding = loop[1] !== undefined ? 1 : 2;
          fragment(node, loop[binding], loop.indices[binding][0], 'const [', '] = [];');
          fragment(node, loop[3], loop.indices[3][0], `${declarations}\n(`, ');');
        }
        continue;
      }
      if (language === 'svelte' && node.parent.type === 'each_start_expr' && node.type === 'raw_text_expr') {
        fragment(node, node.text, 0, 'const [', '] = [];');
        continue;
      }
      const locals = [];
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (parent.type === 'each_statement') {
          const header = parent.namedChildren.find((child) => child.type === 'each_start_expr');
          const bindings = header?.namedChildren.find((child) => child.type === 'raw_text_expr');
          if (bindings && !ancestor(node, (item) => item.type === 'each_start_expr')) locals.push(bindings.text);
        }
        if (parent.type === 'element' && language === 'vue') {
          const tag = parent.namedChildren.find((child) => child.type === 'start_tag');
          const loop = tag?.namedChildren.find((child) => child.type === 'directive_attribute' && /^v-for\s*=/.test(child.text));
          const value = loop?.namedChildren.find((child) => child.type === 'quoted_attribute_value')?.namedChildren[0]?.text;
          const match = value && /^\s*(?:\(([^)]+)\)|([\w$]+))\s+(?:in|of)\s+/.exec(value);
          if (match) locals.push(match[1] ?? match[2]);
        }
      }
      const prefix = `${declarations}\nfunction __codepen_template(${locals.join(',')}) { return (`;
      const result = refineTypeScript(`${prefix}${node.text}); }`, 'typescript');
      for (const span of result) {
        const start = Math.max(span.start - prefix.length, 0);
        const end = Math.min(span.end - prefix.length, node.text.length);
        if (start < end) spans.add(node.startIndex + start, node.startIndex + end, span.role, 20);
      }
    }
    return spans.finish();
  });
}

module.exports = { refineEmbedded };
