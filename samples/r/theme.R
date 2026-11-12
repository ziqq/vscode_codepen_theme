# Functions, named lists, data frames, formulas, pipes, and vectorization.
theme <- list(
  name = "CodePen Theme Original",
  accent = "#96b38a",
  tokens = c("keyword", "string", "comment")
)

label_theme <- function(value, prefix = "theme") {
  stopifnot(is.list(value), nzchar(value$name))
  sprintf("%s: %s (%s)", prefix, value$name, value$accent)
}

visible_tokens <- function(tokens, include_comments = FALSE) {
  selected <- if (include_comments) tokens else tokens[tokens != "comment"]
  toupper(selected)
}

token_table <- data.frame(
  role = theme$tokens,
  color = c("#ddca7e", "#96b38a", "#717790"),
  visible = c(TRUE, TRUE, FALSE)
)

score <- with(token_table, as.integer(visible) ~ role)
result <- token_table |>
  subset(visible) |>
  transform(label = paste(role, color, sep = ": "))

message(label_theme(theme))
print(result[, c("role", "label")])
