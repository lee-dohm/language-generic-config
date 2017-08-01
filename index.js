"use strict";

const {CompositeDisposable, Disposable} = require("atom");
const PACKAGE_NAME  = "language-generic-config";
const PACKAGE_SCOPE = "text.generic-config";
const OPT_AM_ENABLE = `${PACKAGE_NAME}.enableAutomatch`;
const OPT_AM_REGEXP = `${PACKAGE_NAME}.automatchPattern`;
const OPT_MIN_LINES = `${PACKAGE_NAME}.requireMinimumMatchingLines`;


module.exports = {
	autoMatchPattern: /(?=N)A/,
	autoMatchEnabled: true,
	
	activate(){
		this.affectedEditors = new Map();
		this.disposables = new CompositeDisposable(
			atom.config.observe(OPT_AM_REGEXP, value => {
				this.autoMatchPattern = new RegExp(value, "gm");
			}),
			atom.config.observe(OPT_AM_ENABLE, value => {
				this.autoMatchEnabled = !!value;
				if(!this.autoMatchEnabled && this.affectedEditors.size)
					this.unassignAll();
			}),
			atom.workspace.observeTextEditors(editor => {
				if(this.canAutoMatch(editor) && this.testAutoMatch(editor))
					this.assignGrammar(editor);
			})
		);
	},
	
	
	deactivate(){
		this.disposables.dispose();
		this.disposables = null;
		this.affectedEditors.clear();
		this.affectedEditors = null;
	},
	
	
	/**
	 * Determine whether a {@link TextEditor} can be overridden by the package.
	 *
	 * @param {TextEditor} editor
	 * @return {Boolean}
	 * @internal
	 */
	canAutoMatch(editor){
		return atom.workspace.isTextEditor(editor)
			&& !this.affectedEditors.has(editor)
			&& !atom.textEditors.getGrammarOverride(editor);
	},
	
	
	/**
	 * Execute the `autoMatch` pattern against an editor's contents.
	 * 
	 * @param {TextEditor} editor
	 * @return {Boolean} Whether the file appears to be a generic-config file
	 * @internal
	 */
	testAutoMatch(editor){
		const text = editor.getText() || "";
		const matches = text.match(this.autoMatchPattern) || [];
		return matches.length >= atom.config.get(OPT_MIN_LINES);
	},
	
	
	/**
	 * Override an editor's language-type with the `generic-config` grammar.
	 *
	 * This method also configures event listeners to undo the override
	 * when closing the editor, or manually assigning a different grammar.
	 * Doing this ensures auto-matched files won't take precedence over a
	 * language package which may be installed later. It also makes sure the
	 * overridden paths don't bloat the serialised project's metadata.
	 * 
	 * @param {TextEditor} editor
	 * @return {CompositeDisposables}
	 * @internal
	 */
	assignGrammar(editor){
		
		// Run a quick sanity check to avoid doubling our listeners
		let disposables = this.affectedEditors.get(editor);
		if(disposables)
			return disposables;
		
		disposables = new CompositeDisposable(
			new Disposable(() => {
				atom.textEditors.clearGrammarOverride(editor);
				this.affectedEditors.delete(editor);
			}),
			editor.onDidChangeGrammar(grammar => {
				if(grammar && grammar.scopeName !== PACKAGE_SCOPE)
					this.unassignGrammar(editor);
			}),
			editor.onDidDestroy(() => this.unassignGrammar(editor))
		);
		this.affectedEditors.set(editor, disposables);
		atom.textEditors.setGrammarOverride(editor, PACKAGE_SCOPE);
		return disposables;
	},
	
	
	/**
	 * Remove the grammar override tied to a specific editor.
	 * 
	 * @param {TextEditor}
	 * @internal
	 */
	unassignGrammar(editor){
		const disposables = this.affectedEditors.get(editor);
		if(disposables)
			disposables.dispose();
	},
	
	
	/**
	 * Remove grammar overrides from *all* currently-affected editors.
	 * @internal
	 */
	unassignGrammarFromAll(){
		for(const [editor, disposables] of [...this.affectedEditors]){
			disposables.dispose();
			this.affectedEditors.delete(editor);
		}
	}
};
