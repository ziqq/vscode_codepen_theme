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

// ---------------------------------------------------------------------------
// Extended showcase: protocols, generics, property wrappers, async, errors.
// ---------------------------------------------------------------------------

let maxTokens = 0x40
private let hexPattern = #/^#[0-9a-fA-F]{6}$/#
nonisolated(unsafe) var globalCounter = 0

enum ColorError: Error, CustomStringConvertible {
    case empty
    case invalidLength(Int)
    case invalidDigit(index: Int, found: Character)

    var description: String {
        switch self {
        case .empty: "empty color"
        case let .invalidLength(length): "expected 7 characters, got \(length)"
        case .invalidDigit(let index, let found): "bad digit \(found) at \(index)"
        }
    }
}

@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

protocol Palette {
    associatedtype Color: Hashable
    var colors: [String: Color] { get }
    func color(named name: String) throws -> Color
}

extension Palette {
    func color(named name: String) throws -> Color {
        guard let color = colors[name] else { throw ColorError.empty }
        return color
    }
}

final class Rgb: Palette, @unchecked Sendable {
    static let shared = Rgb()

    @Clamped(0...1) var opacity: Double = 0.85
    private(set) lazy var colors: [String: UInt32] = ["keyword": 0xDDCA7E, "string": 0x96B38A]
    weak var delegate: AnyObject?

    subscript(name: String) -> UInt32? { colors[name] }

    func parse(_ value: String) throws(ColorError) -> UInt32 {
        guard value.wholeMatch(of: hexPattern) != nil else {
            throw value.isEmpty ? .empty : .invalidLength(value.count)
        }
        return UInt32(value.dropFirst(), radix: 16) ?? 0
    }

    deinit {
        globalCounter -= 1
    }
}

func load<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
    let (data, response) = try await URLSession.shared.data(from: url)
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        throw URLError(.badServerResponse)
    }
    return try JSONDecoder().decode(T.self, from: data)
}

@MainActor
func showcase() async {
    let palette = Rgb.shared
    defer { print("done") }
    do {
        let accent = try palette.parse("#96b38a")
        let names = palette.colors.keys.sorted { $0 < $1 }.filter { !$0.isEmpty }
        if case let .some(keyword) = palette["keyword"], keyword > accent {
            print("keyword \(keyword, format: .hex) beats accent", names)
        }
        async let store = ThemeStore().current()
        print(await store.name, 1_000.5e-2, true, nil as Int?)
    } catch let error as ColorError {
        print("color error: \(error)")
    } catch {
        fatalError("unexpected: \(error.localizedDescription)")
    }
}
