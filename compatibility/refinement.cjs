// Markers are independently authored role expectations, stripped before parsing.
module.exports = [
  ['typescript', `class «yellow|Theme» { «white|name» = 'x'; «purple|label»(«white|prefix»: «yellow|string») { return «white|prefix» + this.«white|name»; } }
let «white|value»: «yellow|Theme» = new «yellow|Theme»();
function «purple|run»() { for (const «white|entry» of []) { console.«purple|log»(«white|entry»); } }
namespace «yellow|Palette» { export const «white|accent» = 'x'; }
const «white|result» = «yellow|Palette».«white|accent»;
const «white|frozen» = { x: 1 } «blue/italic|as» «yellow|const»;
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
  ['javascriptreact', `const «purple|Card» = («white|props») => <«brown|section» «yellow|title»=«green|"x"»>{«white|props».«white|name»} «yellow|&amp;»</«brown|section»>;
const «white|values» = [1];
const «white|list» = «white|values».«purple|map»((«white|item») => <«brown|b»>{«white|item»}</«brown|b»>);
const «white|nested» = <«brown|i»>{«white|values».«purple|map»((«white|item», «white|index») => <«brown|b» «yellow|key»={«white|index»}>{«white|item»}</«brown|b»>)}</«brown|i»>;`],
  ['typescript', `type «yellow|Shape»<«yellow|T»> = { «blue|readonly» «white|value»?: «yellow|T» };
type «yellow|Handler» = («white|value»: «yellow|number») => «yellow|void»;
type «yellow|Factory» = new («white|name»: «yellow|string») => «yellow|object»;
import «blue|type» { «yellow|CSSProperties» } from 'react';
type «yellow|Picked»<«yellow|T»> = { [«yellow|K» in keyof «yellow|T»]?: «yellow|T»[«yellow|K»] };
const «white|validated» = { «white|count»: 2 } satisfies { «white|count»: «yellow|number» };
type «yellow|Pair» = [«white|name»: «yellow|string», «white|count»: «yellow|number»];
function «purple|assertData»(«white|value»: «yellow|unknown»): «blue|asserts» «white|value» is «yellow|Data» {}`],
  ['typescriptreact', `const «purple|Widget» = ({ «white|title» }) => <«brown|span»>{«white|title»}</«brown|span»>;
const «purple|List» = () => <«brown|ul»>{«yellow|items».«purple|map»((«white|item», «white|index») => <«brown|li» «yellow|key»={«white|index»}>{«white|item»}</«brown|li»>)}</«brown|ul»>;`],
  ['javascript', `class «yellow|Child» extends «yellow|Parent» { «purple|constructor»() { super(); } }
function* «purple|items»(«white|name») { yield «green|\`hello \${»«white|name»«green|}\`»; }
const «white|value» = 'x'; const «white|object» = { «white|value» };
«gray|// new Child(value), not executable code»
const «white|text» = «green|"class False { field }"»;`],
  ['javascript', `const «white|items» = [];
const «white|empty» = «orange|null»;
const «white|size» = «white|items».«white|length»;
const «white|result» = «yellow|Math».«purple|max»(«white|size», «orange|0»);`],
  ['java', `«blue|public» «blue|final» «blue|class» «yellow|Theme» {
  final «yellow|String» «white|name» = "x";
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») { return «white|prefix» + «white|name»; }
  void «purple|shadow»(String «white|name») { use(«white|name»); use(this.«white|name»); }
  void «purple|run»() { «yellow|Theme» «white|theme» = new «yellow|Theme»(); «white|theme».«purple|label»("x"); }
}`],
  ['dart', `«blue|import» 'dart:math' «blue/italic|as» «white|math»;
«gray|/// Links »«documentation|[»«documentation|name»«documentation|]»«gray| and code »«documentation|\`name\`»«gray| remain comments.»
enum «yellow|Mode» { «white|dark», «white|light» }
class «yellow|Theme» {
  final «yellow|String» «white|name»;
  Theme(this.«white|name»);
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») => «green|"$»«white|prefix»«green| \${»«white|name»«white|.»«purple|toLowerCase»«white|()»«green|}"»;
  «yellow|T» «purple|map»«operator|<»«yellow|T»«operator|>»(«yellow|T» «yellow|Function»() «white|callback») => «purple|callback»();
}
void «purple|main»() { final «white|theme» = «yellow|Theme»("x"); «purple|print»(«white|theme».«purple|label»("y")); }`],
  ['dart', `class «yellow|_Presentation» {
  «yellow|_Presentation»({required Object status});
}
void «purple|main»() {
  final «white|duration» = «yellow|Duration»(milliseconds: 200);
  final «white|focus» = «yellow|FocusScopeNode»(debugLabel: 'status');
  FlutterError.«purple|reportError»(«yellow|FlutterErrorDetails»(exception: error));
  final «white|child» = «yellow|ValueListenableBuilder»(valueListenable: value);
}`],
  ['dart', `enum «yellow|Mode» { «white|dark», «white|light» }
const «white|empty» = «orange|null»;
int «purple|sizeOf»(List<Object?> «white|items») => «white|items».«white|length»;`],
  ['dart', `class «yellow|ThemeState» {}
class «yellow|ThemeReady» extends «yellow|ThemeState» {}
void «purple|main»() {
  final «white|fixed» = 1;
  invoke(«white|fixed»: «white|fixed»);
}`],
  ['dart', `«yellow|Future»<«yellow|int»> «purple|resolveLimit»(«yellow|Future»<«yellow|int»> «white|value») «blue/italic|async» {
  «blue|final» «white|limit» = «blue/italic|await» «white|value»;
  «blue/italic|return» «white|limit»;
}`],
  ['dart', `class ThemeReady { final ThemePalette palette; }
String describeTheme(ThemeReady state) => switch (state) {
  ThemeReady(:final «white|palette») => «green|'value: \${»«white|palette»«white|.»«white|background»«green|}'»
};`],
  ['typescript', `«gray|/** Uses »«documentation|[»«yellow|Theme»«documentation|]»«gray| and »«documentation|\`value\`»«gray|. */»
const «white|value» = 1;`],
  ['java', `«gray|/** Uses »«documentation|[»«yellow|Theme»«documentation|]»«gray| and »«documentation|\`value\`»«gray|. */»
class «yellow|Theme» {}`],
  ['python', `«gray|# Uses »«documentation|[»«yellow|Theme»«documentation|]»«gray| and »«documentation|\`value\`»«gray|.»
«white|value» = 1`],
  ['css', `«gray|/* Uses »«documentation|[»«yellow|Theme»«documentation|]»«gray| and »«documentation|\`value\`»«gray|. */»
.theme { color: red; }`],
  ['html', `«gray|<!-- Uses »«documentation|[»«yellow|Theme»«documentation|]»«gray| and »«documentation|\`value\`»«gray|. -->»
<div></div>`],
  ['go', `package main
type «yellow|Theme» struct { «white|Name» «yellow|string» }
func («white|t» «yellow|Theme») «purple|Label»(«white|prefix» «yellow|string») «yellow|string» { return «white|prefix» + «white|t».«white|Name» }
func «purple|main»() { «white|theme» := «yellow|Theme»{«white|Name»: "x"}; fmt.«purple|Println»(«white|theme».«purple|Label»("y")) }`],
  ['python', `class «yellow|Theme»:
    «white|name»: «yellow|str»
    def «purple|label»(«yellow|self», «white|prefix»: «yellow|str») -> «yellow|str»:
        return «white|prefix» + «yellow|self».«white|name»
def «purple|main»():
    «white|theme» = «yellow|Theme»("x")
    print(«white|theme».«purple|label»("y"))`],
  ['python', `«white|widget» = «yellow|ExternalWidget»()`],
  ['rust', `struct «yellow|Theme» { «white|name»: «yellow|String» }
impl Theme { fn «purple|label»(&self, «white|prefix»: &«yellow|str») -> «yellow|String» { «white|prefix».«purple|to_owned»() + &self.«white|name» } }
fn «purple|main»() { let «white|theme» = «yellow|Theme» { «white|name»: "x".into() }; «white|theme».«purple|label»("y"); }`],
  ['cpp', `class «yellow|Theme» { std::«yellow|string» «white|name»;
  std::string «purple|label»(std::string «white|prefix») { return «white|prefix» + «white|name»; }
  void «purple|shadow»(std::string «white|name») { use(«white|name»); use(this->«white|name»); }
};
int «purple|main»() { Theme «white|theme»("x"); «white|theme».«purple|label»("y"); }`],
  ['c', `const char* «purple|label»(const char* «white|prefix») { return «white|prefix»; }
int «purple|main»() { const char* «white|name» = "x"; printf(«green|"%s: %02d"», «white|name», «orange|2»); return 0; }`],
  ['csharp', `record «yellow|Theme»(«yellow|string» «white|Name») {
  «yellow|string» «purple|Label»(«yellow|string» «white|prefix») { return «white|prefix» + «white|Name»; }
  void «purple|Run»() { var «white|theme» = new «yellow|Theme»("x"); «white|theme».«purple|Label»("y"); }
}`],
  ['kotlin', `data class «yellow|Theme»(val «white|name»: «yellow|String») {
  fun «purple|label»(«white|prefix»: «yellow|String»): «yellow|String» = «green|"$»«white|prefix»«green| \${»«white|name»«white|.»«purple|lowercase»«white|()»«green|}"»
}
fun «purple|main»() { val «white|theme» = «yellow|Theme»("x"); println(«white|theme».«purple|label»("y")) }`],
  ['kotlin', `val «white|widget» = «yellow|ExternalWidget»()`],
  ['swift', `struct «yellow|Theme» {
  let «white|name»: «yellow|String»
  func «purple|label»(«white|prefix»: «yellow|String») -> «yellow|String» { return «white|prefix» + «white|name» }
}
func «purple|main»() { let «white|theme» = «yellow|Theme»(name: "x"); print(«white|theme».«purple|label»(prefix: "y")) }`],
  ['swift', `let «white|widget» = «yellow|ExternalWidget»()`],
  ['ruby', `class «yellow|Theme»
  def «purple|label»(«white|prefix»)
    «green|"#{»«white|prefix»«green|}: #{»«white|@name»«green|}"»
  end
end
def «purple|helper»(«white|value»)
  «white|value»
end
«white|theme» = «yellow|Theme».«purple|new»('x')`],
  ['php', `<?php class «yellow|Theme» {
  function «purple|__construct»(public «yellow|string» $«white|name») {}
  function «purple|label»(«yellow|string» $«white|prefix»): «yellow|string» { return «green|"$»«white|prefix»«green| {»$«yellow|this»->«white|name»«green|}"»; }
}
function «purple|main»() { $«white|theme» = new «yellow|Theme»("x"); $«white|theme»->«purple|label»("y"); «purple|main»(); }`],
  ['just', `«blue|name» := "world"
«purple|build» «blue|who»=«blue|name»:
    echo «green|{{»«purple|uppercase»«white|(»«blue|who»«white|)»«green|}}»
alias «purple|b» := «purple|build»
«purple|all»: («purple|build» «blue|name»)
«blue|mode» := «purple|env_var_or_default»«white|(»"MODE", "dark"«white|)»
`],
  ['makefile', `«blue|NAME» := hi
«purple|all»: $(«blue|OBJECTS») «operator||» «purple|build»
\t@echo "$(«blue|NAME») $@"
«purple|build»:
\t@mkdir -p build
`],
  ['sql', `«yellow/normal|WITH» active AS («yellow/normal|SELECT» «white/normal|name» FROM tokens WHERE «white/normal|active» = «orange/normal|TRUE»)
SELECT «blue/normal|active».«white/normal|name» FROM active WHERE «white/normal|deleted» = «orange/normal|FALSE»;`],
  ['dotenv', `«blue|MODE»=«green|dark»
«blue|ENABLED»=«orange|true»
«blue|COUNT»=«green|42»
«blue|VALUE»=«green|"\${»«blue|MODE»«green|} \${»«blue|COUNT»«green|}"»
«blue|LITERAL»=«green|'\${MODE}'»
«blue|HASH»=«green|"# not comment"» «gray|# comment»`],
  ['shellscript', `«blue|name»="world"
«yellow/italic|for» «blue|item» «yellow/italic|in» one; «yellow/italic|do» echo «green|"\${»«blue|name»«green|}"»; «yellow/italic|done»
`],
  ['html', `<script>class «yellow|Theme» {} const «white|theme» = new «yellow|Theme»(); function «purple|label»(«white|value») { return «white|value»; } «purple|label»(«white|theme»);</script>`],
  ['html', `<script>const «white|items» = []; const «white|empty» = «orange|null»; const «white|size» = «white|items».«white|length»;</script>
<style>.preview { color: #96b38a; padding: 1rem; }</style>`],
  ['vue', `<script setup lang="ts">class «yellow|Theme» {} const «white|theme»: «yellow|Theme» = new «yellow|Theme»(); function «purple|label»(«white|value»: «yellow|string») { return «white|value»; }</script>
<template><div :title="«purple|label»('x')">{{ «white|theme».«white|name» }}<b v-for="(«white|item», «white|index») in «yellow|items»">{{ «white|item» }} {{ «white|index» }}</b></div></template>`],
  ['vue', `<script setup lang="tsx">const «white|items» = []; const «white|model» = { value: 1 }; const «white|empty» = «orange|null»; const «white|size» = «white|items».«white|length»;</script>
<template>{{ «white|model».«white|value» }}</template>
<style scoped>.preview { color: #96b38a; padding: 1rem; }</style>
<i18n lang="json">{"empty": «orange|null»}</i18n>`],
  ['svelte', `<script lang="ts">class «yellow|Theme» {} const «white|theme»: «yellow|Theme» = new «yellow|Theme»();</script>
<div title={«white|theme».«white|name»}>{#each «yellow|items» as «white|item», «white|index»}<b>{«white|item»} {«white|index»}</b>{/each}</div>`],
  ['svelte', `<script lang="ts">const «white|items» = []; const «white|model» = { value: 1 }; const «white|empty» = «orange|null»; const «white|size» = «white|items».«white|length»;</script>
<div>{«white|model».«white|value»}</div>
<style>.preview { color: #96b38a; padding: 1rem; }</style>`],
  ['markdown', '```ts\nclass «yellow|Theme» {}\nconst «white|theme»: «yellow|Theme» = new «yellow|Theme»();\n```'],
  ['sass', '.button\n  color: lighten«white|(»$accent, 8%«white|)»\n  content: "(not code)"'],
  ['c4', 'workspace "Theme" { model { «blue|author» = person "Author"\n«blue|system» = softwareSystem "App"\n«blue|author» -> «blue|system» "Uses" } }'],
  ['typescript', `const «white|emoji» = «green|"😀"»;\r\nfunction «purple|café»(«white|значение»: «yellow|string») { return «white|значение»; }\r\nconst «white|𐐀» = «purple|café»(«white|emoji»);`],
  ['java', `class «yellow|Café» { String «white|имя» = «green|"😀"»; String «purple|label»(String «white|значение») { return «white|значение» + «white|имя»; } }`],
  ['dart', `class «yellow|Theme» { String «white|name» = 'x'; void «purple|run»(String «white|name») { «purple|print»(«white|name»); «purple|print»(this.«white|name»); } }`],
  ['makefile', `«blue|NAME» := hi
«purple|build»:
\t@echo «green|"name: »$(«blue|NAME»)«green|"» «blue|$@» «blue|$<»
`],
  ['java', `record «yellow|Token»(String «white|name», String «white|color») { String «purple|label»() { return «white|name» + «white|color»; } }`],
  ['go', `«blue|package» main
«blue|type» «yellow|Theme» struct { «white|Name» «yellow|string» }`],
  ['rust', `fn «purple|label»(«white|name»: &«yellow|str») -> «yellow|String» { «purple|format!»(«green|"{name}: {}"», «orange|2») }`],
  ['dart', `class «yellow|Theme» { «blue|@»«blue/italic|override» String «purple|toString»() => 'x'; }`],
  ['typescriptreact', `const «white|view» = <«brown|UI.Card» «yellow|title»="x">{value.«white|name»}</«brown|UI.Card»>;`],
  ['javascript', `class «yellow|Theme» { «blue|get» «white|name»() { return 'x'; } «blue|set» «white|name»(«white|value») {} }
const «white|object» = { «purple|get»() { return 1; } };`],
  ['rust', `fn «purple|label»() {}
struct «yellow|Theme» { «white|name»: «yellow|String» }
impl Theme { fn «purple|label»(&self) {} }
fn «purple|main»() { «purple|label»(); }`],
  ['cpp', `struct «yellow|Theme» { std::string «white|name»; std::string label(std::string prefix); };
std::string Theme::«purple|label»(std::string «white|prefix») { return «white|prefix» + «white|name»; }`],
  ['java', `class «yellow|Theme» {
  void «purple|run»() {
    «yellow|String» «white|message» = «yellow|String».«purple|format»("%s", "x");
    for («yellow|Theme» «white|item» : items) use(«white|item».«white|name»);
  }
}`],
  ['kotlin', `class «yellow|Theme»
fun «yellow|Theme».«purple|label»(«white|prefix»: «yellow|String») = «white|prefix»
fun «purple|main»() { label(«white|prefix» = value) }`],
  ['cuda-cpp', `struct «yellow|Theme» { «yellow|float» «white|accent»; };
__global__ void «purple|render»(«yellow|Theme» *«white|theme») { «white|theme»->«white|accent» = «orange|1.0f»; }`],
  ['groovy', `class «yellow|Theme» {
  «yellow|String» «white|name»
  «yellow|String» «purple|label»(«yellow|String» «white|prefix») { «green|"\${»«white|prefix»«green|}: \${»«white|name»«green|}"» }
}
new «yellow|Theme»().«purple|label»('x')`],
  ['julia', `module «white|ThemeKit»
struct «yellow|Theme»
  «white|name»::«yellow|String»
end
function «purple|label»(«white|theme»::«yellow|Theme»; «white|prefix»="x")
  «green|"$(»«white|prefix»«green|) $(»«white|theme»«white|.»«white|name»«green|)"»
end
end`],
  ['lua', `local «white|Theme» = {}
function «white|Theme».«purple|new»(«white|name»)
  return «purple|setmetatable»({ «white|name» = «white|name» }, «white|Theme»)
end
local «white|theme» = «white|Theme».«purple|new»("x")
print(«white|theme».«white|name»)`],
  ['objective-c', `@interface «yellow|Theme» : NSObject
@property NSString *«white|name»;
- (NSString *)«purple|label»:(NSString *)«white|prefix»;
@end`],
  ['objective-cpp', `@implementation «yellow|Theme»
- (NSString *)«purple|label»:(NSString *)«white|prefix» { return self.«white|name»; }
@end`],
  ['r', `«white|theme» <- list(«white|name» = "x")
«white|label» <- function(«white|value») paste(«white|value»$«white|name»)
«purple|label»(«white|theme»)`],
  ['ini', `[«blue|theme»]
«purple|name»«operator|=»«green|CodePen»
«purple|enabled»«operator|=»«orange|true»
«purple|count»«operator|=»«orange|2»
«purple|source»«operator|=»«white|\${HOME}»«green|/theme»`],
  ['properties', `«purple|theme.name»«operator|=»«green|CodePen»
«purple|theme.count»«operator|=»«orange|2»
«purple|theme.source»«operator|=»«white|\${base}»«green|/theme»`],
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
  ['fsharp', `type «yellow|Theme» = { «white|Name»: «yellow|string» }
type «yellow|Mode» = | «white|Original» | «white|Ligatures»
let «purple|label» «white|prefix» «white|theme» = «green|$"{»«white|prefix»«green|}: {»«white|theme»«white|.»«white|Name»«green|}"»`],
  ['hlsl', `cbuffer «yellow|ThemeSettings» : register(b0) { float4 «white|Accent»; };
struct «yellow|Input» { float3 «white|position» : «blue|POSITION»; };
float4 «purple|render»(«yellow|Input» «white|input») : «blue|SV_Target» { return «white|input».«white|position».x + «orange|1.0»; }`],
  ['shaderlab', `«blue/normal|Shader» "Theme" { «blue/normal|Properties» { «white|_Accent» ("Accent", Color) = (1,1,1,1) }
SubShader { Pass { CGPROGRAM
float4 «purple|render»(float4 «white|position» : «blue|POSITION») : «blue|SV_Target» { «blue/normal|return» «white|position»; }
ENDCG } } }`],
  ['powershell', `class «yellow|Theme» {
  [string] «white|$Name»
  [string] «purple|Label»([string] «white|$prefix») { return «green|"\${»«white|prefix»«green|}: $(»«yellow|$this»«white|.»«white|Name»«green|)"» }
}
function «purple|Show-Theme»([Theme] «white|$theme») { «white|$theme».«purple|Label»('x') }`],
  ['perl', `package «yellow|Theme»;
sub «purple|label» { my «white|$self» = shift; return «green|"»«white|$self»«green|->{»«white|name»«green|}"»; }
package «yellow|main»;
my «white|$theme» = «yellow|Theme»->«purple|new»(«white|name» => 'x');`],
  ['raku', `enum «yellow|Mode» <«white|original» «white|ligatures»>;
class «yellow|Theme» { has Str «white|$.name»; method «purple|label»(Str «white|$prefix») { «green|"»«white|$prefix»«green|: »«white|$!name»«green|"» } }
my «white|$theme» = Theme.«purple|new»(«white|name» => 'x');`],
  ['vb', `Public Class «yellow|Theme»
  Public Property «white|Name» As «yellow|String»
  Public Function «purple|Label»(«white|prefix» As «yellow|String») As «yellow|String»
    Return «green|$"{»«white|prefix»«green|}: {»«white|Name»«green|}"»
  End Function
End Class`],
  ['handlebars', `<article>{{«white|theme».«white|name»}}</article>
{{#each theme.tokens as |«white|token» «white|index»|}}{{«white|token».«white|name»}}{{/each}}
{{helper «white|name»=«white|theme».«white|name»}}`],
  ['jade', `- const «white|theme» = { «white|name»: 'x' }
mixin «purple|token»(«white|name»)
  code= «white|name»
main.card(data-name=«yellow|theme».«white|name»)
  +«yellow|token»(«yellow|theme».«white|name»)`],
  ['bat', `«yellow/normal|@»echo off
:«purple|render»
call :«purple|label»
:«purple|label»`],
  ['coffeescript', `class «yellow|Theme»
  constructor: («white|@name») ->
  «purple|label»: («white|prefix») -> «green|"#{»«white|prefix»«green|}: #{»«white|@name»«green|}"»
«white|theme» = new Theme 'x'
theme.«purple|label»()`],
  ['coffeescript', `«white|items» = []
«white|empty» = «orange|null»
«white|size» = «white|items».«white|length»
«white|largest» = Math.«white|max» «white|size», «orange|0»`],
  ['jsonc', `{
  "empty": «orange|null»,
  "text": "null"
  // null
}`],
  ['clojure', `(defrecord «yellow|Theme» [«white|name»])
(defprotocol «yellow|Renderable» («purple|render» [value prefix]))
(defn «purple|label» [«white|theme»] (str «white|theme»))
(«purple|label» default-theme)`],
  ['razor', `<«brown|PageTitle»>«white|@State».«white|Title»</«brown|PageTitle»>
«blue/italic|@code» { private «yellow|ThemeState» «white|State» { get; } = new «yellow|ThemeState»(); }`],
  ['typescript', `«blue/italic|export» «blue/italic|abstract» «blue/italic|class» «yellow|Theme» extends «yellow|Base» {
  «blue/italic|static» «blue/italic|async» «purple|run»() {
    «blue/italic|for» («blue/italic|const» «white|item» of []) {
      «blue/italic|try» { «blue/italic|switch» («white|item») { «blue/italic|case» 0: «blue/italic|return» «blue/italic|await» «yellow/italic|this».«purple|work»(); } }
      «blue/italic|catch» («white|error») { «blue/italic|return» «yellow/italic|super».«purple|work»(); }
    }
  }
}
«blue/italic|export» «blue/italic|async» «yellow/italic|function»* «purple|render»() { «blue/italic|yield» 1; }`],
  ['typescript', `«blue/italic|@sealed»
«blue/italic|type» «yellow|ThemeName» = string;
«blue/italic|class» «yellow|Theme» {}`],
  ['typescriptreact', `import «blue/italic|type» { «yellow|CSSProperties» } from 'react';
const «white|style»: «yellow|CSSProperties» = {};`],
  ['python', `«blue/italic|@dataclass»
class «yellow|Theme»:
    pass`],
  ['julia', `«blue/italic|@info» "theme"`],
  ['c', `«blue/italic|#include» <stdio.h>`],
  ['cpp', `«blue/italic|#include» <vector>`],
  ['cuda-cpp', `«blue/italic|#include» <cuda_runtime.h>`],
  ['sass', `«blue/italic|@function» token-color($name)
  «blue/italic|@return» $name
«blue/italic|@for» $index from 1 through 3`],
  ['scss', `«blue/italic|@function» token-color($name) {
  «blue/italic|@return» $name;
}
«blue/italic|@each» $name in $tokens {}`],
  ['objective-c', `«blue/italic|#import» <Foundation/Foundation.h>
«blue/italic|@interface» «yellow|Theme» : NSObject
«blue/italic|@implementation» «yellow|Theme»
«blue/italic|@end»
int main(void) { «blue/italic|@autoreleasepool» {} }`],
  ['objective-cpp', `«blue/italic|#import» <Foundation/Foundation.h>
«blue/italic|#include» <vector>
«blue/italic|@interface» «yellow|Theme» : NSObject
«blue/italic|@implementation» «yellow|Theme»
«blue/italic|@end»`],
  ['rust', `«blue/italic|#»«white/normal|[»«blue/italic|derive»«white/normal|(»«yellow|Debug»«white/normal|)»«white/normal|]»
struct «yellow|Theme»;`],
];
