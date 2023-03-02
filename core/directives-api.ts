import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility"
import * as Globals from "./globals"
import {EventTypes} from "../libs/directives";

export const directiveIs_For = async (Element: Element, Component: T_COMPONENT): Promise<Element> => {
    return new Promise(async (resolve) => {
        // check if the element has the @for attribute
        if (Element.attributes && Element.attributes["@for"]) {
            const newElements: Array<Element> = []
            const keys = utility.getKeysFromForDirective(Element)
            const dataArray: Array<any> = Globals.get().exposedData[Component.id][keys.data]
            const Bindings = await utility.getInterpolationReferences(/{([^}]+)}/g, Element.outerHTML)

            // start the loop over the data array
            let parsedElementString = ""
            if (dataArray && dataArray.length > 0) dataArray.forEach((item, index) => {
                // starting string for new element
                // let parsedElementString = ""

                // start replacing all found bindings
                Bindings.forEach(found => {
                    const Rgx = new RegExp(found.binding, "g")
                    const value = (found.propertyName.indexOf(".") !== -1)
                        ? utility.getNestedProperty(item, found.propertyName.replace(`${keys.alias}.`, ""))
                        : item

                    if (parsedElementString === "") parsedElementString = Element.outerHTML.replace(Rgx, value)
                    else parsedElementString = parsedElementString.replace(Rgx, value)

                    found['id'] = Component.id
                })

                // if there are no bindings found set the parsedElementString up
                parsedElementString = Element.outerHTML

                // convert string element to HTML
                const newElement = utility.convertTextToDocument(parsedElementString).body.firstChild
                if (newElement) {
                    // remove @for attribute
                    newElement.removeAttribute('@for')

                    // if element has event on it define options for it
                    newElement.setAttribute(`data-property`, keys.data)
                    newElement.setAttribute(`data-alias`, keys.alias)
                    newElement.setAttribute(`data-key`, index)


                    newElements.push(newElement)
                }

                // reset
                parsedElementString = ""
            })

            // insert generated elements at index in parent children
            if (newElements.length > 0) Element.replaceWith(...newElements)
        }
        resolve(Element)
    })
}
