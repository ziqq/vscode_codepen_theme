#include <iostream>
#include <string>
#include <vector>

// C++ fixture for provider-owned TextMate scopes.
struct Theme {
  std::string name;
  std::string accent;
  std::string background;

  [[nodiscard]] std::string label() const {
    return name + ": " + accent;
  }
};

int main() {
  const Theme theme{"CodePen Theme Original", "#96b38a", "#1d1e22"};
  const std::vector<std::string> tokens{"keyword", "string", "comment"};

  for (const auto &token : tokens) {
    std::cout << token << " renders on " << theme.background << '\n';
  }

  std::cout << theme.label() << '\n';
  return 0;
}

enum class TokenRole { keyword, string, comment };

template <typename Range, typename Predicate>
std::vector<std::string> select_tokens(const Range &values, Predicate predicate) {
  std::vector<std::string> result;
  for (const auto &value : values) {
    if (predicate(value)) result.push_back(value);
  }
  return result;
}

constexpr auto default_role = TokenRole::keyword;

// ---------------------------------------------------------------------------
// Extended showcase: templates, concepts, lambdas, smart pointers, ranges.
// ---------------------------------------------------------------------------

#include <algorithm>
#include <concepts>
#include <memory>
#include <optional>
#include <ranges>
#include <stdexcept>
#include <unordered_map>

namespace codepen::theme {

inline constexpr std::size_t kMaxTokens = 0x40;
static thread_local int g_hits = 0;

template <typename T>
concept Colorlike = requires(T value) {
  { value.hex() } -> std::convertible_to<std::string>;
};

class Color final {
 public:
  constexpr explicit Color(std::uint32_t value) noexcept : value_{value} {}

  [[nodiscard]] std::string hex() const {
    char buffer[8];
    std::snprintf(buffer, sizeof(buffer), "#%06x", value_);
    return buffer;
  }

  constexpr auto operator<=>(const Color&) const = default;

 private:
  std::uint32_t value_;
};

template <Colorlike C, typename Alloc = std::allocator<C>>
class Palette {
 public:
  using value_type = C;

  Palette() = default;
  Palette(std::initializer_list<std::pair<const std::string, C>> items) : items_{items} {}
  virtual ~Palette() = default;

  std::optional<C> find(const std::string& name) const {
    if (auto it = items_.find(name); it != items_.end()) {
      ++g_hits;
      return it->second;
    }
    return std::nullopt;
  }

  template <typename Fn>
    requires std::invocable<Fn, const std::string&, const C&>
  void for_each(Fn&& fn) const {
    for (const auto& [name, color] : items_) std::forward<Fn>(fn)(name, color);
  }

 protected:
  std::unordered_map<std::string, C> items_;
};

struct ThemeError : std::runtime_error {
  using std::runtime_error::runtime_error;
};

auto make_palette() -> std::unique_ptr<Palette<Color>> {
  return std::make_unique<Palette<Color>>(Palette<Color>{
      {"keyword", Color{0xddca7e}},
      {"string", Color{0x96b38a}},
      {"comment", Color{0x717790}},
  });
}

}  // namespace codepen::theme

int showcase() {
  using namespace codepen::theme;
  auto palette = make_palette();
  auto shared = std::shared_ptr<Palette<Color>>{std::move(palette)};
  std::vector<std::string> names;
  shared->for_each([&names](const std::string& name, const Color& color) mutable {
    names.emplace_back(name + "=" + color.hex());
  });
  std::ranges::sort(names);
  auto long_names = names | std::views::filter([](const auto& n) { return n.size() > 10; });
  try {
    const auto accent = shared->find("accent").value_or(Color{0xffffff});
    if (accent == Color{0xffffff}) throw ThemeError{"accent is missing"};
  } catch (const ThemeError& error) {
    std::cerr << "error: " << error.what() << '\n';
  }
  static_assert(kMaxTokens == 64, "unexpected limit");
  return static_cast<int>(std::ranges::distance(long_names)) + 1'000 + 0b101;
}
