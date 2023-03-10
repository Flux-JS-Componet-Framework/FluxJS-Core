import * as utility from "../libs/utility"
import * as Globals from "./globals"
import T_COMPONENT from "../interfaces/T_component"
import {getInterpolationReferences, reactiveBindingAlreadyTracked} from "../libs/utility";
import {EventTypes} from "../libs/directives";
import {directiveAttributes} from "../libs/directives";

/**
 * Detects elements that have an event attached to them and applies it accordingly
 */
export const OnEvents = (Component: T_COMPONENT) => {
    // check for events on the element
    EventTypes.forEach(event => {
        const Elements = Component.html.body.querySelectorAll(`[on${event}]`)
        for (let i = 0; i < Elements.length; i++) {
            const Element = Elements[i]
            const Attributes = Element.attributes

            // get function or script you are trying to run
            const method = Element.attributes[`on${event}`].value;
            const exposedData = Globals.get().exposedData

            // remove onclick attribute and replace with custom one
            Element.removeAttribute(`on${event}`);

            const fn = (args) => {
                // check if element was created by @FOR directive
                const dataProperty = (Attributes["data-property"])? Attributes["data-property"].value : null
                const key = (Attributes["data-key"])? Attributes["data-key"].value : null
                const alias = (Attributes["data-alias"])? Attributes["data-alias"].value: null

                if (dataProperty) {
                    const arrayMethodName = method.replace(`${alias}.`, "").split("(")[0]
                    if (exposedData[Component.id][dataProperty][key][arrayMethodName]) {
                        return exposedData[Component.id][dataProperty][key][arrayMethodName].call(exposedData[Component.id], args)
                    }
                    return
                }


                const functionName = method.split("(")[0]
                if (exposedData[Component.id][functionName]) {
                    return exposedData[Component.id][functionName].call(exposedData[Component.id], args)
                }
            }
            Element[`on${event}`] = fn
            Element.attributes[`on${event}`] = fn
        }
    })
}

export const collectReactiveElements = async (Component: T_COMPONENT) => {
    return new Promise(async (resolve: Function) => {
        // get all the elements in component and loop over them
        const Elements = Component.html.body.getElementsByTagName('*')
        for (let i = 0; i < Elements.length; i++) {
            // current element
            const Element = Elements[i]
            const isChildComponent = Globals.componentElementKeyExists(Element.localName)

            if ((Element.children.length === 0) && (!isChildComponent)) {
                // store all reactivity bindings found in element
                await utility.storeReactiveBindingsAndTheirElements(Component, Element)
            }
        }

        resolve()
    })
}
