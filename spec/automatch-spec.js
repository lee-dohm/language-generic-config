'use strict'

const {expectScopeToBe, getEditor, waitToOpen} = require('./helpers')

describe('Auto-matching', function(){
	const nullScope    = 'text.plain.null-grammar'
	const packageScope = 'text.generic-config'
	const textScope    = 'text.plain'
	const shellScope   = 'source.shell'
	const gitConfScope = 'source.git-config'

	beforeEach(function(){
		waitsForPromise(() => Promise.all([
			atom.packages.activatePackage('language-text'),
			atom.packages.activatePackage('language-shellscript'),
			atom.packages.activatePackage('language-git'),
			atom.packages.activatePackage('language-generic-config'),
		]))

		runs(() => {
			const textGrammar    = atom.grammars.grammarForScopeName(textScope)
			const packageGrammar = atom.grammars.grammarForScopeName(packageScope)
			const shellGrammar   = atom.grammars.grammarForScopeName(shellScope)
			const gitGrammar     = atom.grammars.grammarForScopeName(gitConfScope)
			expect(textGrammar).toBeTruthy()
			expect(packageGrammar).toBeTruthy()
			expect(shellGrammar).toBeTruthy()
			expect(gitGrammar).toBeTruthy()
		})
	})

	// Reset package options after each spec
	const optEnable   = 'language-generic-config.enableAutomatch'
	const optRegExp   = 'language-generic-config.automatchPattern'
	const optMinLines = 'language-generic-config.requireMinimumMatchingLines'
	afterEach(function(){
		atom.config.set(optEnable, true)
		atom.config.set(optRegExp, "^\\s*[;#]\\s")
		atom.config.set(optMinLines, 2)
	})


	describe('when opening an unrecognised file-format', () => {
		describe('when the file has no comment-lines', () => {
			it('uses the null-grammar (auto-detect)', () => {
				return waitToOpen('normal.file').then(() => {
					const editor = getEditor()
					expect(editor).toBeTruthy()
					expect(editor.getGrammar()).toBeTruthy()
					return expectScopeToBe(nullScope)
				})
			})
		})

		describe('when the file has comments starting with `#`', () => {
			it('enables the `generic-config` grammar', () => {
				waitToOpen('unix-config')
				runs(() => {
					expect(atom.config.get(optEnable)).toBe(true)
					expectScopeToBe(packageScope)
				})
			})
		})

		describe('when the file has comments starting with `;`', () => {
			it('enables the `generic-config` grammar', () => {
				waitToOpen('win32-config')
				runs(() => expectScopeToBe(packageScope))
			})
		})
	})

	describe('when opening a recognised file-format', () => {
		describe('when the format uses `#` to introduce comments', () => {
			it("uses the format's grammar", () => {
				waitsForPromise(() => open('exec.sh'))
				runs(() => expectScopeToBe(shellScope))
			})
		})

		describe('when the format uses `;` to introduce comments', () => {
			it("uses the format's grammar", () => {
				waitsForPromise(() => open('semicolons.gitconfig'))
				runs(() => expectScopeToBe(gitConfScope))
			})
		})
	})

	describe('Package settings', () => {
		describe('when the user disables the `enableAutomatch` setting', () => {
			beforeEach(() => {
				waitsForPromise(() => open('another-config'))
				runs(() => expectScopeToBe(packageScope))
			})

			it('clears all grammar overrides assigned by the package', () => {
				expectScopeToBe(packageScope)
				atom.config.set(optEnable, false)
				expectScopeToBe(nullScope)
				atom.config.set(optEnable, true)
				expectScopeToBe(packageScope)
			})
		})
	})
})
