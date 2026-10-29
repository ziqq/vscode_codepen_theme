const { Spans } = require('./spans');

// Tree-sitter provides the common syntax tree in tree.js. This module keeps
// grammar-specific constructs isolated so the shared declaration model stays
// predictable while languages retain their own member and binding forms.

function collect(root) {
  const result = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    result.push(node);
    for (let index = node.childCount - 1; index >= 0; index--) {
      stack.push(node.child(index));
    }
  }
  return result;
}

const field = (node, name) => node?.childForFieldName(name);
const ancestor = (node, predicate) => {
  for (let current = node.parent; current; current = current.parent) {
    if (predicate(current)) return current;
  }
};
const identifier = (node) => node?.type === 'identifier';

function add(spans, node, role, priority = 60) {
  if (node) spans.add(node.startIndex, node.endIndex, role, priority);
}

function directIdentifiers(node) {
  return node?.namedChildren.filter(identifier) ?? [];
}

function groovy(spans, nodes, source) {
  for (const node of nodes) {
    if (node.type === 'class_definition') add(spans, field(node, 'name'), 'blue');
    if (node.type === 'annotation') add(spans, node.namedChildren.find(identifier), 'yellow');
    if (node.type === 'function_definition') {
      add(spans, field(node, 'function'), 'purple');
      add(spans, field(node, 'type'), 'white');
    }
    if (node.type === 'parameter') {
      add(spans, field(node, 'name'), 'blue');
      const type = field(node, 'type');
      if (type) add(spans, type, 'white');
    }
    if (node.type === 'declaration') {
      const member = ancestor(node, (item) => item.type === 'class_definition') &&
        !ancestor(node, (item) => item.type === 'function_definition');
      add(spans, field(node, 'name'), member ? 'purple' : 'blue');
      add(spans, field(node, 'type'), 'white');
    }
    if (node.type === 'type_with_generics') {
      for (const name of node.descendantsOfType('identifier')) add(spans, name, 'white');
    }
    if (node.type === 'dotted_identifier') {
      const names = directIdentifiers(node);
      for (const name of names.slice(1)) add(spans, name, 'purple');
    }
    if (node.type === 'function_call') {
      const fn = field(node, 'function');
      if (identifier(fn)) {
        const prefix = source.slice(Math.max(0, fn.startIndex - 3), fn.startIndex);
        add(spans, fn, /(?:\.|\?\.)\s*$/.test(prefix) ? 'purple' : 'yellow');
      }
      else if (fn?.type === 'dotted_identifier') add(spans, directIdentifiers(fn).at(-1), 'purple');
    }
    if (identifier(node) && node.text === 'it') add(spans, node, 'blue');
    if (identifier(node) && /\bnew\s*$/.test(source.slice(Math.max(0, node.startIndex - 8), node.startIndex))) {
      add(spans, node, 'yellow', 70);
    }
  }
}

