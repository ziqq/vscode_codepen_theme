<?php

declare(strict_types=1);

final class Theme
{
    public function __construct(
        public readonly string $name,
        public readonly string $accent,
        public readonly string $background,
    ) {}

    public function label(): string
    {
        return "{$this->name}: {$this->accent}";
    }
}

function tokens(Theme $theme): array
{
    return [
        'keyword' => '#ddca7e',
        'string' => $theme->accent,
        'comment' => '#717790',
    ];
}

$theme = new Theme('CodePen Theme Original', '#96b38a', '#1d1e22');
foreach (tokens($theme) as $name => $color) {
    echo "$name: $color\n";
}
echo $theme->label() . PHP_EOL;
