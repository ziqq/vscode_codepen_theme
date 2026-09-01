const path = require('node:path');
const { Spans } = require('./spans');
const { addComment } = require('./comments');

const grammars = Object.freeze({
  c: 'c', cpp: 'cpp', csharp: 'c_sharp', dart: 'dart', go: 'go', java: 'java',
  just: 'just', kotlin: 'kotlin', makefile: 'make', php: 'php', python: 'python',
  ruby: 'ruby', rust: 'rust', sql: 'sql', swift: 'swift', shellscript: 'bash',
  html: 'html', svelte: 'svelte', vue: 'vue', markdown: 'markdown',
});
let initialization;
const parsers = new Map();
const identifiers = new Set(['identifier', 'type_identifier', 'field_identifier',
  'simple_identifier', 'name', 'constant', 'namespace_identifier', 'package_identifier',
  'identifier_dollar_escaped', 'interpolated_identifier']);
const classKinds = new Set(['class_declaration', 'class_definition', 'class_specifier',
  'struct_specifier', 'struct_item', 'enum_specifier', 'enum_item', 'enum_declaration',
  'interface_declaration', 'protocol_declaration', 'record_declaration', 'trait_item',
  'extension_declaration', 'extension_type_declaration', 'type_spec', 'class', 'module']);
const functionKinds = new Set(['function_declaration', 'function_definition', 'function_item',
  'method_declaration', 'constructor_declaration', 'method', 'singleton_method', 'lambda_expression',
  'lambda_literal', 'lambda', 'closure_expression', 'anonymous_function', 'function_literal', 'recipe',
  'function_signature', 'constructor_signature', 'getter_signature', 'setter_signature']);
const blockKinds = new Set(['block', 'compound_statement', 'for_statement', 'for_in_statement',
  'for_expression', 'enhanced_for_statement', 'for_range_loop', 'catch_clause']);
const typeKinds = /^(?:primitive_type|predefined_type|integral_type|floating_point_type|boolean_type|void_type|user_type|type|generic_type|type_annotation|type_arguments|type_parameters|type_parameter|type_parameter_list|nullable_type|reference_type|array_type|function_type|parameter_type_list)$/;
const stringKinds = /^(?:string|.*string_literal|interpreted_string_literal|raw_string_literal|char_literal|character_literal|encapsed_string|symbol_literal|external_command|heredoc_body)$/;
const numericKinds = /^(?:(?:hex_|decimal_|octal_|binary_)?(?:integer|floating_point)_literal|number_literal|int_literal|float_literal|integer|float|number)$/;
const keywords = new Set(('abstract alias as assert async await base bool boolean break case catch class const constexpr continue covariant data default defer deferred def define del do done dynamic elif else end endef enum except export extends extension extern external factory false fi final finally fn for foreach from fun func function get global goto hide if ifdef ifeq ifndef ifneq impl implements import in include inline instanceof interface internal is late let library match mixin mod mutable mut native new nil nonlocal null object on operator or out override package part pass private protected protocol pub public raise record redo ref reified required rescue return rethrow sealed select self set show sizeof static struct super switch sync synchronized template then this throw throws trait transient true try type typedef typealias typeof union unless unsafe unset use using val var virtual volatile when where while with yield').split(' '));

const contains = (region, node) => region.start <= node.startIndex && region.end >= node.endIndex;
const ancestor = (node, predicate) => {
  for (let current = node.parent; current; current = current.parent) if (predicate(current)) return current;
};
const field = (node, name) => node?.childForFieldName(name);
const isField = (node, name) => field(node.parent, name)?.id === node.id;
const firstIdentifier = (node) => node?.namedChildren.find((child) => identifiers.has(child.type));
const isIdentifier = (node) => identifiers.has(node.type) && !node.namedChildren.some(isIdentifier);

async function refineTree(source, language) {
  return withTree(source, language, async (root) => {
    const base = classify(root, source, language);
    if (language !== 'makefile') return base;
    const spans = new Spans(source.length);
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (node.type === 'shell_text') {
        for (const span of await refineTree(node.text, 'shellscript')) {
          spans.add(node.startIndex + span.start, node.startIndex + span.end, span.role, 10);
        }
      } else stack.push(...node.namedChildren);
    }
    for (const span of base) spans.add(span.start, span.end, span.role, 30, span.fontStyle);
    return spans.finish();
  });
}

