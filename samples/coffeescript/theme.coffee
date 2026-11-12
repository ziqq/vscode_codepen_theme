# Classes, interpolation, comprehensions, defaults, and existential access.
class Theme
  constructor: (@name, @accent = '#96b38a') ->
    @tokens = ['keyword', 'string', 'comment']

  label: (prefix = 'theme') ->
    "#{prefix}: #{@name} (#{@accent})"

  visibleTokens: ->
    token.toUpperCase() for token in @tokens when token?

loadTheme = (source = {}) ->
  name = source.name ? 'CodePen Theme Original'
  accent = source.accent ? '#96b38a'
  new Theme name, accent

theme = loadTheme name: 'Twilight'
console.log theme.label(), theme.visibleTokens()
