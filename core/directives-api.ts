import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility"
import * as Globals from "./globals"
import {EventTypes} from "../libs/directives";

export const directiveIs_For = async (Element: Element, Component: T_COMPONENT): Promise<Element> => {
    return new Promise(async (resolve) => {
        // check if the element has the @for attribute
        if (Element.attributes && Element.attributes["@For"]) {
            const newElements: Array<Element> = []
            const keys = utility.getKeysFromForDirective(Element)
            const dataArray: Array<any> = Globals.get().exposedData[Component.id][keys.data]
            const Bindings = await utility.getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)

            // start the loop over the data array
            if (dataArray && dataArray.length > 0) dataArray.forEach((item, index) => {
                // starting string for new element
                let parsedElementString = ""

                // start replacing all found bindings
                if (Bindings.length > 0) Bindings.forEach(found => {
                    const Rgx = new RegExp(found.binding, "g")
                    const value = (found.propertyName.indexOf(".") !== -1)
                        ? utility.getNestedProperty(item, found.propertyName.replace(`${keys.alias}.`, ""))
                        : item

                    if (parsedElementString === "") parsedElementString = Element.outerHTML.replace(Rgx, value)
                    else parsedElementString = parsedElementString.replace(Rgx, value)
                })

                // convert string element to HTML
                const newElement = utility.convertTextToDocument(parsedElementString).body.firstChild

                newElements.push(newElement)
            })

            // check for events
            newElements.forEach((newElement, index) => {
                EventTypes.forEach(Event => {
                    // check if event exists on element
                    if (newElement.attributes[`on${Event}`]) {
                        // get function or script you are trying to run
                        const method = newElement.attributes[`on${Event}`].value
                            .replace(`${keys.alias}.`, `${keys.data}[${index}].`)

                        // remove onclick attribute and replace with custom one
                        newElement.setAttribute(`on${Event}`, method)
                    }
                })
            })

            // get index of template element
            const index = [...Element.parentElement.children].indexOf(Element);

            // insert generated elements at index in parent children
            
        }
        resolve(Element)
    })
}
