PUBLISHER ?= your-publisher-id
NPM ?= npm
export PATH := /opt/homebrew/bin:$(PATH)

.PHONY: install-python compile package install login publish clean

install-python:
	$(NPM) run install-python

compile: install-python
	$(NPM) run compile

package: install-python
	$(NPM) exec vsce package

install: package
	code --install-extension $$(ls xmi-generator-*.vsix | tail -1)

login:
	$(NPM) exec vsce login $(PUBLISHER)

publish: install-python
	$(NPM) exec vsce publish

clean:
	rm -rf dist/ out/ python/lib/ *.vsix
