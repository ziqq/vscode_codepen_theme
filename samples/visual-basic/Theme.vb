Imports System.Collections.Generic
Imports System.Linq

' Classes, properties, generics, interpolation, LINQ, and XML documentation.
''' <summary>Describes a CodePen syntax theme.</summary>
Public NotInheritable Class Theme
    Public ReadOnly Property Name As String
    Public ReadOnly Property Accent As String
    Public ReadOnly Property Tokens As IReadOnlyList(Of String)

    Public Sub New(name As String, accent As String, tokens As IEnumerable(Of String))
        Me.Name = name
        Me.Accent = accent
        Me.Tokens = tokens.ToArray()
    End Sub

    Public Function Label(Optional prefix As String = "theme") As String
        Return $"{prefix}: {Name} ({Accent})"
    End Function

    Public Iterator Function VisibleTokens() As IEnumerable(Of String)
        For Each token In Tokens
            If token <> "comment" Then
                Yield token.ToUpperInvariant()
            End If
        Next
    End Function
End Class

Module Program
    Private Sub Main(args As String())
        Dim theme = New Theme(
            "CodePen Theme Original",
            "#96b38a",
            {"keyword", "string", "comment"})

        Console.WriteLine($"{theme.Label()}: {String.Join(", ", theme.VisibleTokens())}")
    End Sub
End Module
