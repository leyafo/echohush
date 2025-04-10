import { Controller } from "@hotwired/stimulus"
import { EditorView } from 'codemirror';
import { EditorState,  StateEffect, StateField, EditorSelection } from "@codemirror/state";
import {markdown, markdownLanguage} from "@codemirror/lang-markdown"
import {
    highlightSpecialChars, 
    drawSelection,
    highlightActiveLine, 
    rectangularSelection,
    lineNumbers,
    highlightActiveLineGutter, 
    keymap,
    showPanel 
} from "@codemirror/view"
import {
    defaultHighlightStyle,
    syntaxHighlighting,
    indentOnInput,
    bracketMatching
} from "@codemirror/language"

import {
    insertTab, 
    deleteToLineStart,
    emacsStyleKeymap,
    history, 
    historyKeymap,
    deleteGroupBackward
} from "@codemirror/commands"

import * as Query from "../../wailsjs/go/db/FrontQuery";
import {db} from "../../wailsjs/go/models";
import {ClipboardGetText, ClipboardSetText} from "../../wailsjs/runtime"

const pattern = /[a-zA-Z0-9'_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+[a-zA-Z0-9'_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff-]*|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;

const customHistoryKeymap = historyKeymap.filter((keymap)=> keymap.key != "Mod-u");
const customEmacsKeymap = emacsStyleKeymap.filter((keymap)=> keymap.key != "Ctrl-v");
const basicSetup = (() => [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
    bracketMatching(),
    rectangularSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    keymap.of([
        ...customEmacsKeymap,
        ...customHistoryKeymap,
    ])
])()


export default class extends Controller {
    static targets = ["container"]
    static outlets = ["list"]

    async saveDocument(ID, entry){ 
        let params = new db.UpdateDiaryEntryByIDParams({
            Entry: entry,
            ID: ID,
        })
        Query.UpdateDiaryEntryByID(params).then((newEntry)=>{
            this.listOutlet.updateItem(newEntry)
        }).catch((err)=>{
            console.error(err);
        });
    }

    async saveNow(){
        if(this.autoSaveTimeout){
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null
            if(this.currentDiary){
                this.saveDocument(this.currentDiary.ID, this.editor.state.doc.toString());
            }
        }
    }

    async loadDiary(id){
        this.saveNow();

        let diary = await Query.GetDiaryByID(Number(id));
        this.currentDiary = diary;
        this.editor.setState(this.createNewState(diary.Entry));
        this.editor.contentDOM.focus();
    }

    async dispatchSaving(){
        console.log('send save event');
        return this.editor.dispatch({effects: this.saveEffect.of(null)});
    }

    createNewState(doc){
        let self = this
        return EditorState.create({
            doc: doc,
            extensions: [
                basicSetup, 
                history(),
                EditorView.lineWrapping,
                EditorView.updateListener.of((v) => {
                    if (v.docChanged && self.currentDiary) {
                        if(self.autoSaveTimeout){
                            clearTimeout(self.autoSaveTimeout);
                            self.autoSaveTimeout = null
                        }
                        self.autoSaveTimeout = setTimeout(()=>{
                            self.dispatchSaving();
                        }, 1000) //save every 2 seconds when stop typing
                    }
                }),
                showPanel.of(self.wordCountPanel.bind(self)),
                this.customKeymap(),
                this.saveField,
                markdown({base: markdownLanguage}),
            ],
        })
    }

    moveCursorToEnd(){
        const docLength = this.editor.state.doc.length;
        this.editor.dispatch({
            selection: { anchor: docLength, head: docLength }, // Move cursor to the end
        });
    };

