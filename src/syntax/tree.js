/**
 * @file Structural classification using bundled Tree-sitter grammars and lexical binding scopes.
 * Parser trees live only during callbacks; no project source is executed.
 */

/**
 * @typedef {object} Region
 * @property {number} start Inclusive lexical owner offset.
 * @property {number} end Exclusive lexical owner offset.
 * @property {import('web-tree-sitter').Node} node Owner node, valid only while its tree is alive.
 */

/**
 * @typedef {Region & {kind: string, global: boolean}} Binding
 * Declaration identity and lexical lifetime used when resolving same-name occurrences.
 */

const path = require('node:path');
const { Spans } = require('./spans');
const { addComment } = require('./comments');
const { refineDialect } = require('./dialects');

const grammars = Object.freeze({
  c: 'c', cpp: 'cpp', csharp: 'c_sharp', dart: 'dart', go: 'go', java: 'java',
  'cuda-cpp': 'cuda', groovy: 'groovy', julia: 'julia', just: 'just',
  kotlin: 'kotlin', lua: 'lua', makefile: 'make', 'objective-c': 'objc',
  'objective-cpp': 'objc', perl: 'perl', php: 'php', powershell: 'powershell',
  python: 'python', r: 'r', razor: 'razor', ruby: 'ruby', rust: 'rust', sql: 'sql',
  swift: 'swift', shellscript: 'bash',
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
  'function_signature', 'constructor_signature', 'factory_constructor_signature',
  'constant_constructor_signature', 'redirecting_factory_constructor_signature',
  'getter_signature', 'setter_signature', 'operator_signature']);
const dartConstructorKinds = new Set(['constructor_signature', 'constant_constructor_signature',
  'factory_constructor_signature', 'redirecting_factory_constructor_signature']);
const blockKinds = new Set(['block', 'compound_statement', 'for_statement', 'for_in_statement',
  'for_expression', 'enhanced_for_statement', 'for_range_loop', 'catch_clause']);
const typeKinds = /^(?:primitive_type|predefined_type|integral_type|floating_point_type|boolean_type|void_type|user_type|type|generic_type|type_annotation|type_arguments|type_parameters|type_parameter|type_parameter_list|nullable_type|reference_type|array_type|function_type|parameter_type_list)$/;
const stringKinds = /^(?:string|.*string_literal|interpreted_string_literal|raw_string_literal|char_literal|character_literal|encapsed_string|symbol_literal|external_command|heredoc_body)$/;
const numericKinds = /^(?:(?:hex_|decimal_|octal_|binary_)?(?:integer|floating_point)_literal|number_literal|int_literal|float_literal|integer|float|number)$/;
const annotationKinds = new Set([
  'annotation',
  'attribute',
  'decorator',
  'marker_annotation',
]);
const keywords = new Set(('abstract alias as assert async await base bool boolean break case catch class const constexpr continue covariant data default defer deferred def define del do done dynamic elif else end endef enum except export extends extension extern external factory false fi final finally fn for foreach from fun func function get global goto hide if ifdef ifeq ifndef ifneq impl implements import in include inline instanceof interface internal is late let library match mixin mod mutable mut native new nil nonlocal null object on operator or out override package part pass private protected protocol pub public raise record redo ref reified required rescue return rethrow sealed select self set show sizeof static struct super switch sync synchronized template then this throw throws trait transient true try type typedef typealias typeof union unless unsafe unset use using val var virtual volatile when where while with yield').split(' '));

/**
 * Check containment in a half-open lexical region, including whole-node boundaries.
 * @type {(region: Region, node: import('web-tree-sitter').Node) => boolean}
 */
const contains = (region, node) => region.start <= node.startIndex && region.end >= node.endIndex;
/**
 * Find the first enclosing node matching a syntax predicate; never cross into another tree.
 * @type {(node: import('web-tree-sitter').Node, predicate: (node: import('web-tree-sitter').Node) => boolean) => import('web-tree-sitter').Node | undefined}
 */
const ancestor = (node, predicate) => {
  for (let current = node.parent; current; current = current.parent) if (predicate(current)) return current;
};
/**
 * Read an optional named grammar field without guessing child positions.
 * @type {(node: import('web-tree-sitter').Node | null | undefined, name: string) => import('web-tree-sitter').Node | null | undefined}
 */
const field = (node, name) => node?.childForFieldName(name);
/**
 * Determine whether this node is exactly a named field of its parent.
 * @type {(node: import('web-tree-sitter').Node, name: string) => boolean}
 */
