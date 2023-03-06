import * as Globals from "../core/globals";
import T_COMPONENT from "../interfaces/T_component";
import {elementInterpolation} from "../core/template-parser";

/**
 * Checks if a property is nested
 */
export const isNestedProperty = (property: string): boolean => (property.indexOf('.') > -1)

/**
 * Creates a DOM Object from an HTML string
 */
export const convertTextToDocument = (text: string): Document => {
    const parser = new DOMParser()
    return parser.parseFromString(text, 'text/html')
}

/**
 * Will generate a random string
 */
export const randomString = (length: number, uppercase: boolean = false) => {
    const values = { result: '', chars: '' }

    if (uppercase) values.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    else values.chars = 'abcdefghijklmnopqrstuvwxyz0123456789'

    for (let i = 0; i < length; i++) {
        values.result += values.chars.charAt(Math.floor(Math.random() * values.chars.length))
    }

    return values.result
}

export const existsIn = (key: (string | void), object: object) => {
    for (const _key in object) {
        if (_key == key) return false
    }
    return true
}

export const getUniqueComponentId = (): string => {
    const generate = (tries: number): string => {
        let id = randomString(16)
        if (!existsIn(id, Globals.get('loaded_components'))) {
            tries++
            generate(tries)
        }
        return id
    }

    return generate(0)
}

/**
* Looks through the params passed and checks if they are in the VM or static
* @param {Array} unFormattedParams
*/
export const formatFunctionParams = (unFormattedParams:Array<string>) => {
   const builtParams = [];
   unFormattedParams.forEach(param => {
       // if param is a VM property
       let value
       if (param.indexOf('this') === -1) {
           value = getNestedProperty(Features.VM, param);
       }

       const checkForNumbers = (data, isVMProp) => {
           if (isNaN(Number(data))) {
               builtParams.push({
                   isVMProp,
                   value: data,
                   original: param
               });

           }
           else {
               builtParams.push({
                   isVMProp,
                   value: data,
                   original: param
               });
           }
       };

       // check if a value from the VM was retrieved
       if (value !== undefined) {
           checkForNumbers(value, true);
       }
       else {
           checkForNumbers(param, false);
       }

   });

   return builtParams;
}

/**
 * Will retrieve a property out of a deeply nested object
 */
export const getNestedProperty = (object:object, string:string):any => {

    let schema = object;  // a moving reference to internal objects within obj
    let pList = string.replace(' ', '').split('.');
    let len = pList.length;
    for (let i = 0; i < len - 1; i++) {
        let elem = pList[i];
        // if (!schema[elem]) schema[elem] = {}
        schema = schema[elem];
    }

    if (schema[pList[len - 1]] !== undefined) {
        return schema[pList[len - 1]];
    }
    else {
        return schema[pList[len - 1]];
    }
}

/**
 * Will set a property on an object
 */
export const setNestedProperty = (object:object, string:string, value: any):void => {
    let schema = object;  // a moving reference to internal objects within obj
    let pList = string.split('.');
    let len = pList.length;
    for (let i = 0; i < len - 1; i++) {
        let elem = pList[i];
        if (!schema[elem]) schema[elem] = {}
        schema = schema[elem];
    }

    if (schema[pList[len - 1]] !== undefined) {
        schema[pList[len - 1]] = value;
    }
}

/**
 * Will search through a string for rgx expression match and return all matches in string
 */
export const getInterpolationReferences = async (rgx:RegExp, String: string): Promise<Array> => {
    return new Promise((resolve) => {
        let varMatch
        const foundReferences:Array<Object> = []
        const foundReferenceskeys:Array<Object> = []

        while( varMatch = rgx.exec( String ) ) {
            // add new reference
            if (!foundReferenceskeys.includes(varMatch[0])) foundReferences.push({
                Element: null,
                binding: varMatch[0],
                index: varMatch.index,
                propertyName: varMatch[1].replace(/ /g, "")
            })

            foundReferenceskeys.push(varMatch[0])
        }

        resolve(foundReferences)
    })
}

/**
 * Will create a valid name for a component
 */
export const getElementKey = (name: string) => `${name.toLowerCase()}`

/**
 * Will check if a component has children
 */
export const componentHasChildren = (Component: T_COMPONENT):boolean => (Component.children.length > 0)

/**
 *  Checks if an object is empty
 */
export const isObjectEmpty = (obj):boolean => (obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype)

/**
 * update child with the parent reference
 */
export const setParentOnChildren = (children: Array<T_COMPONENT>, parent: T_COMPONENT) => new Promise((resolve: Function) => {
    children.forEach(async child => await Globals.updateComponent( child.id, { parent: () => Globals.getComponentByName(parent.name) }))
    console.log("Parent set on children", Globals.getComponentByName(child.name));
    resolve()
})

/**
 * Will check if a child is the root component
 */
