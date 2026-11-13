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

enum TokenRole: string
{
    case Keyword = 'keyword';
    case String = 'string';
    case Comment = 'comment';
}

function colorFor(TokenRole $role, Theme $theme): string
{
    return match ($role) {
        TokenRole::Keyword => '#ddca7e',
        TokenRole::String => $theme->accent,
        TokenRole::Comment => '#717790',
    };
}

$labels = array_map(
    static fn (TokenRole $role): string => "{$role->value}: " . colorFor($role, $theme),
    TokenRole::cases(),
);
echo implode(PHP_EOL, $labels) . PHP_EOL;

// ---------------------------------------------------------------------------
// Extended showcase: interfaces, traits, attributes, closures, match, enums.
// ---------------------------------------------------------------------------

use ArrayAccess;
use Countable;
use InvalidArgumentException;

const MAX_TOKENS = 0x40;
define('THEME_VERSION', '1.0.0');

interface Repository
{
    public function find(string $key): ?string;
}

trait Loggable
{
    protected array $log = [];

    public function log(string $message, mixed ...$context): static
    {
        $this->log[] = sprintf('[%s] %s', static::class, vsprintf($message, $context));
        return $this;
    }
}

#[\Attribute(\Attribute::TARGET_CLASS)]
final class Role
{
    public function __construct(public string $name = 'palette') {}
}

enum Severity: int
{
    case Info = 0;
    case Warning = 1;
    case Error = 2;

    public function label(): string
    {
        return ucfirst(strtolower($this->name));
    }
}

#[Role(name: 'palette')]
abstract class AbstractPalette implements Repository, ArrayAccess, Countable
{
    use Loggable;

    protected static int $instances = 0;
    private array $colors = [];

    public function __construct(array $colors = [], protected readonly ?Severity $severity = Severity::Info)
    {
        foreach ($colors as $name => $color) {
            $this[$name] = $color;
        }
        self::$instances++;
    }

    public function offsetExists(mixed $offset): bool { return isset($this->colors[$offset]); }
    public function offsetGet(mixed $offset): mixed { return $this->colors[$offset] ?? null; }
    public function offsetUnset(mixed $offset): void { unset($this->colors[$offset]); }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        if (!preg_match('/^#[0-9a-f]{6}$/i', (string) $value)) {
            throw new InvalidArgumentException("Invalid color: {$value}");
        }
        $this->colors[$offset] = strtolower($value);
    }

    public function count(): int
    {
        return \count($this->colors);
    }

    abstract public function render(): string;
}

final class HtmlPalette extends AbstractPalette
{
    public function find(string $key): ?string
    {
        return $this[$key];
    }

    public function render(): string
    {
        $items = array_map(
            fn (string $name, string $color): string => <<<HTML
                <li style="color: {$color}">{$name}</li>
                HTML,
            array_keys((array) $this->log),
            array_values((array) $this->log),
        );
        return '<ul>' . implode('', $items) . '</ul>';
    }
}

$palette = new HtmlPalette(['keyword' => '#ddca7e', 'string' => '#96b38a']);
$counter = static function (int $step = 1) use (&$palette): int {
    return \count($palette) * $step;
};
$level = match (true) {
    $counter() > MAX_TOKENS => Severity::Error,
    $counter() > 1 => Severity::Warning,
    default => Severity::Info,
};
try {
    $palette['accent'] = 'not-a-color';
} catch (InvalidArgumentException $e) {
    echo $e->getMessage(), PHP_EOL;
} finally {
    printf("%s %d %.2f %s\n", $level->label(), 1_000, 1.5e-3, THEME_VERSION);
}
$palette?->log('rendered %d colors', \count($palette));
