data class Theme(
    val name: String,
    val accent: String,
)

fun main() {
    val theme = Theme(
        name = "CodePen Theme Original",
        accent = "#96b38a",
    )
    println("${theme.name}: ${theme.accent}")
}
