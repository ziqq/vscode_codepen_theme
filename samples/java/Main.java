import java.util.List;

public final class Main {
  private static final String THEME_NAME = "CodePen Theme Original";
  private static final String ACCENT = "#96b38a";

  private Main() {}

  record Token(String name, String color) {
    String label() {
      return name + ": " + color;
    }
  }

  private static List<Token> defaultTokens() {
    return List.of(
        new Token("keyword", "#ddca7e"),
        new Token("string", ACCENT),
        new Token("comment", "#717790"));
  }

  public static void main(String[] args) {
    for (Token token : defaultTokens()) {
      System.out.println(token.label());
    }

    String message = String.format("%s uses %s", THEME_NAME, ACCENT);
    System.out.println(message);
  }
}

sealed interface TokenRole permits KeywordRole, LiteralRole {
  String color();
}

record KeywordRole(String color) implements TokenRole {}

record LiteralRole(String name, String color) implements TokenRole {}

final class TokenFormatter {
  private TokenFormatter() {}

  static String describe(TokenRole role) {
    return switch (role) {
      case KeywordRole keyword -> "keyword=" + keyword.color();
      case LiteralRole(String name, String color) -> name + "=" + color;
    };
  }
}

// ---------------------------------------------------------------------------
// Extended showcase: generics, annotations, lambdas, streams, exceptions.
// ---------------------------------------------------------------------------

@FunctionalInterface
interface Resolver<T, R> {
  R resolve(T input) throws ThemeException;

  default <V> Resolver<T, V> andThen(java.util.function.Function<? super R, ? extends V> next) {
    return input -> next.apply(resolve(input));
  }
}

enum Severity {
  INFO(0), WARNING(1), ERROR(2);

  private final int level;

  Severity(int level) {
    this.level = level;
  }

  boolean atLeast(Severity other) {
    return level >= other.level;
  }
}

class ThemeException extends Exception {
  private static final long serialVersionUID = 1L;

  ThemeException(String message, Throwable cause) {
    super(message, cause);
  }
}

@Deprecated(since = "1.0", forRemoval = false)
abstract sealed class Repository<T extends Comparable<T>> permits MemoryRepository {
  protected static final int MAX_TOKENS = 0x40;
  protected final java.util.Map<String, T> items = new java.util.concurrent.ConcurrentHashMap<>();

  abstract java.util.Optional<T> find(String key);

  public synchronized int size() {
    return items.size();
  }
}

final class MemoryRepository extends Repository<String> {
  private volatile boolean dirty = false;
  private transient int hits;

  @Override
  java.util.Optional<String> find(String key) {
    hits++;
    return java.util.Optional.ofNullable(items.get(key));
  }

  @SafeVarargs
  final <E extends CharSequence> long countLonger(int min, E... values) {
    return java.util.Arrays.stream(values)
        .filter(value -> value.length() > min)
        .map(String::valueOf)
        .distinct()
        .count();
  }

  String load(java.nio.file.Path path) throws ThemeException {
    try (var reader = java.nio.file.Files.newBufferedReader(path)) {
      var text = reader.lines().collect(java.util.stream.Collectors.joining("\n"));
      var block = """
          Theme: %s
          Accent: %s
          """.formatted(text, "#96b38a");
      dirty = !block.isBlank();
      return block;
    } catch (java.io.IOException | IllegalStateException error) {
      throw new ThemeException("Cannot load " + path, error);
    } finally {
      hits = Math.max(hits, 0) + (int) 1e2 + 0b1010 + 'x';
    }
  }

  Object classify(Object value) {
    if (value instanceof Integer number && number > 0) {
      return "positive " + number;
    }
    return switch (value) {
      case null -> "null";
      case String s when s.startsWith("#") -> "color " + s;
      case Severity severity -> severity.name().toLowerCase();
      default -> value.getClass().getSimpleName();
    };
  }
}
