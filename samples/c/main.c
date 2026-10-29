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

/* -------------------------------------------------------------------------
 * Extended showcase: macros, structs, unions, function pointers, bit ops.
 * ------------------------------------------------------------------------- */

#define MAX_TOKENS 64
#define ARRAY_LEN(array) (sizeof(array) / sizeof((array)[0]))
#define CLAMP(value, lo, hi) ((value) < (lo) ? (lo) : (value) > (hi) ? (hi) : (value))

#ifdef DEBUG
#  define LOG(fmt, ...) fprintf(stderr, "[theme] " fmt "\n", __VA_ARGS__)
#else
#  define LOG(fmt, ...) ((void)0)
#endif

typedef unsigned int rgb_t;
typedef int (*token_visitor)(const char *name, rgb_t color, void *context);

static const rgb_t PALETTE[] = {0xddca7e, 0x96b38a, 0x717790, 0x809bbd};
extern volatile int g_token_count;
static int g_hits = 0;

typedef struct rgb_parts {
  unsigned char red;
  unsigned char green;
  unsigned char blue;
} rgb_parts;

typedef union color_value {
  rgb_t packed;
  rgb_parts parts;
} color_value;

enum flags { FLAG_NONE = 0, FLAG_BOLD = 1 << 0, FLAG_ITALIC = 1 << 1 };

static inline rgb_parts unpack(rgb_t color) {
  rgb_parts parts = {
      .red = (color >> 16) & 0xff,
      .green = (color >> 8) & 0xff,
      .blue = color & 0xff,
  };
  return parts;
}

int visit_palette(token_visitor visitor, void *context) {
  int visited = 0;
  for (size_t i = 0; i < ARRAY_LEN(PALETTE); ++i) {
    char name[16];
    snprintf(name, sizeof name, "token-%zu", i);
    if (visitor(name, PALETTE[i], context) != 0) {
      LOG("visitor stopped at %s", name);
      break;
    }
    visited++;
  }
  return visited;
}

static int print_token(const char *name, rgb_t color, void *context) {
  int *flags = (int *)context;
  rgb_parts parts = unpack(color);
  printf("%-10s #%06x r=%3u g=%3u b=%3u%s\n", name, color, parts.red, parts.green,
         parts.blue, (*flags & FLAG_BOLD) ? " (bold)" : "");
  g_hits += CLAMP(parts.red, 0, 255) > 128 ? 1 : 0;
  return 0;
}

int run_showcase(void) {
  int flags = FLAG_BOLD | FLAG_ITALIC;
  float opacity = 0.85f;
  double ratio = 1.5e-3;
  char *buffer = malloc(MAX_TOKENS * sizeof *buffer);
  if (buffer == NULL) {
    return -1;
  }
  int visited = visit_palette(print_token, &flags);
  free(buffer);
  goto done;
done:
  return visited + (int)(opacity * 100) + (int)ratio + 'a';
}
