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
