import { Controller } from "@hotwired/stimulus"
import { basicSetup, EditorView } from 'codemirror';
import { keymap } from '@codemirror/view';
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { history } from "@codemirror/commands";
import { emacs } from "@replit/codemirror-emacs"
import {markdown, markdownLanguage} from "@codemirror/lang-markdown"
import * as Query from "../../wailsjs/go/db/FrontQuery";
import {db} from "../../wailsjs/go/models";

export default class extends Controller {
    static targets = ["container"]
    static outlets = ["list"]

    async saveDocument(ID, entry){ let params = new db.UpdateDiaryEntryByIDParams({
            Entry: entry,
            ID: ID,
        })
        Query.UpdateDiaryEntryByID(params).then((newEntry)=>{
            this.listOutlet.updateItem(newEntry)
        }).catch((err)=>{
            console.error(err);
        });
    }

    async loadDiary(id){
        let self=this;
        if(self.autoSaveTimeout){
            clearTimeout(self.autoSaveTimeout);
            self.autoSaveTimeout = null
            self.saveDocument(self.currentDiary.ID, self.editor.state.doc.toString());
        }

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
                        }, 2000) //save every 2 seconds when stop typing
                    }
                }),
                emacs(), 
                this.emacsCustomKeymap(),
                this.saveField,
                markdown({base: markdownLanguage}),

            ],
        })
    }

    emacsCustomKeymap(){
        let self = this
        const km = keymap.of([
            { key: "Escape", run: (view) => { 
                self.editor.contentDOM.blur()
                self.listOutlet.focus();
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
