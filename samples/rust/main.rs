use std::collections::BTreeMap;

#[derive(Debug)]
struct Theme {
    name: &'static str,
    accent: &'static str,
    background: &'static str,
}

impl Theme {
    fn label(&self) -> String {
        format!("{}: {}", self.name, self.accent)
    }

    fn tokens(&self) -> BTreeMap<&'static str, &'static str> {
        BTreeMap::from([
            ("keyword", "#ddca7e"),
            ("string", self.accent),
            ("comment", "#717790"),
        ])
    }
}

fn main() {
    let theme = Theme {
        name: "CodePen Theme Original",
        accent: "#96b38a",
        background: "#1d1e22",
    };

    for (token, color) in theme.tokens() {
        if color.starts_with('#') {
            println!("{token}: {color}");
        }
    }

    println!("{} on {}", theme.label(), theme.background);
}

#[derive(Debug, Clone, Copy)]
enum TokenRole {
    Keyword,
    String,
    Comment,
}

trait CssColor {
    fn color(self) -> &'static str;
}

impl CssColor for TokenRole {
    fn color(self) -> &'static str {
        match self {
            Self::Keyword => "#ddca7e",
            Self::String => "#96b38a",
            Self::Comment => "#717790",
        }
    }
}

const ROLES: [TokenRole; 3] = [TokenRole::Keyword, TokenRole::String, TokenRole::Comment];

#[test]
fn every_role_has_a_css_color() {
    assert!(ROLES.into_iter().all(|role| role.color().starts_with('#')));
}

// ---------------------------------------------------------------------------
// Extended showcase: traits, generics, lifetimes, macros, errors, async.
// ---------------------------------------------------------------------------

use std::fmt::{self, Display};
use std::sync::{Arc, Mutex};

pub static GLOBAL_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);
pub const MAX_TOKENS: usize = 0x40;

/// Errors produced while parsing colors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ColorError {
    Empty,
    InvalidLength(usize),
    InvalidDigit { index: usize, found: char },
}

impl Display for ColorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => write!(f, "empty color"),
            Self::InvalidLength(len) => write!(f, "expected 7 chars, got {len}"),
            Self::InvalidDigit { index, found } => write!(f, "bad digit {found:?} at {index}"),
        }
    }
}

impl std::error::Error for ColorError {}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Rgb(pub u8, pub u8, pub u8);

impl std::str::FromStr for Rgb {
    type Err = ColorError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        let hex = value.strip_prefix('#').ok_or(ColorError::Empty)?;
        if hex.len() != 6 {
            return Err(ColorError::InvalidLength(value.len()));
        }
        let channel = |i: usize| u8::from_str_radix(&hex[i..i + 2], 16);
        match (channel(0), channel(2), channel(4)) {
            (Ok(r), Ok(g), Ok(b)) => Ok(Rgb(r, g, b)),
            _ => Err(ColorError::InvalidDigit { index: 1, found: hex.chars().next().unwrap_or('?') }),
        }
    }
}

pub trait Palette<'a> {
    type Item: Display + 'a;

    fn colors(&'a self) -> Box<dyn Iterator<Item = Self::Item> + 'a>;

    fn count(&'a self) -> usize {
        self.colors().count()
    }
}

impl<'a> Palette<'a> for BTreeMap<&'static str, &'static str> {
    type Item = &'a str;

    fn colors(&'a self) -> Box<dyn Iterator<Item = Self::Item> + 'a> {
        Box::new(self.values().copied())
    }
}

macro_rules! rgb {
    ($r:expr, $g:expr, $b:expr) => {
        Rgb($r as u8, $g as u8, $b as u8)
    };
}

pub fn brightest<T>(items: &[T]) -> Option<&T>
where
    T: Ord + ?Sized,
{
    items.iter().max()
}

pub async fn load(names: Vec<String>) -> Result<Vec<Rgb>, Box<dyn std::error::Error + Send + Sync>> {
    let shared = Arc::new(Mutex::new(Vec::with_capacity(MAX_TOKENS)));
    for (index, name) in names.iter().enumerate() {
        let color: Rgb = name.parse()?;
        if let Ok(mut guard) = shared.lock() {
            guard.push(color);
        }
        GLOBAL_COUNTER.fetch_add(index, std::sync::atomic::Ordering::Relaxed);
    }
    let result = shared.lock().map_err(|e| e.to_string())?.clone();
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_hex() -> Result<(), ColorError> {
        let accent: Rgb = "#96b38a".parse()?;
        assert_eq!(accent, rgb!(0x96, 0xb3, 0x8a));
        assert!(matches!("#zz".parse::<Rgb>(), Err(ColorError::InvalidLength(3))));
        let raw = r#"{"accent": "#96b38a"}"#;
        let bytes = b'x';
        let _float = 1_000.5e-3_f64;
        unsafe { std::ptr::read(&bytes) };
        Ok(())
    }
}
