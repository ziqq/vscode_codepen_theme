from dataclasses import dataclass
from enum import StrEnum


class ThemeMode(StrEnum):
    DARK = "dark"
    HIGH_CONTRAST = "high-contrast"


@dataclass(frozen=True, slots=True)
class Theme:
    name: str
    accent: str
    background: str

    def label(self, mode: ThemeMode) -> str:
        return f"{self.name}: {self.accent} ({mode.value})"


def palette(theme: Theme) -> dict[str, str]:
    return {
        "keyword": "#ddca7e",
        "string": theme.accent,
        "comment": "#717790",
    }


def render_tokens(theme: Theme) -> list[str]:
    return [f"{name}: {color}" for name, color in palette(theme).items()]


theme = Theme(
    name="CodePen Theme Original",
    accent="#96b38a",
    background="#1d1e22",
)
for token in render_tokens(theme):
    print(token)
print(theme.label(ThemeMode.DARK))
