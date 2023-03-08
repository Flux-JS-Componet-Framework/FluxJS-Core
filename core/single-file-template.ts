import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility"
import {directives} from "../libs/directives"
import {elementInterpolation} from "./template-parser"
import * as Globals from "./globals"
import {Component} from "../exports";
import {directiveIs_For} from "./directives-api";

/**
 * Adds a component script element to the DOM to run
 * and then removes it after
 */
export const runComponentScript = (script_text: string, name: string): Promise<void> => {
    return new Promise((resolve: Function): void => {
        // create the script that will be populated with the passed JS string
        const newScript = document.createElement("script")
        newScript.type = 'module'
        newScript.id = utility.randomString(4)

        // create text node of the JS string and append it to the created script
        const text_node = document.createTextNode(script_text)
        newScript.appendChild(text_node)

        // run the script
        document.body.appendChild(newScript)

        // delete create script
        document.getElementById(newScript.id)?.remove()

        // finish script run
        resolve()
    })
}


/**
 * Will combined all the styles and HTML into a single element
 * & searches through the template HTML for any directives and the replaces them with the value
 */
export const prepareTemplate = async (Component: T_COMPONENT) => {
    return new Promise(async (resolve: Function) => {
        // create a wrapper to encapsulate the component 'template' & 'styles'
        let wrapper = document.createElement("div")
        wrapper.id = Component.name

        // create the style tag and add the tag to the wrapper element
        let style = document.createElement("style")
        style.innerHTML = Component.styles_text()
        wrapper.prepend(style)
        wrapper.append(
            utility.convertTextToDocument(
                Component.template_text()
            ).body
        )

        Component.html = utility.convertTextToDocument(wrapper.innerHTML)

        resolve(Component)
    })
}

/**
 * Searches through a document for existing directives and replaces them with valid
 * directive attributes
 */
export const searchTemplateForDirectives = async (Component: T_COMPONENT): Promise<void> => {
    const _Elements = Component.html.getElementsByTagName('*')
    return new Promise((resolve: Function) => {
        for (const key in _Elements) {
            const element = _Elements[key]
            for (const directive in directives) {
                if (element.attributes && element.attributes[directive]) {
                    element.removeAttribute(directive)
                    debugger
                    element.setAttribute(directives[directive], element.attributes[directive].value);
                }
            }
        }
        resolve(Component)
    })
}

/**
 * Will search through component template and insert any child component uses
 * @param Self
 */
export const mountChildrenComponents = async (Self: T_COMPONENT) => {
    return new Promise(async (resolve: Function) => {
        // get all the elements in component
        const Elements = Self.html.body.getElementsByTagName('*')

        // start looking through all elements in component
        const childrenFound = []
        for (let i = 0; i < Elements.length; i++) {
            const element = Elements[i]

            // get interpolation from html template
            if (
                element.localName !== 'style' &&
                element.localName !== 'code' &&
                (!element.localName?.includes('script'))
            ) {
                // tell system if you are dealing with a child component inside a parent template
                const isChildComponent = Globals.componentElementKeyExists(element.localName)

                // get the global component reference
                let newPossibleChild = Object.assign({}, Globals.getComponentByKey(element.localName))

                // check if the element is a child component
                if (isChildComponent) {
                    // add newly created child to parents (Self) children
                    newPossibleChild.id = utility.getUniqueComponentId()
                    Self.children.push(newPossibleChild)

                    // get the child from parent array
                    let Child = Self.getChildById(newPossibleChild.id)[0]

                    // initialize child passing any props passed in registered
                    const Props = await utility.getChildPropsFromElement(element, Self)

                    // save child initializations
                    childrenFound.push(async () => {

                        // mount the child component
                        Child = await Child.Mount(Props, Child.id)

                        // check for slot data
                        const childSlotElement = Child.html.body.getElementsByTagName('slot')
                        if (childSlotElement.length > 0) {
                            // setup the slot data
                            Child.slotData = utility.convertTextToDocument(element.innerHTML).body

                            // replace slot element with defined slot data
                            childSlotElement[0].replaceWith(Child.slotData)
                        }

                        // check to see if the element has the @for directive
                        if (element.attributes['data-property']) return

                        // clear out component element
                        element.innerHTML = ""

                        // add the child template to the use case in parent template
                        element.appendChild(Child.html.body.firstChild)
                    })
                }
            }
        }

        // mount every child found in template
        for (const i in childrenFound) {
            await childrenFound[i]()
        }

        resolve()
    })
}

/**
 *
 */
export const HydrateDOM = (reference) => {
    return new Promise((resolve) => {
        const exposedData =  Globals.get('exposedData')
        const Rgx = new RegExp(reference.binding, "g")
        const isNestedPropterty = (reference.propertyName.indexOf('.') !== -1)

        const replacePrimitive = (property, Element, Rgx) => {
            // replace
            Element.innerHTML = Element.innerHTML.replace(Rgx, property)
        }

        const replaceObject = (property, Element, Rgx) => {
            debugger
            // check to see if the object is a reactive property
            if (reference.isReactive) {
                if (reference.type === 'Primitive') {
                    replacePrimitive(
                        property.value,
                        Element,
                        Rgx
                    )
                }

                if (reference.type === 'Object') {
                    // define name to store binding under
                    const split = reference.propertyName.split(".")
                    const propertyName = (reference.propertyName.indexOf('.') !== -1)? split[split.length -1] : reference.propertyName

                    replacePrimitive(
                        property[propertyName],
                        Element,
                        Rgx
                    )
                }
            }

        }

        if (reference.Element) reference.Element.forEach((Element, index) => {
            // define regex for binding
            let value = null

            // get the property from exposed data
            const ID = reference.id[index]
            const property = (!isNestedPropterty)? exposedData[ID][reference.propertyName] : utility.getNestedProperty(exposedData[ID], reference.propertyName)

            // start updating placeholders with values
            switch (reference.type) {
                case 'Primitive': return replacePrimitive(property, Element, Rgx)
                case 'Object': return replacePrimitive(property, Element, Rgx)
                // case 'Array': return replaceArray(property, Element, Rgx)
            }
        })
        resolve()
    })
}


export const manageBindingsForDirectives = async (Component: T_COMPONENT): Promise => {
    return new Promise(async (resolve: Function) => {
        // get all the elements in component
        const Elements = Component.html.body.getElementsByTagName('*')
        for (let i = 0; i < Elements.length; i++) {
            // current element
            let Element = Elements[i]

            // check for the (For) directive on the element
            Element = await directiveIs_For(Element, Component)
        }

        resolve()
    })
}
