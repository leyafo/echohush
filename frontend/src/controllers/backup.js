import { Controller } from "@hotwired/stimulus"
import {timeAgo} from "../helpers/index.js"
import * as Query from "../../wailsjs/go/db/FrontQuery.js";
import {db} from "../../wailsjs/go/models.js";

const highlightUp = 1
const highlightDown = 2
const listInsertAfterLast = 1
const listInsertBeforeFirst = 2

export default class extends Controller {
    static targets = ["itemTemplate", "item", "list"]
    static outlets = ["editor"]
    static classes = ["selected"]

    async connect(){
        let self = this
        this.offset = 0 // 追踪已加载的数据偏移量
        this.limit = 40 // 每批加载的条目数量
        this.isLoading = false // 防止重复加载

        this.selectedItem = null

        Query.GetDiariesCount().then((count)=>{
            self.totalCount = count
        })

        // 监听滚动事件
        //this.listTarget.addEventListener("scroll", this.handleScroll.bind(this))
    }


    async loadDiaryList(){
        if(this.offset >= this.totalCount){
            return
        }
        const limitation = new db.GetAllDiariesLimitParams({ Limit: this.limit, Offset: this.offset })
        try {
            const entries = await Query.GetAllDiariesLimit(limitation)
            for (let entry of entries) {
                this.createNewItem(entry)
            }
            this.offset += entries.length // 更新偏移量
        } catch (error) {
            console.error("加载日记列表失败:", error)
        }
    }

    // 加载更多数据
    async loadMoreDiaryList() {
        if (this.isLoading) return // 防止重复加载
        this.isLoading = true
        await this.loadDiaryList()
        this.isLoading = false
        this.listTarget.focus();
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
        //todo check platform
        return event.ctrlKey;
        switch (env.platform){
            case "darwin":
                return event.metaKey
            default:
                return event.ctrlKey
        }
    }

    focus(){
        this.listTarget.focus();
    }

    keydown(event){
        //search
        if((this.ctrlCmdKey(event)&& event.key  == 'k')){
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

        if(event.key=='Enter'){
            let diaryID = this.selectedItem.querySelector("span").dataset.id
            this.editorOutlet.loadDiary(diaryID)
            return
        }

        //open a new diary
        if((this.ctrlCmdKey(event)&& event.key  == 'o')){
            console.log('==============');
            Query.InsertDiaryRecord("").then((entry)=>{
                this.createNewItem(entry)
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

    createNewItem(entry){
        let newItem = this.itemTemplateTarget.content.cloneNode(true);
        this.setEntryElement(newItem, entry);
        this.insertItemToList(newItem, listInsertBeforeFirst);
        this.highlightItem(this.itemTargets[0]);
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
        if (this.selectedItem) {
            this.selectedItem.classList.remove(this.selectedClass)
        }
        item.classList.add(this.selectedClass)
        this.selectedItem = item
        item.scrollIntoView({ block: "nearest" }) // 始终将高亮 item 滚动到中间
    }

    moveUpOrDownItem(arrowDirection, currentItem) {
        let item
        if (arrowDirection === highlightUp) {
            item = currentItem.previousElementSibling
        } else if (arrowDirection === highlightDown) {
            item = currentItem.nextElementSibling
        }
        if (item) {
            this.highlightItem(item) // 滚动到中间
        }
    }

    async moveUpOrDownItem1(arrowDirection, currentItem) {
        let item
        if (arrowDirection === highlightUp) {
            item = currentItem.previousElementSibling
        } else if (arrowDirection === highlightDown) {
            item = currentItem.nextElementSibling
        }
        if (item) {
            if(this.itemIsInTop(item)){
                this.listTarget.scrollTop = 0;
            }else{
                item.scrollIntoView({block: "center" });
            }
            return this.highlightItem(item)
        }
    }

    itemIsInTop(item){
        for(let i = 0; i<4&&i<this.itemTargets.length; i++){
            if(item == this.itemTargets[i]){
                return true
            }
        }
        return false
    }

    updateItem(entry){
        let item = this.element.querySelector(`#item-${entry.ID}`).parentNode
        this.setEntryElement(item, entry);
    }
}
