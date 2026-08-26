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
