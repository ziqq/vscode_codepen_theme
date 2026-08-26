from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Theme:
    name: str
    accent: str

    def label(self) -> str:
        return f"{self.name}: {self.accent}"


theme = Theme(name="CodePen Theme Original", accent="#96b38a")
print(theme.label())
