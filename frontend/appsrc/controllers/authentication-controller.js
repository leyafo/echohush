import {Controller} from "@hotwired/stimulus";
import { Modal } from 'flowbite';
import { OpenDB, InitDB } from "../../wailsjs/go/db/FrontQuery";
import { ChooseDir, ChooseFilePath, GetDBPath, IsDev} from "../../wailsjs/go/main/App";

export default class extends Controller {
    static targets = ['modal', "submitBtn", "password", "alert", "diaryPath", "title"]
    static outlets = ['list']

    async connect(){
        // options with default values
        const options = {
            placement: 'center',
            backdrop: 'static',
            backdropClasses:
            'bg-black dark:bg-gray-900/80 fixed inset-0 z-40',
            closable: true,
            onHide: () => {
            },
            onShow: () => {
            },
            onToggle: () => {
            },
        };

        // instance options object
        const instanceOptions = {
            id: 'authentication-modal',
            override: true
        };
        let dbPath = await GetDBPath()
        if(dbPath == ""){//init db
            this.submitBtnTarget.textContent="Initialize your database"
            this.titleTarget.textContent="Initialize your database" 
            this.modalType = "init"
            this.dbConn = InitDB
        }else{
            this.modalType = "open"
            this.dbConn = OpenDB
            this.diaryPathTarget.value = dbPath
        }

        this.modal = new Modal(this.modalTarget, options, instanceOptions);
        this.isDev = await IsDev()

        if(this.isDev && this.diaryPathTarget.value != ""){
            let self =this
            self.modal.show();
            this.passwordTarget.value="123"
            this.dbConn(this.diaryPathTarget.value, this.passwordTarget.value).then(()=>{
                self.listOutlet.loadDiaryList().then(()=>{
                    self.listOutlet.openFirstDiary();
                });
                self.listOutlet.focus();
                self.modal.hide();
            }).catch((err)=>{
                self.modal.show();
                self.alertTarget.textContent = err;
                self.alertTarget.classList.remove("hidden");
                self.passwordTarget.classList.add("border-red-600");
                console.error(err)
            });
        }else{
            this.modal.show();
        }
        this.passwordTarget.focus();
    }

    async fileChoose(e){
        e.preventDefault();
        if(this.modalType == "init"){
            this.diaryPathTarget.value = await ChooseDir()
        }else{
            this.diaryPathTarget.value = await ChooseFilePath()
        }
    }

    submit(e){
        let self = this
        e.preventDefault()

        this.dbConn(this.diaryPathTarget.value, this.passwordTarget.value).then((err)=>{
            self.listOutlet.loadDiaryList().then(()=>{
                self.listOutlet.openFirstDiary();
            });
            self.listOutlet.focus();
            self.modal.hide();
        }).catch((err)=>{
            self.alertTarget.textContent = err;
            self.alertTarget.classList.remove("hidden");
            self.passwordTarget.classList.add("border-red-600");
            console.error(err)
        });
    }
}