function cuda(spans, nodes, source) {
  for (const node of nodes) {
    if (identifier(node) && ancestor(node, (item) => item.type === 'sizeof_expression')) add(spans, node, 'white', 70);
    if (node.type === 'qualified_identifier') {
      add(spans, field(node, 'scope'), 'yellow', 65);
      add(spans, field(node, 'name'), 'purple', 70);
    }
  }
  for (const match of source.matchAll(/^\s*#/gm)) {
    const at = match.index + match[0].lastIndexOf('#');
    spans.add(at, at + 1, 'yellow', 70);
  }
  for (const match of source.matchAll(/\b(?:__global__|__device__|__host__)\s+[A-Za-z_]\w*(?:\s*[*&]\s*)?\s+([A-Za-z_]\w*)\s*\(/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 75);
  }
}

function julia(spans, nodes) {
  const functions = nodes.filter((node) => node.type === 'function_definition');
  const functionOf = (node) => functions.find((candidate) =>
    candidate.startIndex <= node.startIndex && candidate.endIndex >= node.endIndex);
  const localNames = new Map(functions.map((node) => [node.id, new Set()]));
  const globals = new Set();
  const declarationIds = new Set();

  for (const node of nodes) {
    if (node.type === 'module_definition') {
      const name = field(node, 'name');
      if (name) { add(spans, name, 'blue'); globals.add(name.text); declarationIds.add(name.id); }
    }
    if (node.type === 'struct_definition') {
      const name = node.namedChildren[0]?.descendantsOfType('identifier')[0];
      if (name) { add(spans, name, 'blue'); globals.add(name.text); declarationIds.add(name.id); }
      for (const typed of node.descendantsOfType('typed_expression')) {
        const names = typed.namedChildren.filter(identifier);
        if (names[0]) { add(spans, names[0], 'purple'); declarationIds.add(names[0].id); }
        if (names[1]) add(spans, names[1], 'white');
      }
    }
    if (node.type === 'function_definition') {
      const signature = node.namedChildren[0];
      const call = signature?.type === 'typed_expression' ? signature.namedChildren[0] : signature?.namedChildren[0];
      const name = call?.type === 'call_expression' ? call.namedChildren[0] : undefined;
      if (identifier(name)) { add(spans, name, 'blue'); globals.add(name.text); declarationIds.add(name.id); }
      for (const typed of call?.descendantsOfType('typed_expression') ?? []) {
        const names = typed.namedChildren.filter(identifier);
        if (names[0]) { add(spans, names[0], 'blue'); localNames.get(node.id).add(names[0].text); declarationIds.add(names[0].id); }
        if (names[1]) add(spans, names[1], 'white');
      }
    }
    if (node.type === 'assignment') {
      const left = node.namedChildren[0];
      const fn = functionOf(node);
      if (identifier(left)) {
        if (fn) localNames.get(fn.id).add(left.text);
        else globals.add(left.text);
        add(spans, left, 'blue'); declarationIds.add(left.id);
      } else if (left?.type === 'call_expression' && !fn) {
        const name = left.namedChildren[0];
        if (identifier(name)) { add(spans, name, 'blue'); globals.add(name.text); declarationIds.add(name.id); }
        for (const parameter of left.namedChildren.slice(1).flatMap((item) => item.descendantsOfType('identifier'))) {
          add(spans, parameter, 'blue');
        }
      }
    }
    if (node.type === 'for_binding') {
      const name = node.namedChildren.find(identifier);
      const fn = functionOf(node);
      if (name && fn) { localNames.get(fn.id).add(name.text); add(spans, name, 'blue'); declarationIds.add(name.id); }
    }
  }

  for (const node of nodes) {
    if (!identifier(node) || declarationIds.has(node.id)) continue;
    const parent = node.parent;
    if (parent.type === 'field_expression' && parent.namedChildren.at(-1)?.id === node.id) {
      add(spans, node, 'purple'); continue;
    }
    if (ancestor(node, (item) => item.type === 'typed_expression') &&
        parent.type !== 'call_expression') {
      const typed = ancestor(node, (item) => item.type === 'typed_expression');
      if (typed?.namedChildren.at(-1)?.id === node.id) { add(spans, node, 'white'); continue; }
    }
    if (parent.type === 'macro_identifier') { add(spans, node, 'purple'); continue; }
    if (parent.type === 'quote_expression') { add(spans, node, 'green'); continue; }
    if (parent.type === 'call_expression' && parent.namedChildren[0]?.id === node.id) {
      add(spans, node, 'yellow'); continue;
    }
    const fn = functionOf(node);
    if (fn && localNames.get(fn.id)?.has(node.text)) add(spans, node, 'blue');
    else if (globals.has(node.text)) add(spans, node, 'yellow');
  }
  for (const node of nodes) {
    if (node.type === 'quote_expression') add(spans, node, 'green', 70);
    if (node.type === 'string_interpolation' && node.text.startsWith('$(')) {
      spans.add(node.startIndex, node.startIndex + 2, 'green', 75);
      if (node.text.endsWith(')')) spans.add(node.endIndex - 1, node.endIndex, 'green', 75);
    }
  }
}

function lua(spans, nodes) {
  const functions = nodes.filter((node) => node.type === 'function_declaration');
  const functionOf = (node) => functions.filter((candidate) =>
    candidate.startIndex <= node.startIndex && candidate.endIndex >= node.endIndex)
    .sort((left, right) => (left.endIndex - left.startIndex) - (right.endIndex - right.startIndex))[0];
  const locals = new Map(functions.map((node) => [node.id, new Set()]));
  const globals = new Set();
  const declarations = new Set();

  for (const node of nodes) {
    if (node.type === 'variable_declaration') {
      for (const name of field(node.namedChildren[0], 'name')?.type === 'identifier'
        ? [field(node.namedChildren[0], 'name')]
        : node.namedChildren[0]?.descendantsOfType('identifier') ?? []) {
        const fn = functionOf(node);
        if (fn) locals.get(fn.id).add(name.text); else globals.add(name.text);
        add(spans, name, 'blue'); declarations.add(name.id);
      }
    }
    if (node.type === 'parameters' || node.type === 'variable_list' &&
        ['for_generic_clause', 'for_numeric_clause'].includes(node.parent?.type)) {
      const fn = functionOf(node);
      for (const name of directIdentifiers(node)) {
        if (fn) locals.get(fn.id).add(name.text);
        add(spans, name, 'blue'); declarations.add(name.id);
      }
    }
    if (node.type === 'function_declaration') {
      const name = field(node, 'name');
      if (name?.type === 'dot_index_expression') add(spans, field(name, 'field'), 'purple');
      if (name?.type === 'method_index_expression') add(spans, field(name, 'method'), 'purple');
    }
  }

  for (const node of nodes) {
    if (!identifier(node) || declarations.has(node.id)) continue;
    const parent = node.parent;
    if ((parent.type === 'dot_index_expression' && field(parent, 'field')?.id === node.id) ||
        (parent.type === 'method_index_expression' && field(parent, 'method')?.id === node.id) ||
        (parent.type === 'field' && field(parent, 'name')?.id === node.id)) {
      add(spans, node, 'purple'); continue;
    }
    if (node.text === 'self') { add(spans, node, 'yellow'); continue; }
    if (parent.type === 'function_call' && field(parent, 'name')?.id === node.id) {
      add(spans, node, 'yellow'); continue;
    }
    const fn = functionOf(node);
    if (fn && locals.get(fn.id)?.has(node.text)) add(spans, node, 'blue');
    else if (globals.has(node.text)) add(spans, node, 'yellow');
  }
}

function objectiveC(spans, nodes, source) {
  for (const node of nodes) {
    if (['class_interface', 'class_implementation'].includes(node.type)) {
      add(spans, directIdentifiers(node)[0], 'blue');
    }
    if (node.type === 'property_declaration') {
      add(spans, node.descendantsOfType('identifier').at(-1), 'purple');
      for (const type of node.descendantsOfType('type_identifier')) add(spans, type, 'white');
    }
    if (['method_declaration', 'method_definition'].includes(node.type)) {
      for (const name of directIdentifiers(node)) add(spans, name, 'purple');
      for (const parameter of node.descendantsOfType('method_parameter')) {
        add(spans, parameter.descendantsOfType('identifier').at(-1), 'blue');
        for (const type of parameter.descendantsOfType('type_identifier')) add(spans, type, 'white');
      }
    }
    if (node.type === 'message_expression') {
      add(spans, field(node, 'method'), 'purple');
      const receiver = field(node, 'receiver');
      if (identifier(receiver) && /^[A-Z]/.test(receiver.text)) add(spans, receiver, 'yellow');
      const text = node.text;
      for (const match of text.matchAll(/\b([A-Za-z_]\w*)\s*:/g)) {
        spans.add(node.startIndex + match.index, node.startIndex + match.index + match[1].length, 'purple', 65);
      }
    }
    if (node.type === 'type_identifier') add(spans, node, 'white', 50);
    if (identifier(node) && /^_[A-Za-z]/.test(node.text)) add(spans, node, 'purple');
  }
  for (const match of source.matchAll(/^\s*#/gm)) {
    const at = match.index + match[0].lastIndexOf('#');
    spans.add(at, at + 1, 'yellow', 70);
  }
  for (const match of source.matchAll(/\bNS_ENUM\s*\([^,]+,\s*([A-Za-z_]\w*)\s*\)/g)) {
    spans.add(match.index, match.index + 'NS_ENUM'.length, 'yellow', 75);
    const typeAt = match.index + match[0].lastIndexOf(match[1]);
    spans.add(typeAt, typeAt + match[1].length, 'blue', 75);
    const bodyStart = source.indexOf('{', match.index + match[0].length);
    const bodyEnd = bodyStart >= 0 ? source.indexOf('}', bodyStart) : -1;
    if (bodyStart >= 0 && bodyEnd >= 0) {
      for (const item of source.slice(bodyStart + 1, bodyEnd).matchAll(/\b[A-Za-z_]\w*\b/g)) {
        spans.add(bodyStart + 1 + item.index, bodyStart + 1 + item.index + item[0].length, 'purple', 70);
      }
    }
  }
}

function rLanguage(spans, nodes) {
  const functions = nodes.filter((node) => node.type === 'function_definition');
  const functionOf = (node) => functions.find((candidate) =>
    candidate.startIndex <= node.startIndex && candidate.endIndex >= node.endIndex);
  const globals = new Set();
  const locals = new Map(functions.map((node) => [node.id, new Set()]));
  const declarations = new Set();
  for (const node of nodes) {
    if (node.type === 'binary_operator' && node.children.some((item) => ['<-', '='].includes(item.text))) {
      const left = node.namedChildren[0];
      if (!identifier(left)) continue;
      const fn = functionOf(node);
      if (fn) locals.get(fn.id).add(left.text); else globals.add(left.text);
      add(spans, left, 'blue'); declarations.add(left.id);
    }
    if (node.type === 'parameters') {
      const fn = functionOf(node);
      for (const parameter of node.descendantsOfType('parameter')) {
        const name = field(parameter, 'name');
        if (name && fn) { locals.get(fn.id).add(name.text); add(spans, name, 'blue'); declarations.add(name.id); }
      }
    }
  }
  for (const node of nodes) {
    if (!identifier(node) || declarations.has(node.id)) continue;
    const parent = node.parent;
    if (parent.type === 'extract_operator' && parent.namedChildren.at(-1)?.id === node.id) {
      add(spans, node, 'purple'); continue;
    }
    if (parent.type === 'argument' && field(parent, 'name')?.id === node.id) {
      add(spans, node, 'purple'); continue;
    }
    if (parent.type === 'call' && field(parent, 'function')?.id === node.id) {
      add(spans, node, 'yellow'); continue;
    }
    const fn = functionOf(node);
    if (fn && locals.get(fn.id)?.has(node.text)) add(spans, node, 'blue');
    else if (globals.has(node.text)) add(spans, node, 'yellow');
  }
}

function razor(spans, source) {
  // Razor's grammar exposes HTML punctuation through the same tree as C#.
  // Keep markup brown even when `<` would otherwise look like an operator.
  for (const match of source.matchAll(/<\/?([A-Za-z][\w.-]*)/g)) {
    const punctuationEnd = match.index + (match[0][1] === '/' ? 2 : 1);
    spans.add(match.index, punctuationEnd, 'brown', 75);
    const nameAt = match.index + match[0].lastIndexOf(match[1]);
    spans.add(nameAt, nameAt + match[1].length, 'brown', 75);
  }
  for (const match of source.matchAll(/\/?\s*>/g)) {
    spans.add(match.index, match.index + match[0].length, 'brown', 75);
  }
}

function refineDialect(root, source, language) {
  const spans = new Spans(source.length);
  const nodes = collect(root);
  if (language === 'cuda-cpp') cuda(spans, nodes, source);
  else if (language === 'groovy') groovy(spans, nodes, source);
  else if (language === 'julia') julia(spans, nodes);
  else if (language === 'lua') lua(spans, nodes);
  else if (['objective-c', 'objective-cpp'].includes(language)) objectiveC(spans, nodes, source);
  else if (language === 'r') rLanguage(spans, nodes);
  else if (language === 'razor') razor(spans, source);
  return spans.finish();
}

module.exports = { refineDialect };
