import './style.css';

import {Application} from "@hotwired/stimulus";

window.Stimulus = Application.start()
let initialized_controllers = new Set()
function initStimulus(imports, options = {}) {
    for (const path in imports) {

        const p = path.split('/')
        const tn = p[p.length - 1]

        // build tagName

        const tagName = tn.match(/^[\s\S]+(?=-controller.js)/)[0]

        if (options.debug) {
            console.debug('STIMULUS IDENTIFIER «' + tagName + '» from: ' + path)
        }

        // check
        if (initialized_controllers.has(tagName)) {
            const err = "NAMING CONFLICT STIMULUS\nDouble identifier: «" + tagName + "»\n\nfrom:\n" + path
            console.error(err)
            alert(err)
        } else {
            initialized_controllers.add(tagName)
        }

        const app = imports[path].default;
        Stimulus.register(tagName, app)
    }
}

const controllers = import.meta.glob('./controllers/*-controller.js', { eager: true})
initStimulus(controllers, { debug: true})
