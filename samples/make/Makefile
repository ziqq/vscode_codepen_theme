# Make targets are callable tasks; variables keep the binding role.
THEME := CodePen Theme Original
ACCENT := \#96b38a
SOURCES := $(wildcard src/*.js)
OUTPUT ?= build/theme.txt

.PHONY: all check preview
all: check preview

check:
	@printf '%s\n' "Checking $(THEME)"

preview: $(OUTPUT)
	@printf '%s\n' "$(THEME): $(ACCENT)"

$(OUTPUT): $(SOURCES)
	@printf '%s\n' "$@ uses $<"

%.json: %.js
	@printf '%s\n' "$*"

ifeq ($(MODE),dark)
BACKGROUND := \#1d1e22
else
BACKGROUND := \#ffffff
endif

empty :=
space := $(empty) $(empty)
TOKEN_NAMES := keyword string comment

define preview_banner
$(THEME) [$1] uses $(ACCENT)
endef

.PHONY: render matrix
render: TOKEN := keyword
render: | build
	@printf '%s\n' "$(call preview_banner,$(TOKEN))"

build:
	@mkdir -p $@

matrix:
	@$(foreach token,$(TOKEN_NAMES),printf '%s\n' '$(token)';)
