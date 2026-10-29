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

// Identity belongs to one show command, including identical consecutive values.
// Delayed completion and timers must never acquire ownership of its successor.
// ignore: unused_element
class _Presentation {
  _Presentation({
    required this.message,
    required this.progress,
    required this.duration,
    required this.blockInteraction,
    required this.dismissOnTap,
    required this.bottomOffset,
  });

  final String? message;
  final double? progress;
  final Duration? duration;
  final bool blockInteraction;
  final bool dismissOnTap;
  final double bottomOffset;
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

// ---------------------------------------------------------------------------
// Extended showcase: constants, generics, mixins, extensions, async, records.
// ---------------------------------------------------------------------------

const int kMaxTokens = 0x40;
const double kOpacity = 0.85;
final RegExp kHexColor = RegExp(r'^#([0-9a-fA-F]{6})$');
late final Map<String, int> _cache = <String, int>{};
var globalCounter = 0;

typedef TokenCallback = void Function(String name, {int? index});
typedef Json = Map<String, Object?>;

/// Something that can be serialized to [Json].
abstract interface class Serializable {
  Json toJson();
}

mixin Loggable on Object {
  String get tag => runtimeType.toString();

  void log(String message) => print('[$tag] $message');
}

base class Repository<T extends Serializable> with Loggable {
  Repository({this.capacity = kMaxTokens});

  final int capacity;
  final List<T> _items = [];

  int get length => _items.length;
  bool get isFull => _items.length >= capacity;

  set first(T value) => _items.insert(0, value);

  T operator [](int index) => _items[index];

  void add(T item) {
    if (isFull) throw StateError('Repository is full: $capacity');
    _items.add(item);
    log('added #${_items.length}');
  }

  Iterable<R> mapWhere<R>(bool Function(T) test, R Function(T) convert) sync* {
    for (final item in _items) {
      if (test(item)) yield convert(item);
    }
  }
}

extension StringColor on String {
  bool get isHexColor => kHexColor.hasMatch(this);

  int toColorValue() => int.parse(substring(1), radix: 16) | 0xFF000000;
}

extension type const TokenId(int value) implements int {
  TokenId.next() : value = ++globalCounter;
}

class Token implements Serializable {
  const Token(this.name, this.color, [this.weight = 1]);

  factory Token.fromJson(Json json) => Token(
    json['name']! as String,
    json['color'] as String? ?? '#ffffff',
  );

  Token.keyword() : this('keyword', '#ddca7e');

  final String name;
  final String color;
  final int weight;

  @override
  Json toJson() => {'name': name, 'color': color, 'weight': weight};

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Token && other.name == name;

  @override
  int get hashCode => Object.hash(name, color);
}

(String, {int count}) summarize(List<Token> tokens) =>
    (tokens.map((t) => t.name).join(', '), count: tokens.length);

Future<List<Token>> loadTokens(Stream<Json> source) async {
  final tokens = <Token>[];
  try {
    await for (final json in source.timeout(const Duration(seconds: 3))) {
      tokens.add(Token.fromJson(json));
    }
  } on FormatException catch (error, stackTrace) {
    print('Invalid token: ${error.message}\n$stackTrace');
    rethrow;
  } catch (_) {
    return const [];
  } finally {
    _cache['loaded'] = tokens.length;
  }
  return tokens;
}

Stream<int> countdown(int from) async* {
  for (var i = from; i >= 0; i--) {
    await Future<void>.delayed(Duration(milliseconds: 100 * i));
    yield i;
  }
}

String classify(Object? value) => switch (value) {
  null => 'null',
  int n when n < 0 => 'negative int',
  int() || double() => 'number',
  String(:final length) when length > 10 => 'long string',
  [final first, ...final rest] => 'list starting with $first (+${rest.length})',
  {'name': final String name} => 'map named $name',
  (final a, final b) => 'record ($a, $b)',
  _ => 'unknown ${value.runtimeType}',
};

@pragma('vm:prefer-inline')
int score(Token token) {
  var result = token.weight * 2 + (token.color.isHexColor ? 1 : 0);
  result <<= 1;
  result ??= 0;
  assert(result >= 0, 'score must be positive');
  return result.clamp(0, kMaxTokens);
}
