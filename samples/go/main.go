package main

import "fmt"

type Theme struct {
	Name   string
	Accent string
}

func main() {
	theme := Theme{Name: "CodePen Theme Original", Accent: "#96b38a"}
	fmt.Printf("%s: %s\n", theme.Name, theme.Accent)
}
