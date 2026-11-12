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

type labeler interface {
	Label() string
}

func labels[T labeler](values ...T) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		result = append(result, value.Label())
	}
	return result
}

// ---------------------------------------------------------------------------
// Extended showcase: constants, iota, generics, goroutines, errors, defer.
// ---------------------------------------------------------------------------

const (
	MaxTokens        = 64
	DefaultAccent    = "#96b38a"
	opacity  float64 = 0.85
)

type Severity int

const (
	Info Severity = iota
	Warning
	Error
)

var (
	ErrNotFound = errors.New("token not found")
	hexColor    = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	registry    = map[string]*Token{}
	mu          sync.RWMutex
)

// Token describes one highlighted role.
type Token struct {
	Name   string `json:"name"`
	Color  string `json:"color,omitempty"`
	Weight int    `json:"weight"`
}

func (s Severity) String() string {
	switch s {
	case Info:
		return "info"
	case Warning:
		return "warning"
	default:
		return fmt.Sprintf("severity(%d)", int(s))
	}
}

func (t *Token) Valid() bool { return t != nil && hexColor.MatchString(t.Color) }

type Number interface {
	~int | ~int64 | ~float64
}

func Sum[T Number](values ...T) (total T) {
	for _, v := range values {
		total += v
	}
	return
}

func Lookup(name string) (*Token, error) {
	mu.RLock()
	defer mu.RUnlock()
	if token, ok := registry[name]; ok {
		return token, nil
	}
	return nil, fmt.Errorf("lookup %q: %w", name, ErrNotFound)
}

func Collect(ctx context.Context, names []string) ([]Token, error) {
	results := make(chan Token, len(names))
	var wg sync.WaitGroup
	for i, name := range names {
		wg.Add(1)
		go func(index int, name string) {
			defer wg.Done()
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Duration(index) * 10 * time.Millisecond):
				results <- Token{Name: strings.ToUpper(name), Color: DefaultAccent, Weight: index}
			}
		}(i, name)
	}
	go func() { wg.Wait(); close(results) }()

	tokens := []Token{}
	for token := range results {
		tokens = append(tokens, token)
	}
	if err := ctx.Err(); errors.Is(err, context.DeadlineExceeded) {
		return tokens, err
	}
	return tokens, nil
}

func init() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recovered:", r)
		}
	}()
	registry["keyword"] = &Token{Name: "keyword", Color: "#ddca7e", Weight: 0x10}
	_ = Sum(1, 2, 3) + int(opacity*100) + 'a' + 1e3
}
