namespace CodePen.Theme

open System

// Records, discriminated unions, options, pipelines, and pattern matching.
type Token =
    | Keyword of string
    | Literal of name: string * color: string
    | Comment

type Theme = {
    Name: string
    Accent: string
    Tokens: Token list
}

module Theme =
    let label prefix theme = $"{prefix}: {theme.Name} ({theme.Accent})"

    let visibleNames theme =
        theme.Tokens
        |> List.choose (function
            | Keyword name -> Some name
            | Literal (name, _) -> Some name
            | Comment -> None)

let original = {
    Name = "CodePen Theme Original"
    Accent = "#96b38a"
    Tokens = [Keyword "const"; Literal ("string", "#96b38a"); Comment]
}

printfn "%s: %A" (Theme.label "theme" original) (Theme.visibleNames original)
