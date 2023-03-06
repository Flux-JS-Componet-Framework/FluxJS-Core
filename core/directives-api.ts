import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility"
import * as Globals from "./globals"
import {EventTypes} from "../libs/directives";
import { HydrateDOM } from "./single-file-template";
import {getInterpolationReferences} from "../libs/utility";

export const directiveIs_For = async (Element: Element, Component: T_COMPONENT): Promise<Element> => {
    return new Promise(async (resolve) => {
        // check if the element has the @for attribute
        if (Element.attributes && Element.attributes["@for"]) {
            const Directives = Globals.get().directives
            const keys = utility.getKeysFromForDirective(Element)
            const dataArray: Array<any> = Globals.get().exposedData[Component.id][keys.data]
            const Bindings = await utility.getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)
            const newElements: Array<Element> = generateElementsToBeRendered(dataArray, Bindings, keys, Element)
            const isChildComponent = Globals.componentElementKeyExists(Element.localName)

            // insert generated elements at index in parent children
            if (newElements.length > 0) Element.replaceWith(...newElements)

            // directives need to be stored separately to reactivity
            const newBinding = {}
            newBinding['id'] = Component.id
            newBinding['Element'] = [...newElements]
            newBinding['type'] = "@for"
            newBinding['Array'] = dataArray
            newBinding['keys'] = keys

            // setup raw HTML for element
            const newPossibleChild = Object.assign({}, Globals.getComponentByKey(Element.localName))
            Element.innerHTML = newPossibleChild.template_text()
            newBinding['rawHTML'] = Element.outerHTML

            // setup the bindings
            const newElementBindings = await utility.getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)
            newBinding['Bindings'] = newElementBindings

            // save the new directive
            Directives[keys.data] = newBinding
        }
        resolve(Element)
    })
}

export const updateForDirective = async (Binding, propertyName) => {
    const Reactivity = Globals.get().reactivity
    const Directives = Globals.get().directives
    const elements = document.querySelectorAll(`[data-property=${propertyName}]`)
    for (let i = 0; i < elements.length; i++) {
        const Element = elements[i]
        const dataKey = Element.attributes['data-key']
        const dataArray = Globals.get().exposedData[Binding.id][propertyName]
        const Bindings = await utility.getInterpolationReferences(/{([^}]+)}/g, Binding.rawHTML)

        // remove all elements that aren't the first key
        if (+dataKey.value !== 0) Element.remove()
        else {
            // make sure the Element array length matches the amount of items in array
            const newElements: Array<Element> = generateElementsToBeRendered(
                dataArray,
                Binding.Bindings,
                Binding.keys,
                utility.convertTextToDocument(Binding.rawHTML).body.firstChild
            )

            // replace old element with new
            Element.replaceWith(...newElements)

             // update directive binding with new elements array
            Directives[propertyName].Element = newElements

            // update reactive binding's Element property with newly generated elements
            const newReactivityElements = await updateReactiveElementsInBinding(Binding.rawHTML, Reactivity[propertyName].Element)
            debugger

            Reactivity[propertyName].Element = newReactivityElements

            // run hydration for reactive elements
            for (const i in Bindings) {
                const found = Reactivity[Bindings[i].propertyName]
                await HydrateDOM(found)
            }
        }
    }
}

const generateElementsToBeRendered = (dataArray, Bindings, keys, Element): Array<Element> => {
    // generated elements
    const newElements: Array<Element> = []

    // starting string for new element
    let parsedElementString = ""

    // start the loop over the data array
    if (dataArray && dataArray.length > 0) dataArray.forEach((item, index) => {
        // start replacing all found bindings

        Bindings.forEach(found => {
            const Rgx = new RegExp(found.binding, "g")
            const property = found.propertyName.replace(`${keys.alias}.`, "")
            const value = (found.propertyName.indexOf(".") !== -1)
                ? utility.getNestedProperty(item, property)
                : item

            if (parsedElementString === "") parsedElementString = Element.outerHTML.replace(Rgx, value)
            else parsedElementString = parsedElementString.replace(Rgx, value)
        })

        // if there are no bindings found set the parsedElementString up
        if (Bindings.length === 0) parsedElementString = Element.outerHTML

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


            newElements.push(newElement)
        }

        // reset
        parsedElementString = ""
    })

    return newElements
}

export const updateReactiveElementsInBinding = async (String: string, BindingElements) => {
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
            // check if the current element is stored in existing binding
            const existing = BindingElements
            const index = existing.Element.some((element) => element === Element)
            // if (!existingElements.includes(Element)) {
            //     existing.Element = [...existing.Element, Element]
            // }
        })
        // start building up list of reactive elements
        // if ((Element.children.length === 0) && (!isChildComponent)) {
        //     Bindings.forEach(Binding => {
        //         // start building up data for binding
        //         // Binding["Element"] = [Element]
        //
        //         // check if the current element is stored in existing binding
        //         const existing = Globals.get().reactivity[Binding.propertyName]
        //         const existingElements = existing.Element
        //         if (!existing.Element.includes(Element)) {
        //             existing.Element = [...existing.Element, Element]
        //         }
        //     })
        //     console.log(Globals.get().reactivity)
        //     debugger
        // }
    }
}
