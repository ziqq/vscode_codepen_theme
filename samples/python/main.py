from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol


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


class SupportsLabel(Protocol):
    def label(self, mode: ThemeMode) -> str: ...


def describe(value: SupportsLabel | None) -> str:
    match value:
        case Theme(name=name, accent=accent) if accent.startswith("#"):
            return f"{name} uses {accent}"
        case None:
            return "No theme selected"
        case _:
            return "Unsupported theme"


print(describe(theme))


# ---------------------------------------------------------------------------
# Extended showcase: decorators, async, generics, context managers, regex.
# ---------------------------------------------------------------------------
import asyncio
import functools
import re
from collections.abc import AsyncIterator, Callable, Iterator
from contextlib import contextmanager
from typing import ClassVar, Final, Generic, TypeVar

MAX_TOKENS: Final = 64
HEX_COLOR = re.compile(r"^#(?P<hex>[0-9a-fA-F]{6})$")
_registry: dict[str, "Token"] = {}
T = TypeVar("T")


def memoize(func: Callable[..., T]) -> Callable[..., T]:
    """Cache results of *func* by positional arguments."""
    cache: dict[tuple, T] = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> T:
        if args not in cache:
            cache[args] = func(*args, **kwargs)
        return cache[args]

    return wrapper


class Token:
    __slots__ = ("name", "color", "_weight")
    instances: ClassVar[int] = 0

    def __init__(self, name: str, color: str = "#ffffff", *, weight: int = 1) -> None:
        self.name = name
        self.color = color
        self._weight = weight
        Token.instances += 1
        _registry[name] = self

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.name!r}, {self.color!r})"

    @property
    def weight(self) -> int:
        return self._weight

    @weight.setter
    def weight(self, value: int) -> None:
        if value < 0:
            raise ValueError(f"weight must be >= 0, got {value}")
        self._weight = value

    @classmethod
    def keyword(cls) -> "Token":
        return cls("keyword", "#ddca7e")

    @staticmethod
    def is_hex(value: str) -> bool:
        return HEX_COLOR.match(value) is not None


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def __iter__(self) -> Iterator[T]:
        yield from reversed(self._items)

    def __len__(self) -> int:
        return len(self._items)


@contextmanager
def highlighted(name: str):
    print(f"\033[1m{name}\033[0m", end="")
    try:
        yield name.upper()
    finally:
        print()


@memoize
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)


async def stream_tokens(names: list[str], delay: float = 0.01) -> AsyncIterator[Token]:
    for index, name in enumerate(names, start=1):
        await asyncio.sleep(delay * index)
        yield _registry.get(name) or Token(name)


async def main() -> None:
    tokens = [token async for token in stream_tokens(["keyword", "string"])]
    weights = {token.name: token.weight for token in tokens if token.weight > 0}
    total = sum(weights.values()) ** 2 // 3 % 7
    with highlighted("tokens") as title:
        print(title, weights, total, fib(20), 1_000_000, 0xFF, 3.14e-2, 2j, sep=" | ")
    if (count := len(tokens)) > MAX_TOKENS or not tokens:
        raise RuntimeError("too many tokens") from None
    assert all(Token.is_hex(t.color) for t in tokens), "invalid colors"
    lambda_square = lambda x: x * x  # noqa: E731
    print(count, lambda_square(4), b"bytes", r"raw\n", True, False, None)


if __name__ == "__main__":
    asyncio.run(main())
