import { Controller } from "@hotwired/stimulus"
import {timeAgo} from "../helpers/index.js"
import * as Query from "../../wailsjs/go/db/FrontQuery";
import {db} from "../../wailsjs/go/models";
import { Platform } from "../../wailsjs/go/main/App";

const highlightUp = 1
const highlightDown = 2
const listInsertAfterLast = 1
const listInsertBeforeFirst = 2

export default class extends Controller {
    static targets = ["itemTemplate", "item", "list", "search"]
    static outlets = ["editor", "search"]
    static classes = ["selected"]

    async connect(){
        this.offset = 0 // 追踪已加载的数据偏移量
        this.limit = 20 // 每批加载的条目数量
        this.isLoading = false // 防止重复加载

        this.selectedItem = null

        this.listTarget.addEventListener("scroll", this.handleScroll.bind(this))
        this.platform = await Platform() 
    }

    async loadDiaryList(direction){
        if(!direction){
            direction = listInsertAfterLast
        }
        if(!this.totalCount){
            this.totalCount = await Query.GetDiariesCount()
        }
        if(this.offset >= this.totalCount){
            return
        }
        const limitation = new db.GetAllDiariesLimitParams({ Limit: this.limit, Offset: this.offset })
        try {
            let lastItem = this.listTarget.lastElementChild
            if(lastItem){
                lastItem.classList.remove("end")
            }
            const entries = await Query.GetAllDiariesLimit(limitation) 
            for (let entry of entries) {
                this.addNewItem(entry, direction)
            }
            this.offset += entries.length // 更新偏移量
            lastItem = this.listTarget.lastElementChild
            if(lastItem){
                lastItem.classList.add("end")
            }
            if(!this.selectedItem){
                this.highlightItem(this.listTarget.firstElementChild);
            }
        } catch (error) {
            console.error("加载日记列表失败:", error)
        }
    }

    openFirstDiary(){
        let firstItem = this.listTarget.firstElementChild
        let diaryID = firstItem.querySelector("span").dataset.id
        this.editorOutlet.loadDiary(diaryID)
    }

    async loadMoreDiaryList() {
        if (this.isLoading) return // 防止重复加载
        this.isLoading = true
        await this.loadDiaryList()
        this.isLoading = false
    }

    // 滚动监听
    handleScroll(event) {
        const { scrollTop, scrollHeight, clientHeight } = event.target
        // 当滚动到距离底部 100px 时加载更多
        if (scrollHeight - scrollTop - clientHeight < 100) {
            this.loadMoreDiaryList()
        }
    }

    disconnect() {
        // 清理滚动监听，避免内存泄漏
        if (this.listTarget) {
            this.listTarget.removeEventListener("scroll", this.handleScroll.bind(this))
        }
    }

    itemSelected(e){
        let item = e.target.closest("div[data-list-target='item']")
        let diaryID = item.querySelector("span").dataset.id
        this.editorOutlet.loadDiary(diaryID)
        this.highlightItem(item)
    }

    ctrlCmdKey(event){
        if(this.platform == "darwin"){
            return event.metaKey
        }
        return event.ctrlKey
    }

    focus(){
        this.listTarget.focus();
    }

    getFirstLastItemInViewPort(arrowDirection){
        let item = this.selectedItem
        let lastCheckItem = null
        for(;item;){
            const rect = item.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const isInViewport = (
                rect.top >= 0 &&
                rect.top <= viewportHeight &&
                rect.bottom >= 0 &&
                rect.bottom <= viewportHeight
            );
            if(isInViewport){
                lastCheckItem = item
            }else{
                break
            }
            if(arrowDirection == highlightUp){
                item = item.previousElementSibling
            }else if(arrowDirection == highlightDown){
                item = item.nextElementSibling
            }
        }
        if(lastCheckItem){
            return lastCheckItem
        }
        return null
    }

    async keydown(event){
        //search
        if((this.ctrlCmdKey(event)&& event.key  == 'k')){
            this.searchOutlet.focus();
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

        if(event.key == 'Home'){
            let firstItem = this.listTarget.firstElementChild
            this.highlightItem(firstItem);
            return
        }

        if(event.key == "End"){
            let lastItem = this.listTarget.lastElementChild
            this.highlightItem(lastItem);
            return
        }

        if(event.key == "PageUp"){
            let firstItemInView = this.getFirstLastItemInViewPort(highlightUp)
            this.highlightItem(firstItemInView);
            return
        }
        if(event.key == "PageDown"){
            let lastItemInView = this.getFirstLastItemInViewPort(highlightDown)
            this.highlightItem(lastItemInView);
            return
        }

        if(event.key=='Enter'){
            let diaryID = this.selectedItem.querySelector("span").dataset.id
            this.editorOutlet.loadDiary(diaryID)
            return
        }

        //open a new diary
        if((this.ctrlCmdKey(event)&& event.key  == 'o')){
            Query.InsertDiaryRecord("").then((entry)=>{
                this.addNewItem(entry, listInsertBeforeFirst)
                let firstItem = this.listTarget.firstElementChild
                this.highlightItem(firstItem);
                this.editorOutlet.loadDiary(entry.ID)
            })
        }

    }

    insertItemToList(item, order){
        if (order == listInsertAfterLast) {
            this.listTarget.insertBefore(item, null);
        } else if (order == listInsertBeforeFirst) {
            this.listTarget.insertBefore(item, this.listTarget.firstChild);
        }
    }

    addNewItem(entry, direction){
        let newItem = this.itemTemplateTarget.content.cloneNode(true);
        this.setEntryElement(newItem, entry);
        this.insertItemToList(newItem, direction);
        return newItem
    }

    setEntryElement(item, entry){
        let span = item.querySelector(".id-span");
        span.setAttribute("id", `item-${entry.ID}`);
        span.dataset.id=entry.ID
        let titleEl = item.querySelector('.create-time');
        titleEl.textContent = timeAgo(entry.CreatedAt);
        let contentEl = item.querySelector('p');
        contentEl.textContent = entry.Entry;
        let updateEl = item.querySelector('.update-time');
        updateEl.textContent = timeAgo(entry.UpdatedAt);
    }

    highlightItem(item) {
        if(!item){
            return
        }
        if (this.selectedItem) {
            this.selectedItem.classList.remove(this.selectedClass)
        }
        item.classList.add(this.selectedClass)
        this.selectedItem = item
        item.scrollIntoView({ block: "nearest" }) 
    }

    async moveUpOrDownItem(arrowDirection, currentItem) {
        let item
        if (arrowDirection === highlightUp) {
            item = currentItem.previousElementSibling
        } else if (arrowDirection === highlightDown) {
            if(currentItem && currentItem.classList.contains("end")){
                await this.loadMoreDiaryList()
            }
            item = currentItem.nextElementSibling
        }
        if (item) {
            this.highlightItem(item) // 滚动到中间
        }
    }

    updateItem(entry){
        let item = this.element.querySelector(`#item-${entry.ID}`).parentNode
        this.setEntryElement(item, entry);
    }
}