export const childrenContainsRootComponent = (children: Array<T_COMPONENT>): boolean => {
    let childIsRoot:boolean = false
    const root = children.filter((child): T_COMPONENT => {
        if (child.id == Globals.get('root').id) {
            childIsRoot = true
            return child
        }
    })[0]

    if (childIsRoot) {
        const error = new Error()
        error.message = `Cannot import the root component (${Globals.get('root').name}) into a child of the root (${root.parent()})`
        error.name = `Failed importing (${root.name})`
        throw error
    }
    return childIsRoot
}

export const getChildPropsFromElement = async (Element: Element, Self: T_COMPONENT): object => {
    const Props = {}
    for (let i = 0; i < Element.attributes.length; i++) {
        const attribute = Element.attributes[i]
        const propertyName = attribute.name.replace("#", "")

        if (attribute.name.indexOf('#') !== -1) {
            // define the value
            let propValue = null

            // remove the hashtag from attribute name
            const parsedAttribute = attribute.name.replace("#", "")
            const attributeSplit = parsedAttribute.split('.')

            // check for any interpolation in attribute value
            const exposedData =  Globals.get('exposedData')
            const Bindings = await getInterpolationReferences(/{([^}]+)}/g, attribute.value)
            if (Bindings.length > 0) {
                Bindings.forEach(found => {
                    // check if attribute uses binding
                    const usesBinding = (attribute.value.indexOf(found.binding) !== -1)

                    // check if there is no value for the attribute
                    const value = exposedData[Self.id][found.propertyName]
                    if (attribute.value === "" && usesBinding) propValue = value
                    else if (usesBinding) attribute.value = value
                })
            }
            else {
                // check if (parsedAttribute) is nested
                if (parsedAttribute.indexOf('.') !== -1) {
                    // check if element was created by @FOR directive
                    const Array = (Element.attributes["data-property"])? Element.attributes["data-property"].value : null
                    const key = (Element.attributes["data-key"])? Element.attributes["data-key"].value : null
                    const property = attributeSplit[attributeSplit.length -1]

                    if (Array) {
                        propValue = exposedData[Self.id][Array][key][property]
                    }
                    else propValue = getNestedProperty(exposedData[Self.id], parsedAttribute)
                }
                else {
                    // check if there is no value for the attribute
                    const value = exposedData[Self.id][parsedAttribute]
                    if (attribute.value === "") propValue = value
                }
            }

            if (attribute.value === "") Props[attributeSplit[attributeSplit.length -1]] = propValue
            else Props[propertyName] = attribute.value
        }
    }

    return Props
}

export const reactiveBindingAlreadyTracked = (reference) => {
    const found = Globals.get().reactivity.filter(existing => {
        if (existing.propertyName === reference.propertyName) return existing
    })

    if (found.length > 0) return found[0]
}

export const getRefsFromElement = (Component: T_COMPONENT, Element: Element) => {
    const allRefs = Globals.get().refs
    const Ref = Element.attributes.getNamedItem("#ref")
    if (Ref) {
        // check if refs exist already
        if (allRefs[Component.id]) allRefs[Component.id][Ref.value] = Element
        else {
            allRefs[Component.id] = {}
            allRefs[Component.id][Ref.value] = Element
        }
    }

    Globals.set('refs', allRefs)
}

/**
 * Gets the url requested
 * @returns {String}
 */
export const getCurrentURL = () => window.location.pathname

/**
 * Will get a list of the requested params in the url
 * @param { Array | false } toAdd
 * @returns {[String]}
 */
export const getCurrentParams = () => {
    const url = new URL(window.location.href)
    return decodeURIComponent(url.search).replace("?", "").split(",")
}

/**
 * Will create an object based off of an array of params
 * @param {Array} RAW_PARAMS
 * @returns {Object}
 */
export const generateUrlParams = (RAW_PARAMS) => {
    let dataForRoute = {};
    if (RAW_PARAMS[0] !== "" && RAW_PARAMS[0] !== "undefined") {
        RAW_PARAMS.forEach((param, index) => {
            let paramKey = param.split("=")[0];
            let paramData = param.split("=")[1];
            if (paramData.includes("true") || paramData.includes("false")) {
                if (paramData.includes("true")) {
                    dataForRoute[paramKey] = Boolean(paramData);
                } else {
                    dataForRoute[paramKey] = Boolean(!paramData);
                }
            } else {
                if (isNaN(Number(paramData))) {
                    dataForRoute[paramKey] = paramData;
                } else if (!isNaN(Number(paramData))) {
                    dataForRoute[paramKey] = Number(paramData);
                } else {
                    dataForRoute[paramKey] = paramData;
                }
            }
        });
    }

    return dataForRoute;
}

export const getKeysFromForDirective = (Element: Element): { alias: string, data: string } => {
    const attribute = Element.attributes["@For"]
    const split = attribute.value.split("in")
    const exposedArray = split[1].replace(/ /g, "")
    const helpers = split[0].replace(/ /g, "")
    return {
        alias: helpers,
        data: exposedArray
    }
}
