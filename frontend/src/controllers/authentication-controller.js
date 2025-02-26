import {Controller} from "@hotwired/stimulus";
import { Modal } from 'flowbite';
import { OpenDB } from "../../wailsjs/go/db/FrontQuery";
import { ChooseFilePath, GetDBPath, IsDev} from "../../wailsjs/go/main/App";

export default class extends Controller {
    static targets = ['modal', "password", "alert", "diaryPath"]
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
        this.modal = new Modal(this.modalTarget, options, instanceOptions);

        this.diaryPathTarget.value = await GetDBPath()
        this.isDev = await IsDev()

        if(this.isDev){
            let self =this
            this.passwordTarget.value="hello world"
            OpenDB(this.diaryPathTarget.value, this.passwordTarget.value).then((err)=>{
                self.listOutlet.loadDiaryList();
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
    }

    async fileChoose(e){
        e.preventDefault();
        const path = await ChooseFilePath()
        this.diaryPathTarget.value = path
    }

    submit(e){
        let self = this
        e.preventDefault()
        OpenDB(this.diaryPathTarget.value, this.passwordTarget.value).then((err)=>{
            self.listOutlet.loadDiaryList();
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
