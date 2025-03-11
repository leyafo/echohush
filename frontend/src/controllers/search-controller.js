import { Controller } from "@hotwired/stimulus"
import { FtsDiarySearch }from "../../wailsjs/go/db/FrontQuery";

const highlightUp = 1
const highlightDown = 2
export default class extends Controller {
    static targets = ["input", "suggestion", "suggestionItemTemplate"]
    static classes = ["selected"]
    static outlets = ["list", "editor"]

    connect(){

    }

    focus(){
        this.inputTarget.focus()
    }

    unfocus(){
        this.inputTarget.value = ""
        this.listOutlet.focus()
        this.hideSuggestion()
    }

    ctrlCmdKey(event){
        return event.ctrlKey;
    }

    keydown(event){
        if(event.key == "Escape"){
            this.unfocus()
            return
        }
        if((this.ctrlCmdKey(event)&& event.key  == 'n') || event.key=='j' || event.key=='ArrowDown'){
            this.moveUpOrDownItem(highlightDown, this.selectedItem)
            return
        }

        if((this.ctrlCmdKey(event)&& event.key  == 'p') || event.key=='k'||event.key=='ArrowUp'){
            this.moveUpOrDownItem(highlightUp, this.selectedItem)
            return
        }
        if(event.key == "Enter" && this.selectedItem){
            let diaryID = this.selectedItem.querySelector(".content").dataset.id
            this.editorOutlet.loadDiary(diaryID)
            this.hideSuggestion()    
        }
    }
    
    moveUpOrDownItem(arrowDirection, currentItem){
        let item
        if(!currentItem){
            item = this.suggestionTarget.firstElementChild
            this.selectedItem = item
        }else{
            if (arrowDirection === highlightUp) {
                if(currentItem.classList.contains("begin")){
                    item = this.suggestionTarget.lastElementChild
                }else{
                    item = currentItem.previousElementSibling
                }
            } else if (arrowDirection === highlightDown) {
                if(currentItem.classList.contains("end")){
                    item = this.suggestionTarget.firstElementChild
                }else{
                    item = currentItem.nextElementSibling
                }
            }
        }
        if (item) {
            this.selectedItem.classList.remove(this.selectedClass)
            this.selectedItem = item
            this.selectedItem.classList.add(this.selectedClass)
            item.scrollIntoView({ block: "nearest" }) 
        }
    }

    hideSuggestion(){
        this.suggestionTarget.classList.add("hidden")
        this.suggestionTarget.replaceChildren()
    }
    showSuggestion(){
        if(this.suggestionTarget.classList.contains("hidden")){
            this.suggestionTarget.classList.remove("hidden")
        }
    }

    setItem(item, diary){
        const span = item.querySelector(".content")
        span.innerHTML = diary.Entry
        span.dataset.id = diary.ID
    }

    performSearch(event){
        let self = this
        FtsDiarySearch(self.inputTarget.value).then((diaries)=>{
            if(diaries){
                this.suggestionTarget.replaceChildren()
                this.selectedItem = null
                for(let diary of diaries){
                    let newItem = self.suggestionItemTemplateTarget.content.cloneNode(true);
                    self.setItem(newItem, diary);
                    self.suggestionTarget.insertBefore(newItem, this.suggestionTarget.firstElementChild)
                }
                if(diaries.length >= 2){
                    self.suggestionTarget.firstElementChild.classList.add("begin")
                    self.suggestionTarget.lastElementChild.classList.add("end")
                }
                self.showSuggestion()
            }else{
                self.hideSuggestion()
            }
        })
    }
}
