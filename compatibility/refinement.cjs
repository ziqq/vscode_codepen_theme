// Markers are independently authored role expectations, stripped before parsing.
module.exports = [
  ['typescript', `class «blue|Theme» { «purple|name» = 'x'; «purple|label»(«blue|prefix»: «white|string») { return «blue|prefix» + this.«purple|name»; } }
let «blue|value»: «white|Theme» = new «yellow|Theme»();
function «blue|run»() { for (const «blue|entry» of []) { console.«purple|log»(«blue|entry»); } }
namespace «yellow|Palette» { export const «blue|accent» = 'x'; }
const «blue|result» = «yellow|Palette».«purple|accent»;
const «blue|frozen» = { x: 1 } as «yellow|const»;
const «blue|keys» = «yellow|Object».«purple|keys»(«yellow|frozen»);`],
  ['typescript', `const «blue|name» = 'global';
function «blue|outer»(«blue|name»: «white|string») {
  { const «blue|name» = 'shadow'; console.log(«blue|name»); }
  return () => «blue|name»;
}
«yellow|outer»(«yellow|name»);
type «white|Callback» = («yellow|value»: «white|string») => «white|string»;
function «blue|valid»(«blue|value»: «white|unknown»): «blue|value» is «white|string» { return true; }
type «white|Data» = typeof «yellow|name»;`],
  ['javascriptreact', `const «blue|Card» = («blue|props») => <«brown|section» «yellow|title»=«green|"x"»>{«yellow|props».«purple|name»} «yellow|&amp;»</«brown|section»>;
const «blue|values» = [1];
const «blue|list» = «yellow|values».«purple|map»((«blue|item») => <«brown|b»>{«yellow|item»}</«brown|b»>);
const «blue|nested» = <«brown|i»>{«yellow|values».«purple|map»((«yellow|item», «yellow|index») => <«brown|b» «yellow|key»={«yellow|index»}>{«yellow|item»}</«brown|b»>)}</«brown|i»>;`],
  ['typescript', `type «white|Shape»<«white|T»> = { «purple|readonly» «purple|value»?: «white|T» };
type «white|Handler» = («yellow|value»: «white|number») => «white|void»;
type «white|Factory» = new («yellow|name»: «white|string») => «white|object»;
import «blue|type» { «yellow|CSSProperties» } from 'react';
type «white|Picked»<«white|T»> = { [«yellow|K» in keyof «white|T»]?: «white|T»[«white|K»] };
const «blue|validated» = { «purple|count»: 2 } satisfies { «yellow|count»: «yellow|number» };
type «white|Pair» = [«white|name»: «yellow|string», «yellow|count»: «yellow|number»];
function «blue|assertData»(«blue|value»: «white|unknown»): «white|asserts» «blue|value» is «yellow|Data» {}`],
  ['typescriptreact', `const «blue|Widget» = ({ «blue|title» }) => <«brown|span»>{«yellow|title»}</«brown|span»>;
const «blue|List» = () => <«brown|ul»>{«yellow|items».«purple|map»((«yellow|item», «yellow|index») => <«brown|li» «yellow|key»={«yellow|index»}>{«yellow|item»}</«brown|li»>)}</«brown|ul»>;`],
  ['javascript', `class «blue|Child» extends «yellow|Parent» { «purple|constructor»() { super(); } }
function* «blue|items»(«blue|name») { yield «green|\`hello \${»«blue|name»«green|}\`»; }
const «blue|value» = 'x'; const «blue|object» = { «purple|value» };
«gray|// new Child(value), not executable code»
const «blue|text» = «green|"class False { field }"»;`],
  ['java', `«yellow|public» «yellow|final» «yellow|class» «blue|Theme» {
  final «white|String» «purple|name» = "x";
  «white|String» «purple|label»(«white|String» «blue|prefix») { return «blue|prefix» + «purple|name»; }
  void «purple|shadow»(String «blue|name») { use(«blue|name»); use(this.«purple|name»); }
  void «purple|run»() { «white|Theme» «blue|theme» = new «yellow|Theme»(); «blue|theme».«purple|label»("x"); }
}`],
  ['dart', `«gray|/// Links »«white|[»«purple|name»«white|]»«gray| and code »«white|\`name\`»«gray| remain comments.»
enum «blue|Mode» { «blue|dark», «blue|light» }
class «blue|Theme» {
  final «white|String» «purple|name»;
  Theme(this.«purple|name»);
  «white|String» «purple|label»(«white|String» «blue|prefix») => «green|"$»«blue|prefix»«green| \${»«purple|name»«white|.»«purple|toLowerCase»«white|()»«green|}"»;
  «white|T» «purple|map»«operator|<»«white|T»«operator|>»(«white|T» «white|Function»() «blue|callback») => «blue|callback»();
}
void «blue|main»() { final «blue|theme» = «yellow|Theme»("x"); print(«blue|theme».«purple|label»("y")); }`],
  ['dart', `class «blue|ThemeState» {}
class «blue|ThemeReady» extends «white|ThemeState» {}
void «blue|main»() {
  final «blue|fixed» = 1;
  invoke(«purple|fixed»: «blue|fixed»);
}`],
  ['dart', `class ThemeReady { final ThemePalette palette; }
String describeTheme(ThemeReady state) => switch (state) {
  ThemeReady(:final «blue|palette») => «green|'value: \${»«blue|palette»«white|.»«purple|background»«green|}'»
};`],
  ['typescript', `«gray|/** Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
const «blue|value» = 1;`],
  ['java', `«gray|/** Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
class «blue|Theme» {}`],
  ['python', `«gray|# Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|.»
«blue|value» = 1`],
  ['css', `«gray|/* Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
.theme { color: red; }`],
  ['html', `«gray|<!-- Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. -->»
<div></div>`],
  ['go', `package main
type «blue|Theme» struct { «purple|Name» «white|string» }
func («blue|t» «white|Theme») «purple|Label»(«blue|prefix» «white|string») «white|string» { return «blue|prefix» + «blue|t».«purple|Name» }
func «blue|main»() { «blue|theme» := «yellow|Theme»{«purple|Name»: "x"}; fmt.«purple|Println»(«blue|theme».«purple|Label»("y")) }`],
  ['python', `class «blue|Theme»:
    «purple|name»: «white|str»
    def «purple|label»(«blue|self», «blue|prefix»: «white|str») -> «white|str»:
        return «blue|prefix» + «blue|self».«purple|name»
def «blue|main»():
    «blue|theme» = «yellow|Theme»("x")
    print(«blue|theme».«purple|label»("y"))`],
  ['rust', `struct «blue|Theme» { «purple|name»: «white|String» }
impl Theme { fn «purple|label»(&self, «blue|prefix»: &«white|str») -> «white|String» { «blue|prefix».«purple|to_owned»() + &self.«purple|name» } }
fn «blue|main»() { let «blue|theme» = «yellow|Theme» { «purple|name»: "x".into() }; «blue|theme».«purple|label»("y"); }`],
  ['cpp', `class «blue|Theme» { std::«white|string» «purple|name»;
  std::string «purple|label»(std::string «blue|prefix») { return «blue|prefix» + «purple|name»; }
  void «purple|shadow»(std::string «blue|name») { use(«blue|name»); use(this->«purple|name»); }
};
int «blue|main»() { Theme «blue|theme»("x"); «blue|theme».«purple|label»("y"); }`],
  ['c', `const char* «blue|label»(const char* «blue|prefix») { return «blue|prefix»; }
int «blue|main»() { const char* «blue|name» = "x"; printf(«green|"%s: %02d"», «blue|name», «orange|2»); return 0; }`],
  ['csharp', `record «blue|Theme»(«white|string» «purple|Name») {
  «white|string» «purple|Label»(«white|string» «blue|prefix») { return «blue|prefix» + «purple|Name»; }
  void «purple|Run»() { var «blue|theme» = new «yellow|Theme»("x"); «blue|theme».«purple|Label»("y"); }
}`],
  ['kotlin', `data class «blue|Theme»(val «purple|name»: «white|String») {
  fun «purple|label»(«blue|prefix»: «white|String»): «white|String» = «green|"$»«blue|prefix»«green| \${»«purple|name»«white|.»«purple|lowercase»«white|()»«green|}"»
}
fun «blue|main»() { val «blue|theme» = «yellow|Theme»("x"); println(«blue|theme».«purple|label»("y")) }`],
  ['swift', `struct «blue|Theme» {
  let «purple|name»: «white|String»
  func «purple|label»(«blue|prefix»: «white|String») -> «white|String» { return «blue|prefix» + «purple|name» }
}
func «blue|main»() { let «blue|theme» = «yellow|Theme»(name: "x"); print(«blue|theme».«purple|label»(prefix: "y")) }`],
  ['ruby', `class «blue|Theme»
  def «purple|label»(«blue|prefix»)
    «green|"#{»«blue|prefix»«green|}: #{»«purple|@name»«green|}"»
  end
end
def «purple|helper»(«blue|value»)
  «blue|value»
end`],
  ['php', `<?php class «blue|Theme» {
  function «purple|__construct»(public «white|string» $«purple|name») {}
  function «purple|label»(«white|string» $«blue|prefix»): «white|string» { return «green|"$»«blue|prefix»«green| {»$«yellow|this»->«purple|name»«green|}"»; }
}
function «blue|main»() { $«blue|theme» = new «yellow|Theme»("x"); $«blue|theme»->«purple|label»("y"); «yellow|main»(); }`],
  ['just', `«blue|name» := "world"
«purple|build» «blue|who»=«blue|name»:
    echo «green|{{»«yellow|uppercase»«white|(»«blue|who»«white|)»«green|}}»
alias «purple|b» := «purple|build»
«purple|all»: («purple|build» «blue|name»)
`],
  ['makefile', `«blue|NAME» := hi
«purple|all»: $(«blue|OBJECTS») «operator||» «purple|build»
\t@echo "$(«blue|NAME») $@"
«purple|build»:
\t@mkdir -p build
`],
  ['sql', `«yellow|SELECT» «purple|name» FROM tokens WHERE «purple|active» = «yellow|TRUE» AND «purple|deleted» = «yellow|FALSE»;`],
  ['dotenv', `«blue|MODE»=«green|dark»
«blue|COUNT»=«green|42»
«blue|VALUE»=«green|"\${»«blue|MODE»«green|} \${»«blue|COUNT»«green|}"»
«blue|LITERAL»=«green|'\${MODE}'»
«blue|HASH»=«green|"# not comment"» «gray|# comment»`],
  ['shellscript', `«blue|name»="world"
echo «green|"\${»«blue|name»«green|}"»
`],
  ['html', `<script>class «blue|Theme» {} const «blue|theme» = new «yellow|Theme»(); function «blue|label»(«blue|value») { return «blue|value»; } «yellow|label»(«yellow|theme»);</script>`],
  ['vue', `<script setup lang="ts">class «blue|Theme» {} const «blue|theme»: «white|Theme» = new «yellow|Theme»(); function «blue|label»(«blue|value»: «white|string») { return «blue|value»; }</script>
<template><div :title="«yellow|label»('x')">{{ «yellow|theme».«purple|name» }}<b v-for="(«blue|item», «blue|index») in «yellow|items»">{{ «blue|item» }} {{ «blue|index» }}</b></div></template>`],
  ['svelte', `<script lang="ts">class «blue|Theme» {} const «blue|theme»: «white|Theme» = new «yellow|Theme»();</script>
<div title={«yellow|theme».«purple|name»}>{#each «yellow|items» as «blue|item», «blue|index»}<b>{«blue|item»} {«blue|index»}</b>{/each}</div>`],
  ['markdown', '```ts\nclass «blue|Theme» {}\nconst «blue|theme»: «white|Theme» = new «yellow|Theme»();\n```'],
  ['sass', '.button\n  color: lighten«white|(»$accent, 8%«white|)»\n  content: "(not code)"'],
  ['c4', 'workspace "Theme" { model { «blue|author» = person "Author"\n«blue|system» = softwareSystem "App"\n«blue|author» -> «blue|system» "Uses" } }'],
  ['typescript', `const «blue|emoji» = «green|"😀"»;\r\nfunction «blue|café»(«blue|значение»: «white|string») { return «blue|значение»; }\r\nconst «blue|𐐀» = «yellow|café»(«yellow|emoji»);`],
  ['java', `class «blue|Café» { String «purple|имя» = «green|"😀"»; String «purple|label»(String «blue|значение») { return «blue|значение» + «purple|имя»; } }`],
  ['dart', `class «blue|Theme» { String «purple|name» = 'x'; void «purple|run»(String «blue|name») { print(«blue|name»); print(this.«purple|name»); } }`],
  ['makefile', `«blue|NAME» := hi
«purple|build»:
\t@echo «green|"name: »$(«blue|NAME»)«green|"» «blue|$@» «blue|$<»
`],
  ['java', `record «blue|Token»(String «purple|name», String «purple|color») { String «purple|label»() { return «purple|name» + «purple|color»; } }`],
  ['go', `«yellow|package» main
«yellow|type» «blue|Theme» struct { «purple|Name» «white|string» }`],
  ['rust', `fn «blue|label»(«blue|name»: &«white|str») -> «white|String» { «purple|format!»(«green|"{name}: {}"», «orange|2») }`],
  ['dart', `class «blue|Theme» { «yellow|@override» String «purple|toString»() => 'x'; }`],
  ['typescriptreact', `const «blue|view» = <«brown|UI.Card» «yellow|title»="x">{value.«purple|name»}</«brown|UI.Card»>;`],
  ['javascript', `class «blue|Theme» { «yellow|get» «purple|name»() { return 'x'; } «yellow|set» «purple|name»(«blue|value») {} }
const «blue|object» = { «purple|get»() { return 1; } };`],
  ['rust', `fn «blue|label»() {}
struct «blue|Theme» { «purple|name»: «white|String» }
impl Theme { fn «purple|label»(&self) {} }
fn «blue|main»() { «yellow|label»(); }`],
  ['cpp', `struct «blue|Theme» { std::string «purple|name»; std::string label(std::string prefix); };
std::string Theme::«purple|label»(std::string «blue|prefix») { return «blue|prefix» + «purple|name»; }`],
];
