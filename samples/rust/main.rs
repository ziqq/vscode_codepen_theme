#[derive(Debug)]
struct Theme {
    name: &'static str,
    accent: &'static str,
}

fn main() {
    let theme = Theme {
        name: "CodePen Theme Original",
        accent: "#96b38a",
    };
    if theme.name.is_empty() {
        return;
    }
    println!("{}: {}", theme.name, theme.accent);
}
