import groovy.transform.Immutable

// Annotations, properties, closures, interpolation, ranges, and safe access.
@Immutable
class Theme {
    String name
    String accent
    List<String> tokens

    String label(String prefix = 'theme') {
        "${prefix}: ${name} (${accent})"
    }
}

def original = new Theme(
    'CodePen Theme Original',
    '#96b38a',
    ['keyword', 'string', 'comment'],
)

def visible = original.tokens
    .findAll { it?.size() > 3 }
    .collect { token -> token.toUpperCase() }

(1..visible.size()).each { index ->
    println "${index}: ${original.label()} -> ${visible[index - 1]}"
}
