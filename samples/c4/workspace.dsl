workspace "CodePen Theme" "C4 syntax fixture for the theme" {
  model {
    author = person "Theme author" "Maintains the color palette and compatibility contract"
    developer = person "Extension user" "Selects the theme in Visual Studio Code"

    vscode = softwareSystem "Visual Studio Code" "Loads language providers and renders TextMate scopes" {
      extension = container "CodePen Theme" "Theme-only VSIX" "JSON"
      compatibility = container "Provider compatibility" "Validates scopes and screenshots" "Node.js"

      extension -> compatibility "Shares sample and scope definitions"
    }

    marketplace = softwareSystem "VS Code Marketplace" "Publishes the CodePen theme"

    author -> extension "Defines colors and token mappings"
    developer -> vscode "Uses with recommended language providers"
    extension -> marketplace "Publishes"
    compatibility -> vscode "Launches integration checks against" "CLI"
  }

  views {
    systemContext vscode "SystemContext" {
      include author
      include developer
      include *
      autoLayout lr
    }

    container vscode "Containers" {
      include *
      autoLayout tb
    }

    styles {
      element "Person" {
        shape Person
        background "#96b38a"
        color "#1d1e22"
      }

      element "Software System" {
        background "#2e2f39"
        color "#ffffff"
      }

      element "Container" {
        background "#464756"
        color "#ffffff"
      }
    }
  }
}