async function withTree(source, language, callback) {
  const grammar = grammars[language];
  if (!grammar) return [];
  const { Parser, Language } = require('./vendor/web-tree-sitter.cjs');
  await (initialization ??= Parser.init({ locateFile: () => path.join(__dirname, 'vendor/web-tree-sitter.wasm') }));
  let parser = parsers.get(grammar);
  if (!parser) {
    parser = new Parser();
    parser.setLanguage(await Language.load(path.join(__dirname, `grammars/${grammar}.wasm`)));
    parsers.set(grammar, parser);
  }
  const tree = parser.parse(source);
  try { return await callback(tree.rootNode); }
  finally { tree.delete(); }
}

function classify(root, source, language) {
  const spans = new Spans(source.length);
  const nodes = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    nodes.push(node);
    for (let index = node.childCount - 1; index >= 0; index--) stack.push(node.child(index));
  }
  const functions = [];
  const classes = [];
  const blocks = [];
  const roles = new Map();
  const bindings = new Map();
  const declarations = new Set();
  const region = (node) => ({ start: node.startIndex, end: node.endIndex, node });
  for (const node of nodes) {
    if ((classKinds.has(node.type) || node.type === 'impl_item') && node.id !== root.id) classes.push(region(node));
    if (blockKinds.has(node.type)) blocks.push(region(node));
    if (functionKinds.has(node.type)) {
      let owner = node;
      if (language === 'dart' && /signature$/.test(node.type)) {
        if (node.parent.type === 'method_signature' || node.parent.type === 'declaration') owner = node.parent;
        const next = owner.nextNamedSibling;
        functions.push({ start: owner.startIndex,
          end: next?.type === 'function_body' ? next.endIndex : owner.endIndex, node });
      } else functions.push(region(node));
    }
  }
  const smallest = (regions, node) => regions.filter((item) => contains(item, node))
    .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
  const classOf = (node) => smallest(classes, node);
  const functionOf = (node) => smallest(functions, node);
  const set = (node, role) => { if (node) roles.set(node.id, role); };
  function declare(node, kind, scope) {
    if (!node) return;
    const role = kind === 'member' ? 'purple' : kind === 'alias' ? 'white' : 'blue';
    set(node, role);
    declarations.add(node.id);
    const owner = scope ?? smallest(blocks, node) ?? functionOf(node) ?? region(root);
    const entry = { ...owner, kind, node, global: owner.node.id === root.id };
    const entries = bindings.get(node.text) ?? [];
    entries.push(entry);
    bindings.set(node.text, entries);
  }
  const nearestOwner = (node) => {
    const fn = functionOf(node);
    const cls = classOf(node);
    return fn && (!cls || fn.start > cls.start) ? fn : cls;
  };
  const memberContext = (node) => {
    const owner = nearestOwner(node);
    return owner && classKinds.has(owner.node.type);
  };
  const propertyNode = (node) => node.type === 'field_identifier' ||
    (node.parent.type === 'field_access' && isField(node, 'field')) ||
    (['member_access_expression', 'member_call_expression', 'member_binding_expression',
      'scoped_property_access_expression', 'scoped_call_expression'].includes(node.parent.type) && isField(node, 'name')) ||
    (node.parent.type === 'attribute' && isField(node, 'attribute')) ||
    ['navigation_suffix', 'unconditional_assignable_selector', 'conditional_assignable_selector',
      'cascade_selector'].includes(node.parent.type);
  function outOfLineClass(node) {
    if (language !== 'cpp') return undefined;
    const fn = functionOf(node)?.node;
    const qualified = field(fn, 'declarator')?.descendantsOfType('qualified_identifier')[0];
    const name = field(qualified, 'scope')?.text;
    return name ? classes.find((item) => field(item.node, 'name')?.text === name) : undefined;
  }

  // Declarations establish local binding identity before uses are classified.
  for (const node of nodes) {
    if (classKinds.has(node.type)) {
      const name = field(node, 'name') ?? firstIdentifier(node);
      declare(name, 'type', smallest(blocks, node) ?? region(root));
    }
    if (functionKinds.has(node.type)) {
      let name = field(node, 'name') ?? firstIdentifier(node);
      if (/lambda|closure|anonymous|function_literal/.test(node.type)) name = undefined;
      if (language === 'cpp' || language === 'c') {
        let declarator = field(node, 'declarator');
        while (declarator && !isIdentifier(declarator)) declarator = field(declarator, 'declarator') ?? field(declarator, 'name');
        name = declarator ?? name;
      }
      if (node.type === 'recipe') name = field(node.namedChildren.find((item) => item.type === 'recipe_header'), 'name');
      const cls = classOf(node);
      const outerFn = functions.filter((item) => item.node.id !== node.id && contains(item, node))
        .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
      const qualified = name && ancestor(name, (item) => item.type === 'qualified_identifier');
      const member = language === 'ruby' || language === 'just' || node.type === 'method_declaration' || qualified ||
        node.type === 'constructor_declaration' || (cls && (!outerFn || outerFn.start < cls.start)) ||
        (language === 'rust' && ancestor(node, (item) => item.type === 'impl_item' || item.type === 'trait_item'));
      declare(name, member ? 'member' : 'function', member && cls ? cls :
        member && !['ruby', 'just'].includes(language) ? region(node) : outerFn ?? region(root));
    }
    if (node.type === 'enum_constant' || node.type === 'enum_variant') {
      declare(field(node, 'name') ?? firstIdentifier(node), 'enum', classOf(node));
    }
    if (!isIdentifier(node)) continue;
    const parent = node.parent;
    if (propertyNode(node)) set(node, 'purple');
    if (declarations.has(node.id) || node.type === 'type_identifier' || node.type === 'namespace_identifier') continue;
    const param = ancestor(node, (item) => /^(?:formal_parameter|simple_parameter|parameter|parameter_declaration|typed_parameter|default_parameter|class_parameter|property_promotion_parameter|constructor_param)$/.test(item.type));
    if (param && !ancestor(node, (item) => item.id !== param.id && typeKinds.test(item.type)) &&
        (isField(node, 'name') || isField(node, 'pattern') || isField(node, 'declarator') ||
          firstIdentifier(param)?.id === node.id || parent.type === 'variable_name')) {
      const promoted = param.type === 'property_promotion_parameter' || param.type === 'constructor_param' ||
        (language === 'kotlin' && param.type === 'class_parameter' && param.children.some((item) => item.type === 'binding_pattern_kind')) ||
        (['csharp', 'java'].includes(language) && param.parent?.parent?.type === 'record_declaration');
      const signature = ancestor(node, (item) => item.type === 'function_declarator');
      declare(node, promoted ? 'member' : 'variable', promoted ? classOf(node) :
        functionOf(node) ?? (signature ? region(signature) : region(param)));
    }
    if (['parameters', 'method_parameters', 'lambda_parameters', 'closure_parameters', 'inferred_parameters'].includes(parent.type)) declare(node, 'variable', functionOf(node));
    if (language === 'dart' && parent.type === 'variable_pattern') {
      // Pattern variables belong to their switch/if case, including references
      // inside interpolated strings in the case body.
      const patternScope = ancestor(node, (item) =>
        item.type.includes('case'));
      declare(node, 'variable', patternScope ? region(patternScope) : undefined);
    }
    const declaration = ancestor(node, (item) => ['variable_declarator', 'initialized_identifier',
      'initialized_variable_definition', 'variable_declaration', 'property_declaration', 'let_declaration',
      'var_spec', 'const_spec', 'init_declarator', 'declaration', 'field_declaration'].includes(item.type));
    if (declaration && (isField(node, 'name') || isField(node, 'pattern') || isField(node, 'declarator') ||
        parent.type === 'initialized_identifier' || (parent.type === 'pattern' && isField(node, 'bound_identifier')) ||
        (parent.type === 'variable_declaration' && firstIdentifier(parent)?.id === node.id))) {
      declare(node, memberContext(declaration) ? 'member' : 'variable', memberContext(declaration) ? classOf(node) : undefined);
    }
    if (language === 'python' && parent.type === 'assignment' && isField(node, 'left')) {
      declare(node, memberContext(node) ? 'member' : 'variable', nearestOwner(node) ?? region(root));
    }
    if (language === 'ruby' && parent.type === 'assignment' && isField(node, 'left')) declare(node, 'variable');
    if (language === 'go' && ancestor(node, (item) => item.type === 'short_var_declaration') &&
        parent.type === 'expression_list' && isField(parent, 'left')) declare(node, 'variable');
    if (language === 'just') {
      if (parent.type === 'alias') set(node, 'purple');
      if (parent.type === 'assignment' && isField(node, 'left')) declare(node, 'variable');
      if (['dependency', 'dependency_expression', 'recipe_header'].includes(parent.type) && isField(node, 'name')) set(node, 'purple');
      if (parent.type === 'function_call' && isField(node, 'name')) set(node, 'yellow');
    }
  }

  function useRole(node) {
    if (roles.has(node.id)) return roles.get(node.id);
    const parent = node.parent;
    if (language === 'sql') {
      if (ancestor(node, (item) => item.type === 'invocation')) return 'yellow';
      return ancestor(node, (item) => item.type === 'field') ? 'purple' : 'blue';
    }
    if (language === 'rust' && parent.type === 'macro_invocation' && isField(node, 'macro')) return 'purple';
    if (propertyNode(node)) return 'purple';
    if (['keyword_argument', 'label', 'value_argument_label', 'field_initializer',
      'field_pattern'].includes(parent.type) &&
        (isField(node, 'name') || isField(node, 'field') || firstIdentifier(parent)?.id === node.id)) return 'purple';
    if (language === 'go' && parent.type === 'literal_element' && isField(parent, 'key')) return 'purple';
    if (language === 'java' && parent.type === 'method_invocation' && isField(node, 'name')) return 'purple';
    if (language === 'ruby' && parent.type === 'call' && isField(node, 'method')) return node.text === 'new' ? 'yellow' : 'purple';
    if (language === 'php' && parent.type === 'variable_name') return node.text === 'this' ? 'yellow' : 'blue';
    if (language === 'php' && parent.type === 'function_call_expression' && isField(node, 'function')) return 'yellow';
    if (parent.type === 'object_creation_expression') return 'yellow';
    if (node.type === 'type_identifier' &&
        ancestor(node, (item) => ['object_creation_expression', 'struct_expression', 'composite_literal'].includes(item.type)) &&
        !ancestor(node, (item) => typeKinds.test(item.type))) return 'yellow';
    if (node.type === 'type_identifier' || node.type === 'namespace_identifier' ||
        ancestor(node, (item) => typeKinds.test(item.type))) return 'white';
    if (language === 'csharp' && ['type', 'returns'].some((name) => isField(node, name))) return 'white';
    const associatedClass = outOfLineClass(node);
    const associatedMember = (entry) => entry.kind === 'member' && associatedClass &&
      entry.start === associatedClass.start && entry.end === associatedClass.end;
    const candidates = (bindings.get(node.text) ?? []).filter((entry) => contains(entry, node) || associatedMember(entry))
      .sort((a, b) => Number(a.global) - Number(b.global) ||
        Number(contains(b, node)) - Number(contains(a, node)) ||
        (a.end - a.start) - (b.end - b.start) || b.node.startIndex - a.node.startIndex);
    const binding = candidates[0];
    if (binding) {
      if (binding.kind === 'member' || binding.kind === 'enum') return 'purple';
      if (binding.kind === 'type') return 'yellow';
      return binding.global && !['just', 'makefile', 'shellscript', 'ruby'].includes(language) ? 'yellow' : 'blue';
    }
    if (node.type === 'constant') return 'yellow';
    if (node.type === 'identifier_dollar_escaped' || node.type === 'interpolated_identifier') return 'blue';
    if (['call_expression', 'call', 'function_call', 'invocation_expression', 'function_call_expression'].includes(parent.type) &&
        (isField(node, 'function') || isField(node, 'name') || firstIdentifier(parent)?.id === node.id)) return 'yellow';
    if (language === 'dart' && node.nextNamedSibling?.type === 'selector' &&
        node.nextNamedSibling.firstNamedChild?.type === 'argument_part') return 'yellow';
    // Unknown names retain the grammar/server fallback, rather than guessing from case.
    return undefined;
  }

  for (const node of nodes) {
    const text = node.text;
    if (/comment/.test(node.type)) {
      addComment(spans, source, node.startIndex, node.endIndex,
        language === 'dart' && node.type === 'documentation_comment' ? 'italic' : undefined);
      continue;
    }
    if (stringKinds.test(node.type) && !ancestor(node, (item) => item.type === 'primitive_type')) spans.add(node.startIndex, node.endIndex, 'green', 2);
    if (/^(?:primitive_type|predefined_type|integral_type|floating_point_type|boolean_type|void_type)$/.test(node.type)) {
      spans.add(node.startIndex, node.endIndex, 'white', 40, language === 'dart' ? 'normal' : undefined);
    }
    if (numericKinds.test(node.type)) spans.add(node.startIndex, node.endIndex, 'orange', 30);
    if (isIdentifier(node)) {
      const role = useRole(node);
      if (role) spans.add(node.startIndex, node.endIndex, role, 30);
      continue;
    }
    if (language === 'makefile') {
      if (node.type === 'automatic_variable') spans.add(node.startIndex, node.endIndex, 'blue', 40);
      if (node.type === 'word' && ['targets', 'prerequisites'].includes(node.parent.type)) spans.add(node.startIndex, node.endIndex, 'purple', 30);
      if (node.type === 'word' && (isField(node, 'name') || node.parent.type === 'variable_reference')) spans.add(node.startIndex, node.endIndex, 'blue', 40);
      if (!node.isNamed && node.parent?.type === 'function_call' && /^[a-z][\w-]*$/.test(text)) {
        spans.add(node.startIndex, node.endIndex, 'yellow', 40);
      }
    }
    if (language === 'dart' && node.type === 'annotation') spans.add(node.startIndex, node.endIndex, 'yellow', 40);
    if (language === 'rust' && node.parent?.type === 'macro_invocation' && (isField(node, 'macro') || text === '!')) {
      spans.add(node.startIndex, node.endIndex, 'purple', 40);
    }
    if (node.type === 'instance_variable' || node.type === 'class_variable') spans.add(node.startIndex, node.endIndex, 'purple', 30);
    if (node.type === 'variable_name' && language === 'shellscript') spans.add(node.startIndex, node.endIndex, 'blue', 30);
    if (node.type === 'template_substitution' || node.type === 'interpolated_expression' || node.type === 'interpolation') {
      for (const child of node.children) if (!child.isNamed && /^(?:\$|\{|\}|#\{|\$\{|\{\{|\}\})$/.test(child.text)) {
        spans.add(child.startIndex, child.endIndex, 'green', 50);
      }
    }
    if ((language === 'kotlin' && node.parent?.type === 'string_literal') ||
        (language === 'php' && node.parent?.type === 'encapsed_string')) {
      if (!node.isNamed && ['${', '{', '}'].includes(text)) spans.add(node.startIndex, node.endIndex, 'green', 50);
    }
    if (language === 'shellscript' && ['expansion', 'simple_expansion'].includes(node.parent?.type) &&
        ancestor(node, (item) => item.type === 'string') && !node.isNamed && ['$', '${', '{', '}'].includes(text)) {
      spans.add(node.startIndex, node.endIndex, 'green', 50);
    }
    if (node.childCount !== 0) continue;
    if ((node.isNamed && typeKinds.test(node.type)) || (language === 'dart' && text === 'Function')) {
      spans.add(node.startIndex, node.endIndex, 'white', 40, language === 'dart' ? 'normal' : undefined);
      continue;
    }
    // Do not treat string content, names, shell commands, or error recovery text as keywords.
    if (!node.isNamed || /^keyword_/.test(node.type) || /_builtin$/.test(node.type) ||
        ['true', 'false', 'null_literal', 'null', 'this', 'super', 'self', 'inferred_type', 'binding_pattern_kind'].includes(node.type)) {
      if (keywords.has(text) || /^keyword_/.test(node.type)) spans.add(node.startIndex, node.endIndex, 'yellow', 20);
      else if (/^(?:[{}()[\],;.])$/.test(text)) spans.add(node.startIndex, node.endIndex, 'white', 15);
      else if (/^(?:[:=<>!?+*\/|&%~^@-]+|=>|->)$/.test(text)) spans.add(node.startIndex, node.endIndex, text === ':' ? 'white' : 'operator', 15);
    }
  }
  return spans.finish();
}

module.exports = { refineTree, withTree, grammars };
