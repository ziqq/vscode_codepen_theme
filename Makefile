SHELL :=/bin/bash -e -o pipefail
PWD   := $(shell pwd)

# TAG, e.g: v1.0.0
TAG=$(shell git describe --tags --abbrev=0 | awk -F. '{$$NF = $$NF + 1;} 1' OFS=.)

.PHONY: help
help:
	@echo 'Usage: make <OPTIONS> ... <TARGETS>'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## setup environment
	@npm install
	@npm install -g @vscode/vsce

.PHONY: login
login: ## login to vsce
	@vsce login ziqq

.PHONY: build
build: setup ## build extension
	@vsce package

.PHONY: tag-add
tag-add: ## Make command to add TAG. E.g: make tag-add TAG=v1.0.0
	@if [ -z "$(TAG)" ]; then echo "TAG is not set"; exit 1; fi
	@git tag $(TAG)
	@git push origin $(TAG)
	@echo ""
	@echo "CREATED AND PUSHED TAG $(TAG)"
	@echo ""

.PHONY: tag-remove
tag-remove: ## Make command to delete TAG. E.g: make tag-delete TAG=v1.0.0
	@if [ -z "$(TAG)" ]; then echo "TAG is not set"; exit 1; fi
	@git tag -d $(TAG)
	@git push origin --delete $(TAG)
	@echo ""
	@echo "DELETED TAG $(TAG) LOCALLY AND REMOTELY"
	@echo ""

.PHONY: publish
publish: build ## publish extension
	@vsce publish

.PHONY: minor
minor: build ## publish minor TAG
	@vsce publish minor

.PHONY: test
test: ## run tests
	@npm install
	@npm test

.PHONY: diff
diff: ## git diff
	$(call print-target)
	@git diff --exit-code
	@RES=$$(git status --porcelain) ; if [ -n "$$RES" ]; then echo $$RES && exit 1 ; fi

define print-target
    @printf "Executing target: \033[36m$@\033[0m\n"
endef
