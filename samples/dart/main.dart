import 'dart:math' as math;

enum ThemeMode { dark, highContrast }

sealed class ThemeState {
  const ThemeState();
}

final class ThemeReady extends ThemeState {
  const ThemeReady({required this.name, required this.palette});

  final String name;
  final ThemePalette palette;

  String get label => '$name (${palette.accent})';
}

final class ThemePalette {
  const ThemePalette({required this.background, required this.accent});

  final String background;
  final String accent;

  int contrastScore() => math.max(background.length, accent.length);
}

String describeTheme(ThemeState state, ThemeMode mode) {
  return switch (state) {
    ThemeReady(:final name, :final palette) =>
      '$name uses ${palette.background} in ${mode.name} mode',
  };
}

void main() {
  const palette = ThemePalette(background: '#1d1e22', accent: '#96b38a');
  const state = ThemeReady(name: 'CodePen Theme Original', palette: palette);

  final message = describeTheme(state, ThemeMode.dark);
  print('$message; contrast score: ${palette.contrastScore()}');
}
