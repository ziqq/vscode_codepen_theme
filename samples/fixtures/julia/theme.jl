module CodePenTheme

export Theme, label, visible_tokens

# Structs, typed fields, keyword arguments, comprehensions, and macros.
struct Theme{T<:AbstractString}
    name::T
    accent::T
    tokens::Vector{Symbol}
end

function label(theme::Theme; prefix::AbstractString = "theme")
    "$(prefix): $(theme.name) ($(theme.accent))"
end

visible_tokens(theme::Theme) = [
    uppercase(String(token))
    for token in theme.tokens
    if token !== :comment
]

function contrast_score(background::AbstractString, accent::AbstractString)::Int
    return abs(length(background) - length(accent)) + 7
end

const ORIGINAL = Theme(
    "CodePen Theme Original",
    "#96b38a",
    [:keyword, :string, :comment],
)

@info label(ORIGINAL) tokens = visible_tokens(ORIGINAL)
println(contrast_score("#1d1e22", ORIGINAL.accent))

end
