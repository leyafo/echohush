import { Controller } from "@hotwired/stimulus"
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import Quill from 'quill';

function getBlankCharIndex(i, quill){
    while (i > 0){
        if(quill.getText(i, 1).trim() == ''){
            break
        }
        i--;
    }

    //check multiple space
    let j = i-1
    while (j > 0){
        if(quill.getText(j, 1).trim() != ''){
            break
        }
        j--;
    }
    if(j!=i-1){
        return j;
    }
    return i;
}

function findWordStart(index, quill) {
    if (index <= 0) return 0; // If we're at or before the start, return 0

    const text = quill.getText(0, index + 1); // Get all text up to and including the current position
    let i = index;

    // Move backwards until we hit a space, newline, or punctuation
    while (i > 0 && !/\s|[\u2000-\u200a\u2028\u2029]|[.,\/#!$%\^&*;:{}=\-_`~()]/.test(text[i - 1])) {
        i--;
    }

    return i;
}

function findWordEnd(index, quill) {
    const length = quill.getLength() - 1; // -1 because getLength includes the newline at the end
    if (index >= length) return length; // If we're at or beyond the end, return the last position

    const text = quill.getText(index);
    let i = 0;

    // Move forward until we hit a space, newline, or punctuation
    while (i < text.length && !/\s|[\u2000-\u200a\u2028\u2029]|[.,\/#!$%\^&*;:{}=\-_`~()]/.test(text[i])) {
        i++;
    }

    return index + i;
}

const keyBindings = {
    bold:{
        key: 'b',
        ctrlKey: true,
        handler: function(range, context){
            if(range){
                const newPosition = range.index - 1;
                // Prevent moving before the start of the content
                if (newPosition >= 0) {
                    this.quill.setSelection(newPosition);
                }
            }
        }
    },

    // Undo (Ctrl+Z for Windows, Cmd+Z for Mac)
    undo: {
        key: 'z',
        shortKey: true,
        handler: function() {
            this.quill.history.undo();
        }
    },
    // Redo (Ctrl+Shift+Z for Windows, Cmd+Shift+Z for Mac)
    redo: {
        key: 'z',
        shortKey: true,
        shiftKey: true,
        handler: function() {
            this.quill.history.redo();
        }
    },
    // Move cursor to start of line (Ctrl+A for Windows, Cmd+A for Mac)
    moveToLineStart: {
        key: 'a',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                this.quill.setSelection(line[0].offset());
            }
        }
    },
    // Move cursor to end of line (Ctrl+E for Windows, Cmd+E for Mac)
    moveToLineEnd: {
        key: 'e',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                this.quill.setSelection(line[0].offset() + line[0].length() - 1);
            }
        }
    },
    // Move cursor forward one character (Ctrl+F for Windows, Cmd+F for Mac)
    moveForwardChar: {
        key: 'f',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                this.quill.setSelection(range.index + 1);
            }
        }
    },
    // Move cursor up one line (Ctrl+P for Windows, Cmd+P for Mac)
    moveUpLine: {
        key: 'p',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                const newIndex = Math.max(0, range.index - this.quill.getLine(range.index)[0].length());
                this.quill.setSelection(newIndex);
            }
        }
    },
    // Move cursor down one line (Ctrl+N for Windows, Cmd+N for Mac)
    moveDownLine: {
        key: 'n',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                const newIndex = Math.min(this.quill.getLength(), range.index + this.quill.getLine(range.index)[0].length());
                this.quill.setSelection(newIndex);
            }
        }
    },
    // Move cursor backward one word (Alt+B for Windows and Mac)
    moveBackwardWord: {
        key: 'b',
        altKey: true,
        handler: function(range) {
            if (range) {
                // Here you might need a function to determine word boundaries
                this.quill.setSelection(range.index - 1); // Placeholder, needs custom logic
            }
        }
    },
    // Move cursor forward one word (Alt+F for Windows and Mac)
    moveForwardWord: {
        key: 'f',
        altKey: true,
        handler: function(range) {
            if (range) {
                // Here you might need a function to determine word boundaries
                this.quill.setSelection(range.index + 1); // Placeholder, needs custom logic
            }
        }
    },
    // Move cursor to document start (Ctrl+Up Arrow for Windows, Cmd+Up Arrow for Mac)
    moveToDocStart: {
        key: 'ArrowUp',
        shortKey: true,
        handler: function() {
            this.quill.setSelection(0, 0);
        }
    },
    // Move cursor to document end (Ctrl+Down Arrow for Windows, Cmd+Down Arrow for Mac)
    moveToDocEnd: {
        key: 'ArrowDown',
        shortKey: true,
        handler: function() {
            this.quill.setSelection(this.quill.getLength() - 1, 0);
        }
    },
    // Select forward one character (Ctrl+Shift+F for Windows, Cmd+Shift+F for Mac)
    selectForwardChar: {
        key: ['f', 'F'],
        shortKey: true,
        shiftKey: true,
        handler: function(range) {
            if (range) {
                this.quill.setSelection(range.index, range.length + 1);
            }
        }
    },
    // Select backward one character (Ctrl+Shift+B for Windows, Cmd+Shift+B for Mac)
    selectBackwardChar: {
        key: ['b','B'],
        shortKey: true,
        shiftKey: true,
        handler: function(range) {
            if (range) {
                this.quill.setSelection(range.index - 1, range.length + 1);
            }
        }
    },
    // Select forward one word (Alt+Shift+F for Windows and Mac)
    selectForwardWord: {
        key: ['F','f'],
        altKey: true,
        shiftKey: true,
        handler: function(range) {
            if (range) {
                // Here you might need a function to determine word boundaries
                let newIndex = findWordEnd(range.index + range.length, this.quill);
                this.quill.setSelection(range.index, newIndex - range.index);
            }
        }
    },
    // Select to start of line (Ctrl+Shift+A for Windows, Cmd+Shift+A for Mac)
    selectToLineStart: {
        key: ['a', 'A'],
        shortKey: true,
        shiftKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                this.quill.setSelection(line[0].offset(), range.index - line[0].offset());
            }
        }
    },
    // Select to end of line (Ctrl+Shift+E for Windows, Cmd+Shift+E for Mac)
    selectToLineEnd: {
        key: ['e', 'E'],
        shortKey: true,
        shiftKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                const length = line[0].length() - (range.index - line[0].offset());
                this.quill.setSelection(range.index, length);
            }
        }
    },

    deleteBackCharacter: {
        key: 'h',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                // If there's a selection, delete it
                if (range.length > 0) {
                    this.quill.deleteText(range.index, range.length);
                } else if (range.index > 0) {
                    // If there's no selection, delete the character before the cursor
                    this.quill.deleteText(range.index - 1, 1);
                    this.quill.setSelection(range.index - 1, 0);
                }
            }
        }
    },
    // Delete word backward (Ctrl+W for Windows, Cmd+W for Mac)
    deleteWordBackward: {
        key: 'w',
        shortKey: true,
        handler: function(range) {
            if (range) {
                let start = findWordStart(range.index - 1, this.quill);
                this.quill.deleteText(start, range.index - start);
                this.quill.setSelection(start, 0);
            }
        }
    },
    // Delete word forward (Alt+D for Windows and Mac)
    deleteWordForward: {
        key: 'd',
        altKey: true,
        handler: function(range) {
            if (range) {
                let end = findWordEnd(range.index, this.quill);
                this.quill.deleteText(range.index, end - range.index);
            }
        }
    },

    deleteWordForward: {
        key: 'd',
        ctrlKey: true,
        handler: function(range) {
            if (range) {
                this.quill.deleteText(range.index, 1);
            }
        }
    },
    // Delete to start of line (Ctrl+U for Windows, Cmd+U for Mac)
    underline: {
        key: 'u',
        shortKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                const deleteLength = range.index - line[0].offset();
                this.quill.deleteText(line[0].offset(), deleteLength);
                this.quill.setSelection(line[0].offset(), 0);
            }
        }
    },
    // Delete to end of line (Ctrl+K for Windows, Cmd+K for Mac)
    deleteToLineEnd: {
        key: 'k',
        shortKey: true,
        handler: function(range) {
            if (range) {
                const line = this.quill.getLine(range.index);
                const deleteLength = line[0].length() - (range.index - line[0].offset());
                this.quill.deleteText(range.index, deleteLength);
            }
        }
    }
}

export default class extends Controller {
    static targets = ['container', 'tagContainer', 'tagTemplate']

    removeTag(e){
        let parent = e.target.parentElement
        this.tags=this.tags.filter(function(item) {
            return item !== parent.querySelector('.tag').textContent
        })
        e.target.parentElement.remove()
    }

    tagInput(e){
        let input = e.target;
        if(e.key == 'Enter'){
            let value = input.value;
            let isRepeatTag = false
            this.tags.forEach(function(tag){
                if(value == tag){
                    isRepeatTag = true
                }
            })
            if(!isRepeatTag){
                let newTag = this.tagTemplateTarget.content.cloneNode(true);
                newTag.querySelector(".tag").textContent = value;
                this.tagContainerTarget.insertBefore(newTag, input);
                this.tags.push(value);
            }
            input.value=''
        }
    }

    connect(){
        this.tags = []
        this.quill = new Quill(this.containerTarget, {
            theme: 'snow',
            modules: {
                toolbar: '#toolbar',
                keyboard: {
                    bindings: keyBindings
                }
            }
        });
    }
}
