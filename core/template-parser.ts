import * as utility from "../libs/utility"
import * as Globals from "./globals"
import T_COMPONENT from "../interfaces/T_component"
import {getInterpolationReferences, reactiveBindingAlreadyTracked} from "../libs/utility";
import {EventTypes} from "../libs/directives";

/**
 * Detects elements that have an event attached to them and applies it accordingly
 */
export const OnEvents = (Component: T_COMPONENT) => {
    // check for events on the element
    EventTypes.forEach(event => {
        const Elements = Component.html.body.querySelectorAll(`[on${event}]`)
        for (let i = 0; i < Elements.length; i++) {
            const Element = Elements[i]

            // get function or script you are trying to run
            const method = Element.attributes[`on${event}`].value;
            const exposedData = Globals.get().exposedData

            // remove onclick attribute and replace with custom one
            Element.removeAttribute(`on${event}`);
            Element.setAttribute(`js-${event}`, method);

            Element[`on${event}`] = (args) => {
                const functionName = method.split("(")[0]
                if (exposedData[Component.id][functionName]) {
                    exposedData[Component.id][functionName].call(exposedData[Component.id], args)
                }
            }
        }
    })
}

export const collectReactiveElements = async (Component: T_COMPONENT) => {
    return new Promise(async (resolve: Function) => {
        // get all the elements in component and loop over them
        const reactivity = Globals.get().reactivity
        const Elements = Component.html.body.getElementsByTagName('*')
        for (let i = 0; i < Elements.length; i++) {
            const Element = Elements[i]
            const Bindings = await getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)
            const isChildComponent = Globals.componentElementKeyExists(Element.localName)

            // make sure Element has no children
            if ((Element.children.length === 0) && (!isChildComponent) && (Bindings.length > 0)) {
                Bindings.forEach((found, i) => {
                    // define defaults
                    found['Element'] = [Element]
                    found['rawHTML'] = Element.innerHTML
                    found['id'] = Component.id
                    found['bindings'] = Bindings.reduce((_acc, found) => {
                        _acc.push({
                            ...found,
                            refreshElement: true,
                        })

                        return _acc
                    }, [])

                    // set a data attribute on element
                    Element.setAttribute("data-refferences", Bindings.length)

                    // define name to store binding under
                    const split = found.propertyName.split(".")
                    const propertyName = (found.propertyName.indexOf('.') !== -1)? split[0] : found.propertyName

                    // check if the found binding already exists
                    const existing = reactivity[propertyName]
                    if (existing) {
                        // check if the current element is stored in existing binding
                        if (!existing['Element'].includes(Element)) existing['Element'].push(Element)
                        return
                    }
                    else {
                        // add the new-found binding
                        return reactivity[propertyName] = found
                    }
                })
            }
        }

        Globals.set("reactivity", reactivity)

        resolve(reactivity)
    })
}