const isField = (node, name) => field(node.parent, name)?.id === node.id;
/**
 * Find a direct identifier-like child when a grammar lacks a named field.
 * @type {(node: import('web-tree-sitter').Node | undefined) => import('web-tree-sitter').Node | undefined}
 */
const firstIdentifier = (node) => node?.namedChildren.find((child) => identifiers.has(child.type));
/**
 * Find the first identifier descendant in source order, skipping irrelevant wrappers.
 * @type {(node: import('web-tree-sitter').Node | undefined) => import('web-tree-sitter').Node | undefined}
 */
const firstDescendantIdentifier = (node) => {
  const stack = [...(node?.namedChildren ?? [])].reverse();
  while (stack.length) {
    const child = stack.pop();
    if (identifiers.has(child.type)) return child;
    stack.push(...child.namedChildren.toReversed());
  }
};
/**
 * Select the leaf identifier rather than emitting duplicate ranges for wrapper nodes.
 * @type {(node: import('web-tree-sitter').Node) => boolean}
 */
const isIdentifier = (node) => identifiers.has(node.type) && !node.namedChildren.some(isIdentifier);

/**
 * Layer generic bindings, dialect corrections, and annotations over a parsed tree.
 *
 * @param {string} source Document text; offsets are UTF-16 code units.
 * @param {string} language VS Code language identifier used to select syntax rules.
 * @returns {Promise<import('./spans').Span[]>} Sorted, non-overlapping foreground refinements.
 */
async function refineTree(source, language) {
  return withTree(source, language, async (root) => {
    const base = classify(root, source, language);
    const spans = new Spans(source.length);
    for (const span of base) spans.add(span.start, span.end, span.role, 20, span.fontStyle);
    for (const span of refineDialect(root, source, language)) {
      spans.add(span.start, span.end, span.role, 40, span.fontStyle);
    }
    addAnnotations(root, source, spans);
    if (language !== 'makefile') return spans.finish();
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      if (node.type === 'shell_text') {
        for (const span of await refineTree(node.text, 'shellscript')) {
          spans.add(node.startIndex + span.start, node.startIndex + span.end, span.role, 10);
        }
      } else stack.push(...node.namedChildren);
    }
    return spans.finish();
  });
}

/**
 * Split annotation markers from names without recoloring unrelated at-sign syntax.
 *
 * @param {import('web-tree-sitter').Node} root Parsed document root.
 * @param {string} source Original document text.
 * @param {import('./spans').Spans} spans Collector receiving the gray marker and yellow italic name.
 * @returns {void} Annotation spans override generic identifier colors.
 */
function addAnnotations(root, source, spans) {
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    stack.push(...node.namedChildren);
    if (!annotationKinds.has(node.type)) continue;
    // Rust attributes carry their marker on the wrapper, not on the name node.
    // Keep arguments with their own type/string roles instead of painting the list.
    if (node.type === 'attribute' &&
        ['attribute_item', 'inner_attribute_item'].includes(node.parent?.type)) {
      const wrapper = node.parent;
      const markerEnd = wrapper.startIndex + (source.startsWith('#!', wrapper.startIndex) ? 2 : 1);
      spans.add(wrapper.startIndex, markerEnd, 'operator', 60, 'annotation');
      const name = node.namedChildren[0];
      if (name && ['identifier', 'scoped_identifier'].includes(name.type)) {
        spans.add(name.startIndex, name.endIndex, 'yellow', 60, 'annotation');
      }
      continue;
    }
    const marker = source.indexOf('@', node.startIndex);
    if (marker < node.startIndex || marker >= node.endIndex) continue;
    spans.add(marker, marker + 1, 'operator', 60, 'annotation');
    const name = field(node, 'name') ?? field(node, 'attribute') ??
      firstDescendantIdentifier(node);
    if (name) {
      spans.add(name.startIndex, name.endIndex, 'yellow', 60, 'annotation');
    }
  }
}

