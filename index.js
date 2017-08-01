"use strict";

const {CompositeDisposable, Disposable} = require("atom");
const PACKAGE_SCOPE = "text.generic-config";
const OPT_AM_ENABLE = "language-generic-config.automatchEnabled";
const OPT_AM_REGEXP = "language-generic-config.automatchPattern";
const OPT_MIN_LINES = "language-generic-config.requireMinimumMatchingLines";


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
	
	
	canAutoMatch(editor){
		return atom.workspace.isTextEditor(editor)
			&& !this.affectedEditors.has(editor)
			&& !atom.textEditors.getGrammarOverride(editor);
	},
	
	
	testAutoMatch(editor){
		const text = editor.getText() || "";
		const matches = text.match(this.autoMatchPattern) || [];
		return matches.length >= atom.config.get(OPT_MIN_LINES);
	},
	
	
	assignGrammar(editor){
		const disposables = new CompositeDisposable(
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
	},
	
	
	unassignGrammar(editor){
		const disposables = this.affectedEditors.get(editor);
		if(disposables)
			disposables.dispose();
	},
	
	unassignGrammarFromAll(){
		for(const [editor, disposables] of [...this.affectedEditors]){
			disposables.dispose();
			this.affectedEditors.delete(editor);
		}
	}
};
