// Markers are independently authored role expectations, stripped before parsing.
module.exports = [
  ['typescript', `class «yellow|Theme» { «purple|name» = 'x'; «purple|label»(«white|prefix»: «yellow|string») { return «white|prefix» + this.«purple|name»; } }
let «white|value»: «yellow|Theme» = new «yellow|Theme»();
function «purple|run»() { for (const «white|entry» of []) { console.«purple|log»(«white|entry»); } }
namespace «yellow|Palette» { export const «white|accent» = 'x'; }
const «white|result» = «yellow|Palette».«purple|accent»;
const «white|frozen» = { x: 1 } «white|as» «yellow|const»;
const «white|keys» = «yellow|Object».«purple|keys»(«white|frozen»);`],
  ['typescript', `const «white|name» = 'global';
function «purple|outer»(«white|name»: «yellow|string») {
  { const «white|name» = 'shadow'; console.log(«white|name»); }
  return () => «white|name»;
}
«purple|outer»(«white|name»);
type «yellow|Callback» = («white|value»: «yellow|string») => «yellow|string»;
function «purple|valid»(«white|value»: «yellow|unknown»): «white|value» is «yellow|string» { return true; }
type «yellow|Data» = typeof «white|name»;`],
  ['javascriptreact', `const «purple|Card» = («white|props») => <«brown|section» «yellow|title»=«green|"x"»>{«white|props».«purple|name»} «yellow|&amp;»</«brown|section»>;
const «white|values» = [1];
const «white|list» = «white|values».«purple|map»((«white|item») => <«brown|b»>{«white|item»}</«brown|b»>);
const «white|nested» = <«brown|i»>{«white|values».«purple|map»((«white|item», «white|index») => <«brown|b» «yellow|key»={«white|index»}>{«white|item»}</«brown|b»>)}</«brown|i»>;`],
  ['typescript', `type «yellow|Shape»<«yellow|T»> = { «blue|readonly» «purple|value»?: «yellow|T» };
type «yellow|Handler» = («white|value»: «yellow|number») => «blue|void»;
type «yellow|Factory» = new («white|name»: «yellow|string») => «yellow|object»;
import «blue|type» { «yellow|CSSProperties» } from 'react';
type «yellow|Picked»<«yellow|T»> = { [«yellow|K» in keyof «yellow|T»]?: «yellow|T»[«yellow|K»] };
const «white|validated» = { «purple|count»: 2 } satisfies { «purple|count»: «yellow|number» };
type «yellow|Pair» = [«white|name»: «yellow|string», «white|count»: «yellow|number»];
function «purple|assertData»(«white|value»: «yellow|unknown»): «blue|asserts» «white|value» is «yellow|Data» {}`],
  ['typescriptreact', `const «purple|Widget» = ({ «white|title» }) => <«brown|span»>{«white|title»}</«brown|span»>;
const «purple|List» = () => <«brown|ul»>{«yellow|items».«purple|map»((«white|item», «white|index») => <«brown|li» «yellow|key»={«white|index»}>{«white|item»}</«brown|li»>)}</«brown|ul»>;`],
  ['javascript', `class «yellow|Child» extends «yellow|Parent» { «purple|constructor»() { super(); } }
function* «purple|items»(«white|name») { yield «green|\`hello \${»«white|name»«green|}\`»; }
const «white|value» = 'x'; const «white|object» = { «purple|value» };
«gray|// new Child(value), not executable code»
const «white|text» = «green|"class False { field }"»;`],
  ['javascript', `const «white|items» = [];
const «white|empty» = «orange|null»;
const «white|size» = «white|items».«purple|length»;
const «white|result» = «yellow|Math».«purple|max»(«white|size», «orange|0»);`],
  ['java', `«blue|public» «blue|final» «blue|class» «yellow|Theme» {
  final «yellow|String» «purple|name» = "x";
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») { return «white|prefix» + «purple|name»; }
  void «purple|shadow»(String «white|name») { use(«white|name»); use(this.«purple|name»); }
  void «purple|run»() { «yellow|Theme» «white|theme» = new «yellow|Theme»(); «white|theme».«purple|label»("x"); }
}`],
  ['dart', `«blue|import» 'dart:math' «white|as» «white|math»;
«gray|/// Links »«white|[»«white|name»«white|]»«gray| and code »«white|\`name\`»«gray| remain comments.»
enum «yellow|Mode» { «purple|dark», «purple|light» }
class «yellow|Theme» {
  final «yellow|String» «purple|name»;
  Theme(this.«purple|name»);
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») => «green|"$»«white|prefix»«green| \${»«purple|name»«white|.»«purple|toLowerCase»«white|()»«green|}"»;
  «yellow|T» «purple|map»«operator|<»«yellow|T»«operator|>»(«yellow|T» «yellow|Function»() «purple|callback») => «purple|callback»();
}
void «purple|main»() { final «white|theme» = «yellow|Theme»("x"); «purple|print»(«white|theme».«purple|label»("y")); }`],
  ['dart', `enum «yellow|Mode» { «purple|dark», «purple|light» }
const «white|empty» = «orange|null»;
int «purple|sizeOf»(List<Object?> «white|items») => «white|items».«purple|length»;`],
  ['dart', `class «yellow|ThemeState» {}
class «yellow|ThemeReady» extends «yellow|ThemeState» {}
void «purple|main»() {
  final «white|fixed» = 1;
  invoke(«white|fixed»: «white|fixed»);
}`],
  ['dart', `«yellow|Future»<«yellow|int»> «purple|resolveLimit»(«yellow|Future»<«yellow|int»> «white|value») «blue|async» {
  «blue|final» «white|limit» = «blue|await» «white|value»;
  «blue|return» «white|limit»;
}`],
  ['dart', `class ThemeReady { final ThemePalette palette; }
String describeTheme(ThemeReady state) => switch (state) {
  ThemeReady(:final «white|palette») => «green|'value: \${»«white|palette»«white|.»«purple|background»«green|}'»
};`],
  ['typescript', `«gray|/** Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
const «white|value» = 1;`],
  ['java', `«gray|/** Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
class «yellow|Theme» {}`],
  ['python', `«gray|# Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|.»
«white|value» = 1`],
  ['css', `«gray|/* Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. */»
.theme { color: red; }`],
  ['html', `«gray|<!-- Uses »«white|[Theme]»«gray| and »«white|\`value\`»«gray|. -->»
<div></div>`],
  ['go', `package main
type «yellow|Theme» struct { «purple|Name» «yellow|string» }
func («white|t» «yellow|Theme») «purple|Label»(«white|prefix» «yellow|string») «yellow|string» { return «white|prefix» + «white|t».«purple|Name» }
func «purple|main»() { «white|theme» := «yellow|Theme»{«purple|Name»: "x"}; fmt.«purple|Println»(«white|theme».«purple|Label»("y")) }`],
  ['python', `class «yellow|Theme»:
    «purple|name»: «yellow|str»
    def «purple|label»(«white|self», «white|prefix»: «yellow|str») -> «yellow|str»:
        return «white|prefix» + «white|self».«purple|name»
def «purple|main»():
    «white|theme» = «yellow|Theme»("x")
    print(«white|theme».«purple|label»("y"))`],
  ['rust', `struct «yellow|Theme» { «purple|name»: «yellow|String» }
impl Theme { fn «purple|label»(&self, «white|prefix»: &«yellow|str») -> «yellow|String» { «white|prefix».«purple|to_owned»() + &self.«purple|name» } }
fn «purple|main»() { let «white|theme» = «yellow|Theme» { «purple|name»: "x".into() }; «white|theme».«purple|label»("y"); }`],
  ['cpp', `class «yellow|Theme» { std::«yellow|string» «purple|name»;
  std::string «purple|label»(std::string «white|prefix») { return «white|prefix» + «purple|name»; }
  void «purple|shadow»(std::string «white|name») { use(«white|name»); use(this->«purple|name»); }
};
int «purple|main»() { Theme «white|theme»("x"); «white|theme».«purple|label»("y"); }`],
  ['c', `const char* «purple|label»(const char* «white|prefix») { return «white|prefix»; }
int «purple|main»() { const char* «white|name» = "x"; printf(«green|"%s: %02d"», «white|name», «orange|2»); return 0; }`],
  ['csharp', `record «yellow|Theme»(«yellow|string» «purple|Name») {
  «yellow|string» «purple|Label»(«yellow|string» «white|prefix») { return «white|prefix» + «purple|Name»; }
  void «purple|Run»() { var «white|theme» = new «yellow|Theme»("x"); «white|theme».«purple|Label»("y"); }
}`],
  ['kotlin', `data class «yellow|Theme»(val «purple|name»: «yellow|String») {
  fun «purple|label»(«white|prefix»: «yellow|String»): «yellow|String» = «green|"$»«white|prefix»«green| \${»«purple|name»«white|.»«purple|lowercase»«white|()»«green|}"»
}
fun «purple|main»() { val «white|theme» = «yellow|Theme»("x"); println(«white|theme».«purple|label»("y")) }`],
  ['swift', `struct «yellow|Theme» {
  let «purple|name»: «yellow|String»
  func «purple|label»(«white|prefix»: «yellow|String») -> «yellow|String» { return «white|prefix» + «purple|name» }
}
func «purple|main»() { let «white|theme» = «yellow|Theme»(name: "x"); print(«white|theme».«purple|label»(prefix: "y")) }`],
  ['ruby', `class «yellow|Theme»
  def «purple|label»(«white|prefix»)
    «green|"#{»«white|prefix»«green|}: #{»«purple|@name»«green|}"»
  end
end
def «purple|helper»(«white|value»)
  «white|value»
end`],
  ['php', `<?php class «yellow|Theme» {
  function «purple|__construct»(public «yellow|string» $«purple|name») {}
  function «purple|label»(«yellow|string» $«white|prefix»): «yellow|string» { return «green|"$»«white|prefix»«green| {»$«blue|this»->«purple|name»«green|}"»; }
}
function «purple|main»() { $«white|theme» = new «yellow|Theme»("x"); $«white|theme»->«purple|label»("y"); «purple|main»(); }`],
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
  ['html', `<script>class «yellow|Theme» {} const «white|theme» = new «yellow|Theme»(); function «purple|label»(«white|value») { return «white|value»; } «purple|label»(«white|theme»);</script>`],
  ['html', `<script>const «white|items» = []; const «white|empty» = «orange|null»; const «white|size» = «white|items».«purple|length»;</script>
<style>.preview { color: #96b38a; padding: 1rem; }</style>`],
  ['vue', `<script setup lang="ts">class «yellow|Theme» {} const «white|theme»: «yellow|Theme» = new «yellow|Theme»(); function «purple|label»(«white|value»: «yellow|string») { return «white|value»; }</script>
<template><div :title="«purple|label»('x')">{{ «white|theme».«purple|name» }}<b v-for="(«white|item», «white|index») in «yellow|items»">{{ «white|item» }} {{ «white|index» }}</b></div></template>`],
  ['vue', `<script setup lang="tsx">const «white|items» = []; const «white|model» = { value: 1 }; const «white|empty» = «orange|null»; const «white|size» = «white|items».«purple|length»;</script>
<template>{{ «white|model».«purple|value» }}</template>
<style scoped>.preview { color: #96b38a; padding: 1rem; }</style>
<i18n lang="json">{"empty": «orange|null»}</i18n>`],
  ['svelte', `<script lang="ts">class «yellow|Theme» {} const «white|theme»: «yellow|Theme» = new «yellow|Theme»();</script>
<div title={«white|theme».«purple|name»}>{#each «yellow|items» as «white|item», «white|index»}<b>{«white|item»} {«white|index»}</b>{/each}</div>`],
  ['svelte', `<script lang="ts">const «white|items» = []; const «white|model» = { value: 1 }; const «white|empty» = «orange|null»; const «white|size» = «white|items».«purple|length»;</script>
<div>{«white|model».«purple|value»}</div>
<style>.preview { color: #96b38a; padding: 1rem; }</style>`],
  ['markdown', '```ts\nclass «yellow|Theme» {}\nconst «white|theme»: «yellow|Theme» = new «yellow|Theme»();\n```'],
  ['sass', '.button\n  color: lighten«white|(»$accent, 8%«white|)»\n  content: "(not code)"'],
  ['c4', 'workspace "Theme" { model { «blue|author» = person "Author"\n«blue|system» = softwareSystem "App"\n«blue|author» -> «blue|system» "Uses" } }'],
  ['typescript', `const «white|emoji» = «green|"😀"»;\r\nfunction «purple|café»(«white|значение»: «yellow|string») { return «white|значение»; }\r\nconst «white|𐐀» = «purple|café»(«white|emoji»);`],
  ['java', `class «yellow|Café» { String «purple|имя» = «green|"😀"»; String «purple|label»(String «white|значение») { return «white|значение» + «purple|имя»; } }`],
  ['dart', `class «yellow|Theme» { String «purple|name» = 'x'; void «purple|run»(String «white|name») { «purple|print»(«white|name»); «purple|print»(this.«purple|name»); } }`],
  ['makefile', `«blue|NAME» := hi
«purple|build»:
\t@echo «green|"name: »$(«blue|NAME»)«green|"» «blue|$@» «blue|$<»
`],
  ['java', `record «yellow|Token»(String «purple|name», String «purple|color») { String «purple|label»() { return «purple|name» + «purple|color»; } }`],
  ['go', `«blue|package» main
«blue|type» «yellow|Theme» struct { «purple|Name» «yellow|string» }`],
  ['rust', `fn «purple|label»(«white|name»: &«yellow|str») -> «yellow|String» { «purple|format!»(«green|"{name}: {}"», «orange|2») }`],
  ['dart', `class «yellow|Theme» { «blue|@override» String «purple|toString»() => 'x'; }`],
  ['typescriptreact', `const «white|view» = <«brown|UI.Card» «yellow|title»="x">{value.«purple|name»}</«brown|UI.Card»>;`],
  ['javascript', `class «yellow|Theme» { «blue|get» «purple|name»() { return 'x'; } «blue|set» «purple|name»(«white|value») {} }
const «white|object» = { «purple|get»() { return 1; } };`],
  ['rust', `fn «purple|label»() {}
struct «yellow|Theme» { «purple|name»: «yellow|String» }
impl Theme { fn «purple|label»(&self) {} }
fn «purple|main»() { «purple|label»(); }`],
  ['cpp', `struct «yellow|Theme» { std::string «purple|name»; std::string label(std::string prefix); };
std::string Theme::«purple|label»(std::string «white|prefix») { return «white|prefix» + «purple|name»; }`],
  ['java', `class «yellow|Theme» {
  void «purple|run»() {
    «yellow|String» «white|message» = «yellow|String».«purple|format»("%s", "x");
    for («yellow|Theme» «white|item» : items) use(«white|item».«purple|name»);
  }
}`],
  ['kotlin', `class «yellow|Theme»
fun «yellow|Theme».«purple|label»(«white|prefix»: «yellow|String») = «white|prefix»
fun «purple|main»() { label(«white|prefix» = value) }`],
  ['cuda-cpp', `struct «yellow|Theme» { «yellow|float» «purple|accent»; };
__global__ void «purple|render»(«yellow|Theme» *«white|theme») { «white|theme»->«purple|accent» = «orange|1.0f»; }`],
  ['groovy', `class «yellow|Theme» {
  «yellow|String» «purple|name»
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») { «green|"\${»«white|prefix»«green|}: \${»«purple|name»«green|}"» }
}
new «yellow|Theme»().«purple|label»('x')`],
  ['julia', `module «purple|ThemeKit»
struct «yellow|Theme»
  «purple|name»::«yellow|String»
end
function «purple|label»(«white|theme»::«yellow|Theme»; «white|prefix»="x")
  «green|"$(»«white|prefix»«green|) $(»«white|theme»«white|.»«purple|name»«green|)"»
end
end`],
  ['lua', `local «white|Theme» = {}
function «white|Theme».«purple|new»(«white|name»)
  return «purple|setmetatable»({ «purple|name» = «white|name» }, «white|Theme»)
end
local «white|theme» = «white|Theme».«purple|new»("x")
print(«white|theme».«purple|name»)`],
  ['objective-c', `@interface «yellow|Theme» : NSObject
@property NSString *«purple|name»;
- (NSString *)«purple|label»:(NSString *)«white|prefix»;
@end`],
  ['objective-cpp', `@implementation «yellow|Theme»
- (NSString *)«purple|label»:(NSString *)«white|prefix» { return self.«purple|name»; }
@end`],
  ['r', `«white|theme» <- list(«white|name» = "x")
«white|label» <- function(«white|value») paste(«white|value»$«purple|name»)
«purple|label»(«white|theme»)`],
  ['ini', `[«purple|theme»]
«purple|name»«operator|=»«green|CodePen»
«purple|enabled»«operator|=»«yellow|true»
«purple|count»«operator|=»«orange|2»
«purple|source»«operator|=»«green|\${»«blue|HOME»«green|}/theme»`],
  ['properties', `«purple|theme.name»«operator|=»«green|CodePen»
«purple|theme.count»«operator|=»«orange|2»
«purple|theme.source»«operator|=»«green|\${»«blue|base»«green|}/theme»`],
  ['dockerfile', `ARG «blue|VERSION»=«orange|22»
FROM node:\${«blue|VERSION»} AS «blue|build»
LABEL «purple|theme»="CodePen"
COPY --from=«blue|build» /src /app`],
  ['bibtex', `@article{«blue|twilight2026»,
  «purple|author» = {CodePen},
  «purple|title» = {Twilight}
}`],
  ['latex', `\\newcommand{«blue|\\theme»}[2]{«blue|#1» + «blue|#2»}
«yellow|\\begin»{green} «yellow|\\theme»{x}{«orange|2»} «yellow|\\end»{green}`],
  ['tex', `\\def«blue|\\theme»#1{«yellow|\\textbf»{«blue|#1»}}`],
  ['wat', `(module
  (type «blue|$signature» (func))
  (func «blue|$render» (type «white|$signature») (param «blue|$value» i32)
    call «yellow|$helper»)
  (export "render" (func «yellow|$render»)))`],
  ['fsharp', `type «yellow|Theme» = { «purple|Name»: «yellow|string» }
type «yellow|Mode» = | «purple|Original» | «purple|Ligatures»
let «purple|label» «white|prefix» «white|theme» = «green|$"{»«white|prefix»«green|}: {»«white|theme»«white|.»«purple|Name»«green|}"»`],
  ['hlsl', `cbuffer «yellow|ThemeSettings» : register(b0) { float4 «purple|Accent»; };
struct «yellow|Input» { float3 «purple|position» : «purple|POSITION»; };
float4 «purple|render»(«yellow|Input» «white|input») : «purple|SV_Target» { return «white|input».«purple|position».x + «orange|1.0»; }`],
  ['shaderlab', `Shader "Theme" { Properties { «purple|_Accent» ("Accent", Color) = (1,1,1,1) }
SubShader { Pass { CGPROGRAM
float4 «purple|render»(float4 «white|position» : «purple|POSITION») : «purple|SV_Target» { return «white|position»; }
ENDCG } } }`],
  ['powershell', `class «yellow|Theme» {
  [string] «purple|$Name»
  [string] «purple|Label»([string] «white|$prefix») { return «green|"\${»«white|prefix»«green|}: $(»«yellow|$this»«white|.»«purple|Name»«green|)"» }
}
function «purple|Show-Theme»([Theme] «white|$theme») { «white|$theme».«purple|Label»('x') }`],
  ['perl', `package «yellow|Theme»;
sub «purple|label» { my «white|$self» = shift; return «green|"»«white|$self»«green|->{»«purple|name»«green|}"»; }
package «yellow|main»;
my «white|$theme» = «yellow|Theme»->«purple|new»(«white|name» => 'x');`],
  ['raku', `enum «yellow|Mode» <«purple|original» «purple|ligatures»>;
class «yellow|Theme» { has Str «purple|$.name»; method «purple|label»(Str «white|$prefix») { «green|"»«white|$prefix»«green|: »«purple|$!name»«green|"» } }
my «white|$theme» = Theme.«purple|new»(«white|name» => 'x');`],
  ['vb', `Public Class «yellow|Theme»
  Public Property «purple|Name» As «yellow|String»
  Public Function «purple|Label»(«white|prefix» As «yellow|String») As «yellow|String»
    Return «green|$"{»«white|prefix»«green|}: {»«purple|Name»«green|}"»
  End Function
End Class`],
  ['handlebars', `<article>{{«yellow|theme».«purple|name»}}</article>
{{#each theme.tokens as |«white|token» «white|index»|}}{{«white|token».«purple|name»}}{{/each}}
{{helper «purple|name»=«yellow|theme».«purple|name»}}`],
  ['jade', `- const «white|theme» = { «purple|name»: 'x' }
mixin «purple|token»(«white|name»)
  code= «white|name»
main.card(data-name=«yellow|theme».«purple|name»)
  +«yellow|token»(«yellow|theme».«purple|name»)`],
  ['bat', `:«purple|render»
call :«purple|label»
:«purple|label»`],
  ['coffeescript', `class «yellow|Theme»
  constructor: («purple|@name») ->
  «purple|label»: («white|prefix») -> «green|"#{»«white|prefix»«green|}: #{»«purple|@name»«green|}"»
«white|theme» = new Theme 'x'
theme.«purple|label»()`],
  ['coffeescript', `«white|items» = []
«white|empty» = «orange|null»
«white|size» = «white|items».«purple|length»
«white|largest» = Math.«purple|max» «white|size», «orange|0»`],
  ['jsonc', `{
  "empty": «orange|null»,
  "text": "null"
  // null
}`],
  ['clojure', `(defrecord «yellow|Theme» [«purple|name»])
(defprotocol «yellow|Renderable» («purple|render» [value prefix]))
(defn «purple|label» [«white|theme»] (str «white|theme»))
(«purple|label» default-theme)`],
  ['razor', `<«brown|PageTitle»>@«purple|State».«purple|Title»</«brown|PageTitle»>
@code { private «yellow|ThemeState» «purple|State» { get; } = new «yellow|ThemeState»(); }`],
];
