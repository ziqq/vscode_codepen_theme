workspace "CodePen Sample" "C4 syntax sample" {
  model {
    user = person "Theme author" "Maintains the color theme"
    vscode = softwareSystem "Visual Studio Code" "Renders TextMate scopes"
    user -> vscode "Uses"
  }

  views {
    systemContext vscode "Context" {
      include *
      autoLayout lr
    }
  }
}