    customKeymap(){
        let self = this
        const km = keymap.of([
            { 
                key: "Escape", run: (view) => { 
                    self.editor.contentDOM.blur();
                    self.listOutlet.focus();
                    self.saveNow();
                },
            }, 
            { 
                key: "Mod-w", run: (view) => {
                    deleteGroupBackward(view);
                },
            },
            { 
                key: "Mod-u", run: (view) => {
                    return deleteToLineStart(view);
                },
            },
            { 
                key: "Tab", run: (view) => {
                    return insertTab(view);
                },
            },
            { 
                key: "Home", run: (view) => {
                    view.dispatch({
                        selection: { anchor: view.state.doc.length, head: 0 }, // Move cursor to the begin
                    });
                },
            },
            { 
                key: "End", run: (view) => {
                    view.dispatch({
                        selection: { anchor: view.state.doc.length, head: view.state.doc.length }, // Move cursor to the End
                    });
                },
            },
            {
                key: "Mod-c", run: (view)=>{
                    const selection = view.state.selection.main;
                    if (!selection.empty) {
                        const text = view.state.doc.sliceString(selection.from, selection.to);
                        ClipboardSetText(text);
                    }
                    return true;
                },
            },
            {
                key: "Mod-x", run: (view)=>{
                    const selection = view.state.selection.main;
                    if (!selection.empty) {
                        const text = view.state.doc.sliceString(selection.from, selection.to);
                        ClipboardSetText(text);
                        view.dispatch({ changes: { from: selection.from, to: selection.to, insert: "" } });
                    }
                    return true;
                },
            },
            {
                key: "Mod-v", run: async(view)=>{
                    const text = await ClipboardGetText();

                    const cursorPos = view.state.selection.main.from; // Current cursor position
                    const newCursorPos = cursorPos + text.length; // End of pasted text

                    view.dispatch({
                        changes: { from: cursorPos, insert: text }, // Insert the text
                        selection: EditorSelection.single(newCursorPos), // Move cursor to end
                        effects: EditorView.scrollIntoView(newCursorPos, { y: "center" }),
                    });
                    return true;
                },
            }
        ]);
        return km
    }

    focus(){
        this.editor.contentDOM.focus();
    }


    countWords(text){
        const m = text.match(pattern);
        let count = 0;
        if (!m) {
            return 0;
        }
        for (let i = 0; i < m.length; i++) {
            if (m[i].charCodeAt(0) >= 0x4e00) {
                count += m[i].length;
            } else {
                count += 1;
            }
        }
        return `Word count: ${count}`
    }

    wordCountPanel(view){
        let self = this
        let dom = document.createElement("div")
        let content = view.state.doc.toString()
        dom.textContent = self.countWords(content)

        dom.style.padding = "5px 10px";
        dom.style.backgroundColor = "#f0f0f0";
        dom.style.fontFamily = "monospace";
        //dom.textContent = `Word count: ${self.countWords(content)}`;


        // Ensure the panel fits within the editor
        dom.style.width = "100%"; // Full width of the editor
        dom.style.boxSizing = "border-box"; // Include padding in width
        return {
            dom,
            update(update) {
                if (update.docChanged)
                    dom.textContent = self.countWords(update.state.doc.toString())
            },
            top: false,
        }
    }

    connect(){
        let self = this
        this.saveEffect = StateEffect.define();
        this.saveField = StateField.define({
            create() {
                return null;
            },
            update(value, tr) {
                for (let e of tr.effects) {
                    if (e.is(self.saveEffect) && self.currentDiary) {
                        self.saveDocument(self.currentDiary.ID, self.editor.state.doc.toString());
                        return null; // Reset the field after saving
                    }
                }
                return value;
            }
        });

        this.editor = new EditorView({
            state: this.createNewState(),
            parent: this.containerTarget,
        })

        this.editor.contentDOM.addEventListener("blur",()=>{
            if(self.currentDiary){
                Query.SetConfig(`diary_pos_${self.currentDiary.ID}`, `${self.editor.state.selection.main.from}`)
            }
        })

        let dom = this.editor.contentDOM;
        dom.addEventListener("focus",()=>{
            if(self.currentDiary){
                Query.GetConfig(`diary_pos_${self.currentDiary.ID}`).then((value)=>{
                    let newPosition = parseInt(value)
                    self.editor.dispatch({
                        selection: EditorSelection.single(newPosition),
                        effects: EditorView.scrollIntoView(newPosition, { y: "center" }),

                    });
                }).catch((err)=>{
                    console.error(err)
                    self.moveCursorToEnd()
                })
            }
        })
    }
}
