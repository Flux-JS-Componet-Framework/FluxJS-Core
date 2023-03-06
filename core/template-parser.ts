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
        const reactivity = Globals.get().reactivity
        const Elements = Component.html.body.getElementsByTagName('*')
        for (let i = 0; i < Elements.length; i++) {
            const Element = Elements[i]
            const Bindings = await getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)
            const isChildComponent = Globals.componentElementKeyExists(Element.localName)

            // make sure Element has no children
            if ((Element.children.length === 0) && (!isChildComponent) && (Bindings.length > 0)) {
                Bindings.forEach((found, i) => {
                    // set a data attribute on element
                    Element.setAttribute("data-refferences", Bindings.length)
                    const isDirectiveBound = (Element.attributes.getNamedItem("data-property"))? true : false

                    // define defaults
                    found['Element'] = [Element]
                    found['rawHTML'] = Element.innerHTML
                    found['id'] = [Component.id]
                    found['type'] = (found.propertyName.indexOf('.') !== -1)? 'Object' : "Primitive"
                    found['isdirectiveBound'] = isDirectiveBound
                    found['bindings'] = Bindings.reduce((_acc, found) => {
                        _acc.push({
                            ...found,
                            refreshElement: true,
                        })

                        return _acc
                    }, [])

                    // check if the found binding already exists
                    const existing = reactivity[found.propertyName]
                    if (existing) {
                        // check if the current element is stored in existing binding
                        if (!existing['Element'].includes(Element)) {
                            existing['Element'].push(Element)
                            existing['id'].push(Component.id)
                        }
                        return
                    }
                    else {
                        // add the new-found binding
                        return reactivity[found.propertyName] = found
                    }
                })
            }
        }

        Globals.set("reactivity", reactivity)

        resolve(reactivity[Component.id])
    })
}
