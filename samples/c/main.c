#include <stdio.h>
#include <string.h>

// C fixture for provider-owned TextMate scopes.
typedef struct {
  const char *name;
  const char *accent;
  const char *background;
} Theme;

static void print_theme(const Theme *theme) {
  printf("%s: %s on %s\n", theme->name, theme->accent, theme->background);
}

int main(void) {
  const Theme theme = {
      .name = "CodePen Theme Original",
      .accent = "#96b38a",
      .background = "#1d1e22",
  };
  const char *tokens[] = {"keyword", "string", "comment"};

  for (size_t index = 0; index < sizeof(tokens) / sizeof(tokens[0]); index++) {
    if (strlen(tokens[index]) > 0) {
      printf("token: %s\n", tokens[index]);
    }
  }

  print_theme(&theme);
  return 0;
}

typedef enum {
  TOKEN_KEYWORD = 1 << 0,
  TOKEN_STRING = 1 << 1,
  TOKEN_COMMENT = 1 << 2,
} TokenMask;

static const char *token_name(TokenMask token) {
  switch (token) {
    case TOKEN_KEYWORD:
      return "keyword";
    case TOKEN_STRING:
      return "string";
    case TOKEN_COMMENT:
      return "comment";
    default:
      return "unknown";
  }
}
