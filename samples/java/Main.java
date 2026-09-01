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
