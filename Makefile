PUBLISHER ?= your-publisher-id

.PHONY: install-python compile package install login publish clean

install-python:
	pnpm run install-python

compile: install-python
	pnpm run compile

package: install-python
	pnpm exec vsce package

install: package
	code --install-extension $$(ls xmi-generator-*.vsix | tail -1)

login:
	pnpm exec vsce login $(PUBLISHER)

publish: install-python
	pnpm exec vsce publish

clean:
	rm -rf dist/ out/ python/lib/ *.vsix
