import Foundation

enum ThemeMode: String {
    case dark
    case highContrast = "high-contrast"
}

struct Theme {
    let name: String
    let accent: String
    let background: String

    func label(for mode: ThemeMode) -> String {
        "\(name): \(accent) [\(mode.rawValue)]"
    }
}

func tokens(for theme: Theme) -> [String: String] {
    [
        "keyword": "#ddca7e",
        "string": theme.accent,
        "comment": "#717790",
    ]
}

let theme = Theme(name: "CodePen Theme Original", accent: "#96b38a", background: "#1d1e22")
for (name, color) in tokens(for: theme).sorted(by: { $0.key < $1.key }) {
    print("\(name): \(color)")
}
print(theme.label(for: .dark))

protocol TokenRepresentable {
    associatedtype Value
    var name: String { get }
    var value: Value { get }
}

struct Token<Value>: TokenRepresentable {
    let name: String
    let value: Value
}

extension Sequence where Element == Token<String> {
    func cssVariables() -> String {
        map { "--\($0.name): \($0.value);" }.joined(separator: "\n")
    }
}

actor ThemeStore {
    private var selected = theme

    func update(_ value: Theme) { selected = value }
    func current() -> Theme { selected }
}

let tokenValues = tokens(for: theme).map(Token.init(name:value:))
print(tokenValues.cssVariables())