/**
 * Parse with a lazily initialized, cached grammar and dispose the tree afterward.
 * A temporary parent index avoids repeated root-to-node searches during classification.
 *
 * @template T
 * @param {string} source Document text to parse.
 * @param {string} language VS Code language ID mapped to a bundled grammar.
 * @param {(root: import('web-tree-sitter').Node) => T | Promise<T>} callback Work performed while the tree is alive.
 * @returns {Promise<T | []>} Callback result, or an empty list for unsupported grammars.
 */
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
  // tree-sitter resolves `parent` by descending from the root on every access;
  // classification asks for it constantly, so index parents once per tree.
  const parents = new Map([[tree.rootNode.id, null]]);
  const stack = [tree.rootNode];
  while (stack.length) {
    const node = stack.pop();
    for (const child of node.children) { parents.set(child.id, node); stack.push(child); }
  }
  const prototype = Object.getPrototypeOf(tree.rootNode);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'parent');
  Object.defineProperty(prototype, 'parent', { configurable: true, get() {
    const parent = parents.get(this.id);
    return parent === undefined ? descriptor.get.call(this) : parent;
  } });
  try { return await callback(tree.rootNode); }
  finally {
    // Restore the shared prototype even if a dialect pass throws; later parses
    // must not retain nodes from this tree through the temporary parent map.
    Object.defineProperty(prototype, 'parent', descriptor);
    tree.delete();
  }
}

/**
 * Recognize Dart const storage at local, class, and top-level declarations.
 * A const expression used as an initializer does not make a final field constant.
 *
 * @param {import('web-tree-sitter').Node} declaration Declaration node containing the bound identifier.
 * @returns {boolean} Whether the declaration itself has a const modifier.
 */
function dartConstantDeclaration(declaration) {
  const owner = ancestor(declaration, (item) =>
    item.type === 'declaration' || item.type === 'initialized_variable_definition');
  const list = declaration.parent;
  return owner
    ? owner.namedChildren.some((child) => child.type === 'const_builtin')
    : list.type === 'static_final_declaration_list' &&
      [list.previousNamedSibling, list.previousNamedSibling?.previousNamedSibling]
        .some((child) => child?.type === 'const_builtin');
}

/**
 * Java static-final fields and interface constants declare class-owned constants.
 * Instance final fields remain members; uppercase spelling alone proves nothing.
 * @param {import('web-tree-sitter').Node} declaration Bound variable declarator.
 * @returns {boolean} Whether its storage declaration has constant field modifiers.
 */
function javaConstantDeclaration(declaration) {
  const owner = ancestor(declaration, (node) =>
    node.type === 'field_declaration' || node.type === 'constant_declaration');
  if (!owner) return false;
  if (owner.type === 'constant_declaration') return true;
  const modifiers = owner.namedChildren.find((node) => node.type === 'modifiers');
  return ['static', 'final'].every((modifier) =>
    modifiers?.children.some((node) => node.type === modifier));
}

/**
 * Verify definition-provider target offsets against actual Dart declarations.
 *
 * @param {string} source Defining document text.
 * @param {number[]} offsets UTF-16 offsets of the resolved symbol names.
 * @returns {Promise<boolean[]>} One const/non-const result per input offset.
 */
async function dartConstantsAt(source, offsets) {
  return withTree(source, 'dart', (root) => offsets.map((offset) => {
    const node = root.descendantForIndex(offset);
    const declaration = ancestor(node, (item) =>
      item.type === 'static_final_declaration' || item.type === 'initialized_variable_definition');
    return Boolean(declaration && dartConstantDeclaration(declaration));
  }));
}

