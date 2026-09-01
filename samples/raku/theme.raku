use v6.d;

# Classes, attributes, signatures, named arguments, junctions, and matching.
enum ThemeMode <original ligatures>;

class Theme {
    has Str $.name is required;
    has Str $.accent = '#96b38a';
    has Array[Str] $.tokens = [];

    method label(Str :$prefix = 'theme' --> Str) {
        "$prefix: $!name ($!accent)"
    }

    method visible-tokens(Bool :$include-comments = False --> Seq) {
        $!tokens.grep({ $include-comments || $_ ne 'comment' }).map(*.uc)
    }
}

sub contrast-score(Str $background, Str $accent --> Int) {
    abs($background.chars - $accent.chars) + 7
}

my $theme = Theme.new(
    name => 'CodePen Theme Original',
    tokens => <keyword string comment>,
);

given ThemeMode::original {
    when original | ligatures {
        say $theme.label, ': ', $theme.visible-tokens.join(', ');
    }
    default { die 'unsupported theme mode' }
}

say contrast-score('#1d1e22', $theme.accent);
