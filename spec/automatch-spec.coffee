path = require "path"
open = (fileName) ->
	projectPath = path.join __dirname, "fixtures", fileName
	atom.workspace.open(projectPath)


describe "Auto-matching", ->
	[editor, workspaceElement, textGrammar, configGrammar, shellGrammar, gitGrammar] = []

	beforeEach ->
		atom.config.set "language-generic-config.enableAutomatch", true
		atom.config.set "language-generic-config.automatchPattern", "^\\s*[;#]\\s"
		atom.config.set "language-generic-config.requireMinimumMatchingLines", 2

		waitsForPromise ->
			atom.packages.activatePackage("language-generic-config")
		
		waitsForPromise ->
			atom.packages.activatePackage("language-text")
		
		waitsForPromise ->
			atom.packages.activatePackage("language-shellscript")
		
		waitsForPromise ->
			atom.packages.activatePackage("language-git")
		
		waitsForPromise ->
			open "normal.file"

		runs ->
			workspaceElement = atom.views.getView atom.workspace
			editor = atom.workspace.getActiveTextEditor()
			textGrammar = atom.grammars.grammarForScopeName("text.plain")
			configGrammar = atom.grammars.grammarForScopeName("text.generic-config")
			shellGrammar = atom.grammars.grammarForScopeName("source.shell")
			gitGrammar = atom.grammars.grammarForScopeName("source.git-config")
			expect(textGrammar).toBeTruthy()
			expect(configGrammar).toBeTruthy()
			expect(shellGrammar).toBeTruthy()
			expect(gitGrammar).toBeTruthy()


	describe "when opening an unrecognised file-format", ->
		describe "when the file has no comment-lines", ->
			it "uses the null-grammar, as per normal", ->
				expect(editor).toBeTruthy()
				expect(editor.getGrammar()).toBeTruthy()
				expect(editor.getGrammar()).toBe atom.grammars.nullGrammar


		describe "when the file has comments starting with `#`", ->
			it "enables the `generic-config` grammar", ->
				waitsForPromise ->
					open "unix-config"
				
				runs ->
					editor = atom.workspace.getActiveTextEditor()
					expect(editor.getGrammar()).toBe configGrammar
		
		
		describe "when the file has comments starting with `;`", ->
			it "enables the `generic-config` grammar", ->
				waitsForPromise ->
					open "win32-config"
				
				runs ->
					editor = atom.workspace.getActiveTextEditor()
					expect(editor.getGrammar()).toBe configGrammar
	
	
	describe "when opening a recognised file-format", ->
		describe "when the format uses `#` to introduce comments", ->
			it "uses the format's grammar", ->
				waitsForPromise ->
					open "exec.sh"
				
				runs ->
					editor = atom.workspace.getActiveTextEditor()
					expect(editor.getGrammar()).toBe shellGrammar
		
		describe "when the format uses `;` to introduce comments", ->
			it "uses the format's grammar", ->
				waitsForPromise ->
					open "semicolons.gitconfig"
				
				runs ->
					editor = atom.workspace.getActiveTextEditor()
					expect(editor.getGrammar()).toBe gitGrammar