/**
 * Index lexical owners and declarations before assigning roles to references.
 * Local bindings shadow members; unresolved names keep conservative language fallbacks.
 *
 * @param {import('web-tree-sitter').Node} root Live parser root.
 * @param {string} source Original document text.
 * @param {string} language Language-specific classification switches.
 * @returns {import('./spans').Span[]} Merged structural foreground spans.
 */
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
  /**
   * Capture a live syntax node as a lexical source interval.
   * @type {(node: import('web-tree-sitter').Node) => Region}
   */
  const region = (node) => ({ start: node.startIndex, end: node.endIndex, node });
  /**
   * Check whether a named declaration field owns this identifier or a descendant.
   * @type {(owner: import('web-tree-sitter').Node, name: string, node: import('web-tree-sitter').Node) => boolean | null | undefined}
   */
  const fieldContains = (owner, name, node) => {
    const value = field(owner, name);
    return value && (value.id === node.id || contains(region(value), node));
  };
  // A Dart signature owns its initializer list and the sibling function body.
  /**
   * Include a Dart declaration body when its grammar stores signature and body as siblings.
   * @type {(node: import('web-tree-sitter').Node) => Region}
   */
  const signatureRegion = (node) => {
    const owner = ['method_signature', 'declaration'].includes(node.parent.type) ? node.parent : node;
    const next = owner.nextNamedSibling;
    return { start: owner.startIndex, end: next?.type === 'function_body' ? next.endIndex : owner.endIndex, node };
  };
  for (const node of nodes) {
    if ((classKinds.has(node.type) || node.type === 'impl_item') && node.id !== root.id) classes.push(region(node));
    if (blockKinds.has(node.type)) blocks.push(region(node));
    if (functionKinds.has(node.type)) {
      functions.push(language === 'dart' && /signature$/.test(node.type) ? signatureRegion(node) : region(node));
    }
  }
  /**
   * Choose the tightest lexical owner when nested scopes all contain the same node.
   * @type {(regions: Region[], node: import('web-tree-sitter').Node) => Region | undefined}
   */
  const smallest = (regions, node) => regions.filter((item) => contains(item, node))
    .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
  /**
   * Find the tightest class-like lexical region containing a node.
   * @type {(node: import('web-tree-sitter').Node) => Region | undefined}
   */
  const classOf = (node) => smallest(classes, node);
  /**
   * Find the tightest callable lexical region containing a node.
   * @type {(node: import('web-tree-sitter').Node) => Region | undefined}
   */
  const functionOf = (node) => smallest(functions, node);
  /**
   * Record a declaration role only when an optional grammar field is present.
   * @type {(node: import('web-tree-sitter').Node | undefined, role: import('./spans').Role) => void}
   */
  const set = (node, role) => { if (node) roles.set(node.id, role); };
  /**
   * Record a binding with its lexical lifetime and declaration foreground.
   *
   * @param {import('web-tree-sitter').Node | undefined} node Identifier to bind; absent names are ignored.
   * @param {string} kind Binding category: variable, constant, member, type, or constructor.
   * @param {Region} [scope] Explicit owner; otherwise choose the nearest lexical region.
   * @returns {void} The binding index and declaration roles are updated together.
   */
  function declare(node, kind, scope) {
    if (!node) return;
    const role = kind === 'member' || kind === 'enum' ? 'purple' : kind === 'alias' ? 'white' : 'blue';
    set(node, role);
    declarations.add(node.id);
    const owner = scope ?? smallest(blocks, node) ?? functionOf(node) ?? region(root);
    const entry = { ...owner, kind, node, global: owner.node.id === root.id };
    const entries = bindings.get(node.text) ?? [];
    entries.push(entry);
    bindings.set(node.text, entries);
  }
  /**
   * Choose between enclosing class and function ownership by lexical nesting.
   * @type {(node: import('web-tree-sitter').Node) => Region | undefined}
   */
  const nearestOwner = (node) => {
    const fn = functionOf(node);
    const cls = classOf(node);
    return fn && (!cls || fn.start > cls.start) ? fn : cls;
  };
  /**
   * Distinguish class storage from callable-local bindings, including Razor field nodes.
   * @type {(node: import('web-tree-sitter').Node) => boolean | undefined}
   */
  const memberContext = (node) => {
    const owner = nearestOwner(node);
    return owner && classKinds.has(owner.node.type) ||
      language === 'razor' && ['property_declaration', 'field_declaration'].includes(node.type);
  };
  /**
   * Recognize syntactic member positions before applying binding-specific exceptions.
   * @type {(node: import('web-tree-sitter').Node) => boolean}
   */
  const propertyNode = (node) => node.type === 'field_identifier' ||
    (language === 'dart' && node.type === 'identifier' && node.parent.type === 'const_object_expression') ||
    (node.parent.type === 'field_access' && isField(node, 'field')) ||
    (['member_access_expression', 'member_call_expression', 'member_binding_expression',
      'scoped_property_access_expression', 'scoped_call_expression'].includes(node.parent.type) && isField(node, 'name')) ||
    (node.parent.type === 'attribute' && isField(node, 'attribute')) ||
    ['navigation_suffix', 'unconditional_assignable_selector', 'conditional_assignable_selector',
      'cascade_selector', 'dot_shorthand'].includes(node.parent.type);
  /**
   * Identify a Dart named-constructor type in a qualified selector context.
   * @type {(node: import('web-tree-sitter').Node) => boolean}
   */
  const dartQualifiedConstructor = (node) => language === 'dart' &&
    node.parent.type === 'unconditional_assignable_selector' && /^[A-Z_]/.test(node.text) &&
    node.parent.parent?.nextNamedSibling?.firstNamedChild?.type === 'argument_part';
  /**
   * Detect a Dart root name followed by an invocation selector.
   * @type {(node: import('web-tree-sitter').Node) => boolean}
   */
  const dartInvokedRoot = (node) => language === 'dart' &&
    node.parent.namedChildren.slice(node.parent.namedChildren.indexOf(node) + 1)
      .some((sibling) => sibling.type === 'selector' &&
        sibling.firstNamedChild?.type === 'argument_part');
  /**
   * Recover type arguments that the Dart grammar exposes through a relational-expression shape.
   * @type {(node: import('web-tree-sitter').Node) => boolean}
   */
  const dartRelationalTypeArgument = (node) => language === 'dart' &&
    node.parent.type === 'relational_expression' &&
    node.previousNamedSibling?.text === '<' && node.parent.nextNamedSibling?.text === '>';
  /**
   * Find the class owning a C++ method defined outside its class body.
   *
   * @param {import('web-tree-sitter').Node} node Identifier inside an out-of-line method definition.
   * @returns {Region | undefined} Matching class region, if the local document defines it.
   */
  function outOfLineClass(node) {
    if (language !== 'cpp') return undefined;
    const fn = functionOf(node)?.node;
    const qualified = field(fn, 'declarator')?.descendantsOfType('qualified_identifier')[0];
    const name = field(qualified, 'scope')?.text;
    return name ? classes.find((item) => field(item.node, 'name')?.text === name) : undefined;
  }

  // Declarations establish local binding identity before uses are classified.
  for (const node of nodes) {
    if (language === 'dart' && node.type === 'import_specification') {
      const name = node.namedChildren.filter((child) => isIdentifier(child)).at(-1);
      declare(name, 'namespace', region(root));
    }
    if (classKinds.has(node.type)) {
      const name = field(node, 'name') ?? firstIdentifier(node);
      declare(name, 'type', smallest(blocks, node) ?? region(root));
    }
    if (functionKinds.has(node.type)) {
      let name = field(node, 'name') ?? field(node, 'function') ?? firstIdentifier(node);
      if (/lambda|closure|anonymous|function_literal/.test(node.type)) name = undefined;
      if (language === 'cpp' || language === 'c' || language === 'cuda-cpp') {
        let declarator = field(node, 'declarator');
        while (declarator && !isIdentifier(declarator)) declarator = field(declarator, 'declarator') ?? field(declarator, 'name');
        name = declarator ?? name;
      }
      if (node.type === 'recipe') name = field(node.namedChildren.find((item) => item.type === 'recipe_header'), 'name');
      const cls = classOf(node);
      const outerFn = functions.filter((item) => item.node.id !== node.id && contains(item, node))
        .sort((a, b) => (a.end - a.start) - (b.end - b.start))[0];
      const qualified = name && ancestor(name, (item) => item.type === 'qualified_identifier');
      const kotlinReceiver = language === 'kotlin' && node.type === 'function_declaration' && name &&
        /\.\s*$/.test(source.slice(node.startIndex, name.startIndex));
      const member = language === 'ruby' || language === 'just' || language === 'razor' ||
        node.type === 'method_declaration' || qualified || kotlinReceiver ||
        node.type === 'constructor_declaration' || (cls && (!outerFn || outerFn.start < cls.start)) ||
        (language === 'rust' && ancestor(node, (item) => item.type === 'impl_item' || item.type === 'trait_item'));
      const kind = language === 'dart' &&
        (node.type === 'constructor_declaration' || dartConstructorKinds.has(node.type))
        ? 'constructor' : member ? 'member' : 'function';
      declare(name, kind, member && cls ? cls :
        member && !['ruby', 'just'].includes(language) ? region(node) : outerFn ?? region(root));
      if (kind === 'constructor') {
        // `Class.named` declares a member-like name, as it reads at call sites;
        // a redirect target `= Other.named` is a constructor reference.
        const list = node.namedChildren.findIndex((child) => child.type === 'formal_parameter_list');
        const head = node.namedChildren.slice(0, list).filter((child) => child.type === 'identifier');
        if (head[1]) set(head[1], 'purple');
        for (const target of list < 0 ? [] : node.namedChildren.slice(list + 1)) {
          if (target.type === 'type_identifier') set(target, 'yellow');
          if (target.type === 'identifier') set(target, 'purple');
        }
      }
    }
    if (node.type === 'enum_constant' || node.type === 'enum_variant' ||
        node.type === 'enum_entry' || node.type === 'enumerator') {
      declare(field(node, 'name') ?? firstIdentifier(node), 'enum', classOf(node));
    }
    if (!isIdentifier(node)) continue;
    const parent = node.parent;
    if (language === 'dart' && parent.type === 'super_formal_parameter') {
      set(node, 'purple');
      continue;
    }
    if (propertyNode(node)) set(node, dartQualifiedConstructor(node) ? 'yellow' : 'purple');
    if (declarations.has(node.id) || node.type === 'type_identifier' || node.type === 'namespace_identifier') continue;
    const param = ancestor(node, (item) => /^(?:formal_parameter|simple_parameter|parameter|parameter_declaration|typed_parameter|default_parameter|class_parameter|property_promotion_parameter|constructor_param)$/.test(item.type));
    if (param && !ancestor(node, (item) => item.id !== param.id && typeKinds.test(item.type)) &&
        (isField(node, 'name') || isField(node, 'pattern') || isField(node, 'declarator') ||
          firstIdentifier(param)?.id === node.id || parent.type === 'variable_name')) {
      const promoted = param.type === 'property_promotion_parameter' || param.type === 'constructor_param' ||
        (language === 'kotlin' && param.type === 'class_parameter' && param.children.some((item) => item.type === 'binding_pattern_kind')) ||
        (['csharp', 'java', 'razor'].includes(language) && param.parent?.parent?.type === 'record_declaration');
      // Generative and redirecting Dart constructor parameters describe fields;
      // factory bodies use their parameters as local bindings.
      const list = language === 'dart' ? ancestor(param, (item) => item.type === 'formal_parameter_list') : undefined;
      const constructor = dartConstructorKinds.has(list?.parent.type) ? list.parent : undefined;
      const signature = ancestor(node, (item) => item.type === 'function_declarator');
      const member = promoted || (constructor && constructor.type !== 'factory_constructor_signature');
      declare(node, member ? 'member' : 'variable', promoted ? classOf(node) :
        constructor ? signatureRegion(constructor) :
          functionOf(node) ?? (signature ? region(signature) : region(param)));
    }
    if (['parameters', 'method_parameters', 'lambda_parameters', 'closure_parameters', 'inferred_parameters'].includes(parent.type)) declare(node, 'variable', functionOf(node));
    if (language === 'dart' && parent.type === 'catch_parameters') {
      const catchBody = parent.parent.nextNamedSibling;
      declare(node, 'variable', catchBody?.type === 'block' ? region(catchBody) : functionOf(node));
    }
    if (['enhanced_for_statement', 'for_in_statement', 'for_range_loop'].includes(parent.type) &&
        (isField(node, 'name') || isField(node, 'left') || isField(node, 'pattern'))) {
      declare(node, 'variable', region(parent));
    }
    if (parent.type === 'for_loop_parts' && isField(node, 'name')) {
      declare(node, 'variable', region(parent.parent));
    }
    if (['type_pattern', 'record_pattern_component'].includes(parent.type) &&
        parent.namedChildren.at(-1)?.id === node.id) {
      const patternScope = ancestor(node, (item) => item.type === 'switch_rule' || item.type.includes('case'));
      declare(node, 'variable', patternScope ? region(patternScope) : undefined);
    }
    if (language === 'dart' && parent.type === 'variable_pattern') {
      // Pattern variables belong to their switch/if case, including references
      // inside interpolated strings in the case body.
      const patternScope = ancestor(node, (item) =>
        item.type.includes('case'));
      declare(node, 'variable', patternScope ? region(patternScope) : undefined);
    }
    const declaration = ancestor(node, (item) => ['variable_declarator', 'initialized_identifier',
      'initialized_variable_definition', 'variable_declaration', 'property_declaration', 'let_declaration',
      'var_spec', 'const_spec', 'init_declarator', 'declaration', 'field_declaration',
      'static_final_declaration', ...(language === 'java' ? ['constant_declaration'] : [])].includes(item.type));
    if (declaration && (fieldContains(declaration, 'name', node) || fieldContains(declaration, 'pattern', node) ||
        fieldContains(declaration, 'declarator', node) ||
        (parent.type === 'initialized_identifier' && firstIdentifier(parent)?.id === node.id) ||
        (parent.type === 'pattern' && isField(node, 'bound_identifier')) ||
        (parent.type === 'static_final_declaration' && firstIdentifier(parent)?.id === node.id) ||
        (parent.type === 'variable_declaration' && firstIdentifier(parent)?.id === node.id))) {
      const member = memberContext(declaration);
      const constant = language === 'dart' && dartConstantDeclaration(declaration) ||
        language === 'java' && javaConstantDeclaration(declaration);
      declare(node, constant ? 'constant' : member ? 'member' : 'variable', member ? classOf(node) : undefined);
    }
    // `abstract`/`external` Dart fields have no storage and behave like getters.
    if (language === 'dart' && parent.type === 'identifier_list' && parent.parent?.type === 'declaration') {
      declare(node, 'member', classOf(node));
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

  /**
   * Resolve an occurrence after all declarations have been indexed.
   * Imported Dart constants require the separate provider-backed resolution pass.
   *
   * @param {import('web-tree-sitter').Node} node Identifier occurrence to classify.
   * @returns {import('./spans').Role | undefined} Resolved role, or no refinement when the provider should decide.
   */
  function useRole(node) {
    // A qualified class constant must win over the generic member-position role.
    // Only a class declared in this document proves the receiver's identity.
    if (language === 'java' && node.parent.type === 'field_access' && isField(node, 'field')) {
      const receiver = field(node.parent, 'object');
      const owner = receiver?.type === 'identifier' && classes.find((item) =>
        field(item.node, 'name')?.text === receiver.text);
      if (owner && useRole(receiver) === 'yellow' && (bindings.get(node.text) ?? []).some((entry) =>
        entry.kind === 'constant' && entry.start === owner.start && entry.end === owner.end)) return 'blue';
    }
    if (language === 'dart' && propertyNode(node)) {
      const selector = ancestor(node, (item) => item.type === 'selector');
      const receiver = selector?.previousNamedSibling;
      const owner = receiver?.type === 'identifier' && classes.find((item) =>
        field(item.node, 'name')?.text === receiver.text);
      if (owner && (bindings.get(node.text) ?? []).some((entry) =>
        entry.kind === 'constant' && entry.start === owner.start && entry.end === owner.end)) return 'blue';
    }
    if (roles.has(node.id)) return roles.get(node.id);
    const parent = node.parent;
    if (language === 'sql') {
      if (ancestor(node, (item) => item.type === 'invocation')) return 'yellow';
      return ancestor(node, (item) => item.type === 'field') ? 'purple' : 'blue';
    }
    if (language === 'rust' && parent.type === 'macro_invocation' && isField(node, 'macro')) return 'purple';
    const associatedClass = outOfLineClass(node);
    /**
     * Make class members visible inside an out-of-line C++ method definition.
     * @type {(entry: Binding) => boolean | Region | undefined}
     */
    const associatedMember = (entry) => entry.kind === 'member' && associatedClass &&
      entry.start === associatedClass.start && entry.end === associatedClass.end;
    const candidates = (bindings.get(node.text) ?? []).filter((entry) => contains(entry, node) || associatedMember(entry))
      .sort((a, b) => Number(a.global) - Number(b.global) ||
        Number(language === 'dart' && a.kind !== 'variable') -
          Number(language === 'dart' && b.kind !== 'variable') ||
        Number(contains(b, node)) - Number(contains(a, node)) ||
        (a.end - a.start) - (b.end - b.start) || b.node.startIndex - a.node.startIndex);
    const binding = candidates[0];
    if (binding?.kind === 'namespace') return 'yellow';
    if (dartQualifiedConstructor(node)) return 'yellow';
    if (!binding && dartInvokedRoot(node)) return 'yellow';
    if (language === 'dart' && parent.type === 'annotation') return 'yellow';
    if (!binding && language === 'dart' && node.text === 'values' &&
        classOf(node)?.node.type === 'enum_declaration') return 'purple';
    if (language === 'dart' && parent.type === 'qualified' &&
        parent.namedChildren[0]?.type === 'type_identifier' &&
        parent.namedChildren.at(-1)?.id === node.id) return 'purple';
    if (dartRelationalTypeArgument(node)) return 'white';
    if (['keyword_argument', 'label', 'value_argument_label', 'field_initializer',
      'field_pattern'].includes(parent.type) &&
        (isField(node, 'name') || isField(node, 'field') || firstIdentifier(parent)?.id === node.id)) return 'purple';
    if (binding?.kind === 'constant') return 'blue';
    if (binding?.kind === 'variable') return binding.global &&
      !['just', 'makefile', 'shellscript', 'ruby'].includes(language) ? 'yellow' : 'blue';
    if (propertyNode(node)) return 'purple';
    if (language === 'go' && parent.type === 'literal_element' && isField(parent, 'key')) return 'purple';
    if (language === 'java' && parent.type === 'record_pattern' && firstIdentifier(parent)?.id === node.id) return 'white';
    if (language === 'kotlin' && parent.type === 'value_argument' &&
        parent.namedChildren[0]?.id === node.id && parent.children.some((item) => item.text === '=')) return 'purple';
    if (language === 'java' && parent.type === 'method_invocation' && isField(node, 'name')) return 'purple';
    if (language === 'java' && parent.type === 'method_invocation' &&
        isField(node, 'object') && /^[A-Z]/.test(node.text)) return 'white';
    if (language === 'ruby' && parent.type === 'call' && isField(node, 'method')) return node.text === 'new' ? 'yellow' : 'purple';
    if (language === 'php' && parent.type === 'variable_name') return node.text === 'this' ? 'yellow' : 'blue';
    if (language === 'php' && parent.type === 'function_call_expression' && isField(node, 'function')) return 'yellow';
    if (parent.type === 'object_creation_expression') return 'yellow';
    // `const Widget()` / `new Widget()` name a constructor, not a type annotation.
    if (language === 'dart' && node.type === 'type_identifier' &&
        ['const_object_expression', 'new_expression'].includes(parent.type)) return 'yellow';
    if (node.type === 'type_identifier' &&
        ancestor(node, (item) => ['object_creation_expression', 'struct_expression', 'composite_literal'].includes(item.type)) &&
        !ancestor(node, (item) => typeKinds.test(item.type))) return 'yellow';
    if (node.type === 'type_identifier' || node.type === 'namespace_identifier' ||
        ancestor(node, (item) => typeKinds.test(item.type))) return 'white';
    if (['csharp', 'razor'].includes(language) && ['type', 'returns'].some((name) => isField(node, name))) return 'white';
    if (binding) {
      if (binding.kind === 'member' || binding.kind === 'enum') return 'purple';
      if (binding.kind === 'type' || binding.kind === 'constructor') return 'yellow';
      return binding.global && !['just', 'makefile', 'shellscript', 'ruby'].includes(language) ? 'yellow' : 'blue';
    }
    if (node.type === 'constant') return 'yellow';
    if (node.type === 'identifier_dollar_escaped' || node.type === 'interpolated_identifier') {
      return language === 'dart' ? 'yellow' : 'blue';
    }
    if (['call_expression', 'call', 'function_call', 'invocation_expression', 'function_call_expression'].includes(parent.type) &&
        (isField(node, 'function') || isField(node, 'name') || firstIdentifier(parent)?.id === node.id)) return 'yellow';
    if (language === 'dart' && node.nextNamedSibling?.type === 'selector' &&
        node.nextNamedSibling.firstNamedChild?.type === 'argument_part') return 'yellow';
    if (language === 'dart') return 'yellow';
    // Unknown names retain the grammar/server fallback, rather than guessing from case.
    return undefined;
  }

  // Dartdoc `[name]` references to parameters of the documented declaration
  // take that parameter's role; other references fall back to their case.
  /**
   * Resolve Dartdoc references against the declaration immediately following a comment.
   *
   * @param {import('web-tree-sitter').Node} comment Documentation comment preceding the declaration.
   * @returns {(name: string) => import('./spans').Role | undefined} Lookup restricted to parameters of that declaration.
   */
  function documentedParameters(comment) {
    let target = comment.nextNamedSibling;
    while (target && (/comment/.test(target.type) || annotationKinds.has(target.type))) target = target.nextNamedSibling;
    const found = new Map();
    const stack = target ? [target] : [];
    while (stack.length) {
      const node = stack.pop();
      if (node.type === 'block' || /body$/.test(node.type)) continue;
      if (declarations.has(node.id) && !found.has(node.text) &&
          ancestor(node, (item) => item.type === 'formal_parameter_list')) found.set(node.text, roles.get(node.id));
      stack.push(...node.namedChildren);
    }
    return (name) => found.get(name);
  }

  for (const node of nodes) {
    const text = node.text;
    if (/comment/.test(node.type)) {
      addComment(spans, source, node.startIndex, node.endIndex,
        language === 'dart' && node.type === 'documentation_comment' ? 'italic' : undefined,
        language === 'dart' ? documentedParameters(node) : undefined);
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
      if (keywords.has(text) || /^keyword_/.test(node.type)) {
        spans.add(node.startIndex, node.endIndex, 'yellow', 20,
          language === 'dart' && text === 'null' ? 'normal' : undefined);
      }
      else if (/^(?:[{}()[\],;.])$/.test(text)) spans.add(node.startIndex, node.endIndex, 'white', 15);
      else if (/^(?:[:=<>!?+*\/|&%~^@-]+|=>|->)$/.test(text)) spans.add(node.startIndex, node.endIndex, text === ':' ? 'white' : 'operator', 15);
    }
  }
  return spans.finish();
}

module.exports = { refineTree, withTree, grammars, dartConstantsAt };
