import { Controller } from "@hotwired/stimulus"
import { EditorView } from 'codemirror';
import { keymap } from '@codemirror/view';
import { EditorState,  StateEffect, StateField } from "@codemirror/state";
import {markdown, markdownLanguage} from "@codemirror/lang-markdown"
import * as Query from "../../wailsjs/go/db/FrontQuery";
import {db} from "../../wailsjs/go/models";

import {highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
        rectangularSelection, crosshairCursor,
        lineNumbers, highlightActiveLineGutter} from "@codemirror/view"
import {defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
        foldGutter } from "@codemirror/language"
import {emacsStyleKeymap, history, historyKeymap, deleteGroupBackward} from "@codemirror/commands"
import {highlightSelectionMatches} from "@codemirror/search"


const basicSetup = (() => [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
        ...emacsStyleKeymap,
        ...historyKeymap,
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
        this.moveCursorToEnd()
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
                        }, 2000) //save every 2 seconds when stop typing
                    }
                }),
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
            { key: "Ctrl-w", run: (view) => {
                deleteGroupBackward(view)
            }},
        ]);
        return km
    }

    focus(){
        self.editor.contentDOM.focus();
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
    }
}
