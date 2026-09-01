use strict;
use warnings;
use feature 'say';

# Packages, hashes, references, regexes, interpolation, and substitutions.
package Theme;

sub new {
    my ($class, %args) = @_;
    return bless {
        name   => $args{name}   // 'CodePen Theme Original',
        accent => $args{accent} // '#96b38a',
        tokens => $args{tokens} // [],
    }, $class;
}

sub label {
    my ($self, $prefix) = @_;
    $prefix //= 'theme';
    return "$prefix: $self->{name} ($self->{accent})";
}

package main;

my $theme = Theme->new(tokens => [qw(keyword string comment)]);
my @visible = grep { $_ !~ /^comment$/ } @{$theme->{tokens}};
for my $index (0 .. $#visible) {
    my $token = uc $visible[$index];
    $token =~ s/STRING/LITERAL/;
    say sprintf '%d %s -> %s', $index + 1, $theme->label, $token;
}
