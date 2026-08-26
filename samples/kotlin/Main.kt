enum class ThemeMode { DARK, HIGH_CONTRAST }

data class Theme(
    val name: String,
    val accent: String,
    val background: String,
)

fun Theme.label(mode: ThemeMode): String = "$name uses $accent in ${mode.name.lowercase()} mode"

fun palette(theme: Theme): Map<String, String> = mapOf(
    "keyword" to "#ddca7e",
    "string" to theme.accent,
    "comment" to "#717790",
)

fun main() {
    val theme = Theme(
        name = "CodePen Theme Original",
        accent = "#96b38a",
        background = "#1d1e22",
    )

    palette(theme)
        .filterValues { it.startsWith("#") }
        .forEach { (token, color) -> println("$token: $color") }

    println(theme.label(ThemeMode.DARK))
}
