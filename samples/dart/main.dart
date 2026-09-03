import 'dart:math' as math;

enum ThemeMode { dark, highContrast }

/// {@template price_type}
/// [PriceType] enumeration
/// {@endtemplate}
enum PriceType implements Comparable<PriceType> {
  /// Fixed price type
  /// [alias] - `fixed`
  /// [value] - `0`
  fixed(alias: 'fixed', value: 0),

  /// Free price type
  /// [alias] - `free`
  /// [value] - `1`
  free(alias: 'free', value: 1),

  /// Price from a specific amount
  /// [alias] - `from`
  /// [value] - `2`
  from(alias: 'from', value: 2);

  /// {@macro price_type}
  const PriceType({required this.alias, required this.value});

  /// Creates a new instance of [PriceType] from a given alias.
  static PriceType fromAlias(
    String? alias, {
    PriceType? fallback,
  }) => switch (alias?.trim().toLowerCase()) {
    'fixed' => fixed,
    'free' => free,
    'from' => from,
    _ =>
      fallback ??
          (throw ArgumentError.value(
            alias,
            'PriceType.fromAlias',
            'Supported aliases are: ${PriceType.values.map((e) => e.alias).join(', ')}',
          )),
  };

  /// Creates a new instance of [PriceType] from a given value.
  static PriceType fromValue(
    int? value, {
    PriceType? fallback,
  }) => switch (value) {
    0 => fixed,
    1 => free,
    2 => from,
    _ =>
      fallback ??
          (throw ArgumentError.value(
            value,
            'PriceType.fromValue',
            'Supported values are: ${PriceType.values.map((e) => e.value).join(', ')}',
          )),
  };

  /// Creates a new instance of [PriceType] from a given value.
  static PriceType? fromValueOrNull(int? value) => switch (value) {
    0 => fixed,
    1 => free,
    2 => from,
    _ => null,
  };

  /// Alias for the enum
  final String alias;

  /// Value of the enum
  final int value;

  /// Price type is fixed
  bool get isFixed => this == PriceType.fixed || value == 0;

  /// Price type is free
  bool get isFree => this == PriceType.free || value == 1;

  /// Price type is from
  bool get isFrom => this == PriceType.from || value == 2;

  /// Pattern matching
  T map<T>({
    required T Function() fixed,
    required T Function() free,
    required T Function() from,
  }) => switch (this) {
    PriceType.fixed => fixed(),
    PriceType.free => free(),
    PriceType.from => from(),
  };

  /// Pattern matching with a fallback
  T maybeMap<T>({
    required T Function() orElse,
    T Function()? fixed,
    T Function()? free,
    T Function()? from,
  }) => map<T>(
    fixed: fixed ?? orElse,
    free: free ?? orElse,
    from: from ?? orElse,
  );

  /// Pattern matching returning null if no match
  T? maybeMapOrNull<T>({
    T Function()? fixed,
    T Function()? free,
    T Function()? from,
  }) => maybeMap<T?>(orElse: () => null, fixed: fixed, free: free, from: from);

  @override
  int compareTo(PriceType other) => value.compareTo(other.value);

  @override
  String toString() => alias;
}

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

Future<int> resolveLimit(Future<int> value) async {
  final limit = await value;
  return limit;
}
