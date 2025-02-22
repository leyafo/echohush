import {css, html, LitElement} from 'lit'
import logo from './assets/images/logo-universal.png'
import {Greet} from "../wailsjs/go/main/App";
import './style.css';


export class Search extends LitElement {
    constructor() {
        super()
        this.resultText = "Please enter your name below 👇"
    }
    render(){
        return html `
<div class="">
</div>
        `
    }
}
