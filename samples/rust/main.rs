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
