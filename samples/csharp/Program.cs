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
