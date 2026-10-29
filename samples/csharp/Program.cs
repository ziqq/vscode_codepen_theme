using System;
using System.Collections.Generic;
using System.Linq;

// C# fixture for provider-owned TextMate scopes.
internal sealed record Theme(string Name, string Accent, string Background)
{
    public string Label => $"{Name}: {Accent}";
}

internal static class Program
{
    private static IEnumerable<string> VisibleTokens(Theme theme) =>
        new[] { "keyword", "string", "comment" }
            .Where(token => theme.Accent.StartsWith("#", StringComparison.Ordinal));

    private static void Main()
    {
        var theme = new Theme("CodePen Theme Original", "#96b38a", "#1d1e22");
        foreach (var token in VisibleTokens(theme))
        {
            Console.WriteLine($"{token}: {theme.Accent}");
        }

        Console.WriteLine(theme.Label);
    }
}

internal enum TokenRole
{
    Keyword,
    String,
    Comment,
}

internal static class TokenRoleExtensions
{
    public static string Color(this TokenRole role) => role switch
    {
        TokenRole.Keyword => "#ddca7e",
        TokenRole.String => "#96b38a",
        TokenRole.Comment => "#717790",
        _ => throw new ArgumentOutOfRangeException(nameof(role)),
    };
}

// ---------------------------------------------------------------------------
// Extended showcase: generics, LINQ, async, attributes, pattern matching.
// ---------------------------------------------------------------------------

namespace CodePen.Theme.Showcase
{
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    internal sealed class TokenRoleAttribute(string name) : Attribute
    {
        public string Name { get; } = name;
    }

    public interface IRepository<in TKey, TValue> where TValue : class
    {
        ValueTask<TValue?> FindAsync(TKey key, CancellationToken cancellationToken = default);
    }

    [TokenRole("palette")]
    public sealed partial class Palette : IRepository<string, string>, IDisposable
    {
        public const int MaxTokens = 0x40;
        private static readonly Regex HexColor = new(@"^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);
        private readonly Dictionary<string, string> _colors = new(StringComparer.OrdinalIgnoreCase);
        private int _hits;
        private bool _disposed;

        public event EventHandler<string>? ColorAdded;

        public int Count => _colors.Count;

        public string this[string name]
        {
            get => _colors.TryGetValue(name, out var color) ? color : "#ffffff";
            set
            {
                ArgumentException.ThrowIfNullOrEmpty(value);
                if (!HexColor.IsMatch(value)) throw new FormatException($"Invalid color '{value}'");
                _colors[name] = value;
                ColorAdded?.Invoke(this, name);
            }
        }

        public async ValueTask<string?> FindAsync(string key, CancellationToken cancellationToken = default)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(10), cancellationToken).ConfigureAwait(false);
            Interlocked.Increment(ref _hits);
            return _colors.GetValueOrDefault(key);
        }

        public IEnumerable<(string Name, int Rgb)> Bright(int threshold = 0x80) =>
            from pair in _colors
            let rgb = Convert.ToInt32(pair.Value[1..], 16)
            where (rgb >> 16) > threshold
            orderby pair.Key descending
            select (pair.Key, rgb);

        public static string Describe(object? value) => value switch
        {
            null => "null",
            int n and > 0 => $"positive {n}",
            string { Length: 7 } s when s.StartsWith('#') => $"color {s}",
            (string name, int weight) => $"{name} x{weight}",
            IEnumerable<string> list => string.Join(", ", list),
            _ => value.GetType().Name,
        };

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            GC.SuppressFinalize(this);
        }
    }

    internal static class Program2
    {
        private static async Task<int> RunAsync()
        {
            using var palette = new Palette { ["keyword"] = "#ddca7e", ["string"] = "#96b38a" };
            palette.ColorAdded += (_, name) => Console.WriteLine($"added {name}");
            var raw = """
                {"accent": "#96b38a"}
                """;
            try
            {
                var found = await palette.FindAsync("keyword") ?? throw new KeyNotFoundException();
                Console.WriteLine($"{found} {raw.Length:N0} {1_000.5e-2m} {Palette.Describe(("a", 2))}");
            }
            catch (Exception ex) when (ex is KeyNotFoundException or FormatException)
            {
                return -1;
            }
            return palette.Bright().Count();
        }
    }
}
