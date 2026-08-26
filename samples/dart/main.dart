sealed class ThemeState {
  const ThemeState();
}

final class ThemeReady extends ThemeState {
  const ThemeReady(this.name);

  final String name;
}

void main() {
  const state = ThemeReady('CodePen Theme Original');
  print(state.name);
}
