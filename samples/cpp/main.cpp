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
