package main

import (
	"fmt"
	"strings"
)

type Theme struct {
	Name   string
	Accent string
	Tokens map[string]string
}

func (t Theme) Label() string {
	return fmt.Sprintf("%s: %s", t.Name, t.Accent)
}

func supportedTokens(theme Theme) []string {
	keys := make([]string, 0, len(theme.Tokens))
	for token, color := range theme.Tokens {
		if strings.HasPrefix(color, "#") {
			keys = append(keys, token)
		}
	}
	return keys
}

func main() {
	theme := Theme{
		Name:   "CodePen Theme Original",
		Accent: "#96b38a",
		Tokens: map[string]string{
			"keyword": "#ddca7e",
			"string":  "#96b38a",
			"comment": "#717790",
		},
	}

	for _, token := range supportedTokens(theme) {
		fmt.Printf("%s renders %s\n", token, theme.Tokens[token])
	}
	fmt.Println(theme.Label())
}
