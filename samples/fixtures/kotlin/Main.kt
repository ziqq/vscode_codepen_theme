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

sealed interface TokenRole {
    val color: String

    data class Keyword(override val color: String = "#ddca7e") : TokenRole
    data class Literal(val name: String, override val color: String) : TokenRole
}

fun TokenRole.describe(): String = when (this) {
    is TokenRole.Keyword -> "keyword=$color"
    is TokenRole.Literal -> "$name=$color"
}

// ---------------------------------------------------------------------------
// Extended showcase: objects, generics, coroutines-style suspend, DSLs.
// ---------------------------------------------------------------------------

const val MAX_TOKENS = 0x40
private val HEX_COLOR = Regex("""^#[0-9a-fA-F]{6}$""")
var globalCounter: Int = 0
    private set

@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Experimental(val reason: String = "")

typealias TokenMap = MutableMap<String, Token>

@JvmInline
value class Color(val hex: String) {
    init {
        require(HEX_COLOR.matches(hex)) { "Invalid color: $hex" }
    }

    val rgb: Int get() = hex.removePrefix("#").toInt(16)
}

open class Token(val name: String, open val color: Color) : Comparable<Token> {
    override fun compareTo(other: Token): Int = name.compareTo(other.name)
    override fun toString() = "Token(name=$name, color=${color.hex})"
}

class WeightedToken(name: String, override val color: Color, val weight: Int = 1) : Token(name, color)

object Registry {
    private val tokens: TokenMap = linkedMapOf()
    val size get() = tokens.size

    operator fun get(name: String): Token? = tokens[name]
    operator fun set(name: String, token: Token) {
        tokens[name] = token
        globalCounter++
    }

    inline fun <reified T : Token> ofType(): List<T> = tokens.values.filterIsInstance<T>()
}

interface Repository<in K, out V> {
    suspend fun load(key: K): V?
}

@Experimental(reason = "builder DSL")
class PaletteBuilder {
    private val entries = mutableListOf<Pair<String, String>>()

    infix fun String.to(color: String) {
        entries += this to color
    }

    fun build(): Map<String, String> = entries.toMap()
}

fun palette(block: PaletteBuilder.() -> Unit): Map<String, String> = PaletteBuilder().apply(block).build()

fun <T : Comparable<T>> List<T>.second(): T? = sortedDescending().getOrNull(1)

tailrec fun gcd(a: Long, b: Long): Long = if (b == 0L) a else gcd(b, a % b)

fun classify(value: Any?): String = when (value) {
    null -> "null"
    is Int, is Long -> "number ${value}"
    is String if value.startsWith("#") -> "color"
    in 1.0..2.0 -> "range"
    else -> value::class.simpleName ?: "unknown"
}

suspend fun loadAll(repo: Repository<String, Token>, names: List<String>): List<Token> =
    names.mapNotNull { name ->
        runCatching { repo.load(name) }
            .onFailure { error -> println("failed: ${error.message}") }
            .getOrNull()
    }

fun showcase() {
    val colors = palette {
        "keyword" to "#ddca7e"
        "string" to "#96b38a"
    }
    Registry["accent"] = WeightedToken("accent", Color("#96b38a"), weight = 3)
    val accent = Registry["accent"] as? WeightedToken ?: return
    val lazyValue by lazy { accent.weight * 2.5f + 1_000L + 'c'.code }
    try {
        check(colors.isNotEmpty()) { "empty palette" }
        println("${colors.keys} ${accent.color.rgb} $lazyValue ${gcd(48, 18)}")
    } catch (e: IllegalStateException) {
        throw IllegalArgumentException("bad palette", e)
    } finally {
        repeat(3) { index -> if (index % 2 == 0) return@repeat else println(index) }
    }
}
