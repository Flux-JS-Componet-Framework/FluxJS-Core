import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility"
import * as Globals from "./globals"
import {EventTypes} from "../libs/directives";
import { HydrateDOM } from "./single-file-template";
import {getInterpolationReferences} from "../libs/utility";
import { OnEvents } from "./template-parser";
import * as SFT from "./single-file-template";
import {getMountingMethodForChild} from "@flux-js/core/libs/utility";

export const directiveIs_For = async (Element: Element, Component: T_COMPONENT): Promise<Element> => {
    return new Promise(async (resolve) => {
        // check if the element has the @for attribute
        if (Element.attributes && Element.attributes["@for"]) {
            const Directives = Globals.get().directives
            const keys = utility.getKeysFromForDirective(Element)
            const dataArray: Array<any> = Globals.get().exposedData[Component.id][keys.data]
            const isChildComponent = Globals.componentElementKeyExists(Element.localName)
            let Child = Object.assign({}, Globals.getComponentByKey(Element.localName))

            // start the new directive binding
            const newBinding = {}

            // setup raw HTML for element
            const childrenToMount = []
            if (isChildComponent) {
                Element.innerHTML = Child.template_text()
                newBinding['rawHTML'] = Element.outerHTML
            }

            // generate elements
            const Bindings = await utility.getInterpolationReferences(/{([^}]+)}/g, newBinding['rawHTML'])
            const newElements: Array<Element> = await generateElementsToBeRendered(dataArray, Bindings, keys, Element.outerHTML, Component)

            // insert generated elements at index in parent children
            if (newElements.length > 0) Element.replaceWith(...newElements)

            for (let i = 0; i < newElements.length; i++) {
                const generatedElement = newElements[i]
                const Mount = await utility.getMountingMethodForChild(generatedElement, Component, Child)
                Mount()
            }

            newBinding['Element'] = [...newElements]
            newBinding['type'] = "@for"
            newBinding['id'] = Component.id
            newBinding['keys'] = keys
            newBinding['bindings'] = Bindings

            // save the new directive
            Directives[keys.data] = newBinding
        }
        resolve(Element)
    })
}

export const updateForDirective = async (Binding, propertyName) => {
    const Directives = Globals.get().directives
    const elements = document.querySelectorAll(`[data-property=${propertyName}]`)
    for (let i = 0; i < elements.length; i++) {
        const Element = elements[i]
        const dataKey = Element.attributes['data-key']
        const componentID = Element.attributes['data-id']
        const dataArray = Globals.get().exposedData[Binding.id][propertyName]

        // remove all elements that aren't the first key
        if (+dataKey.value !== 0) Element.remove()
        else {
            // make sure the Element array length matches the amount of items in array
            const newElements: Array<Element> = await generateElementsToBeRendered(
                dataArray,
                Binding.bindings,
                Binding.keys,
                Binding.rawHTML,
                {id: componentID}
            )

            // replace old element with new
            Element.replaceWith(...newElements)
        }
    }
}

const generateElementsToBeRendered = async (dataArray, Bindings, keys, String, Component: T_COMPONENT): Array<Element> => {
    // generated elements
    const newElements: Array<Element> = []

    // starting string for new element
    let parsedElementString = ""

    // start the loop over the data array
    if (dataArray && dataArray.length > 0) dataArray.forEach( async (item, index) => {
        /**
         * hydrates the element if there are any bindings
         * found directly on the element
         */
        Bindings.forEach(found => {
            const Rgx = new RegExp(found.binding, "g")
            const property = found.propertyName.replace(`${keys.alias}.`, "")
            const value = (found.propertyName.indexOf(".") === -1)
                ? item[found.propertyName]
                : utility.getNestedProperty(item, property)

            if (parsedElementString === "") parsedElementString = String.replace(Rgx, value)
            else parsedElementString = parsedElementString.replace(Rgx, value)
        })

        // if there are no bindings found set the parsedElementString updebugger
        if (Bindings.length === 0) parsedElementString = String

        // convert string element to HTML
        const newElement = utility.convertTextToDocument(parsedElementString).body.firstChild
        if (newElement) {
            // remove @for attribute
            // @ts-ignore
            newElement.removeAttribute('@for')

            // if element has event on it define options for it
            // @ts-ignore
            newElement.setAttribute(`data-property`, keys.data)
            // @ts-ignore
            newElement.setAttribute(`data-alias`, keys.alias)
            // @ts-ignore
            newElement.setAttribute(`data-key`, index)
            newElement.setAttribute(`data-id`, Component.id)

            const isChildComponent = Globals.componentElementKeyExists(newElement.localName)
            let Child = Object.assign({}, Globals.getComponentByKey(newElement.localName))
            if (isChildComponent) {
                const Mount = await utility.getMountingMethodForChild(newElement, Component, Child)
                Mount()
            }

            // add events
            // @ts-ignore
            await OnEvents({
                id: Component.id,
                html: utility.convertTextToDocument(newElement.innerHTML)
            })

            newElements.push(newElement)
        }

        // reset
        parsedElementString = ""
    })

    return newElements
}

export const updateReactiveElementsInBinding = async (String: string) => {
    const Reactivity = Globals.get().reactivity
    const Document = utility.convertTextToDocument(String)
    const Elements = Document.body.getElementsByTagName('*')

    // start looping over all elements
    const newBindings = []
    for (let i = 0; i < Elements.length; i++) {
        // current element
        const Element = Elements[i]

        // tell system if you are dealing with a child component inside a parent template
        // const isChildComponent = Globals.componentElementKeyExists(Element.localName)

        // collect all bindings
        const Bindings = await getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)
        Bindings.forEach(Binding => {

            // check for the existing binding holding the elements to be updated
            const Existing = Reactivity[Binding.propertyName]
            if (Existing) {
                // start removing all elements from binding that were to do with the @for directive
                debugger
                Existing.Element.forEach(existingElement => {
                    const attributes = existingElement.attributes
                    if (attributes['data-property']) {
                        console.log(existingElement)
                        debugger
                    }
                })
            }
        })
    }
}
