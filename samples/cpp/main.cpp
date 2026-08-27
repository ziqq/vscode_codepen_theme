#include <iostream>
#include <string>
#include <vector>

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
