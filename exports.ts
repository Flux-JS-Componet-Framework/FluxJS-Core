// TYPES
import T_COMPONENT from "./interfaces/T_component"

// LIBRARIES
import * as utility from "./libs/utility"
import * as Globals from "./core/globals"
import * as SFT from "./core/single-file-template";
import { ActiveNode } from "./core/component-api"
import {Handler, Set} from "./core/observer";
import T_ROUTER from "./interfaces/T_router";
import { Router } from "./router/router";

// declare globals for TS
declare global {
    interface Window {
        Import: Function
        Globals: Object
    }
}

/**
 * Allows for multiple root components
 */
export const router = Router

/**
 * The start of every FluxJS application
 * @param Component can be an imported component or a router object
 */
export const createApp = async ( Component: T_COMPONENT | T_ROUTER, renderElement ) => {
    // set the render element
    Globals.set('renderElement', renderElement)

    // get url info
    const URL = utility.getCurrentURL()
    const PARAMS = utility.generateUrlParams(utility.getCurrentParams())

    // set url info
    Globals.set( "loadedURLParams" , {URL, PARAMS})

    // if router passed, get component based on url
    if (Component.isRouter) {
        const root = await Component.route(URL)
        return Globals.set( "root" , root)
    }

    return Globals.set( "root" , Component)
}

/**
 * Will fetch the contents from a component template file & caches it for the next request of that component
 * @param name name used for the component you are importing | used to search through existing components
 * @param url the url to import the component template from
 */
export const Component = async ( name: string, url?: string ): Promise<T_COMPONENT> => {
    return new Promise( async (resolve: Function) => {
        // check if the component name already exists
        const existing = Globals.getComponentByName(name)
        if (existing) return resolve(existing)

        // import the template file
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch contents from (${url})`)

        // convert to document for manipulation
        const _file_ = await response.text( )
        const Template = utility.convertTextToDocument( _file_ )

        // strip out the 3 elements
        const scripts = Template.getElementsByTagName("script")
        const script_text = (scripts.length !== 1)? scripts[1].innerHTML : scripts[0].innerHTML
        const template_text = Template.getElementsByTagName("template")[0].innerHTML
        const styles_text = Template.getElementsByTagName("style")[0].innerHTML

        // run the pre-fetch on the component to get its setup function
        const component_tree_queue = Globals.get('component_tree_queue');
        component_tree_queue.push(name)
        Globals.set('component_tree_queue', component_tree_queue)

        await SFT.runComponentScript(script_text, name)

        // define the root component under the globals
        // @ts-ignore
        let Component = new ActiveNode({
            name,
            script_text,
            template_text,
            styles_text,
            id: utility.getUniqueComponentId()
        })

        // Load Component
        Globals.loadComponent(Component.id, Component)

        //  return the component to it's parent
        resolve(Component)
    })
}

/**
 *
 * @param name the name of the template/component
 * @param mounted method to be called when template/component mounts
 * @constructor
 */
export const Setup = async (name: string, mounted: Function) => {
    // get all defined mounted functions
    const methods = Globals.get('onMounted')

    // save the new mounted function
    methods[name] = (context) => mounted(context)

    // save mounted methods
    Globals.set('onMounted', {...methods})

    // check to see if you are at the end of the component import tree
    const params = Globals.get().loadedURLParams.PARAMS
    if (Globals.removeFromTreeQueue(name).length == 0) await Globals.get('root').Mount(params, utility.getUniqueComponentId())

}

/**
 * Will take your property and convert it into a reactive property
 * @param property a primitive value | object
 * @constructor
 */
export const Reactive = (key: string, property: any | object) => {
    const checkForNestedObjectsAndMakeReactive = (data) => {
        for (const valueKey in data) {
            if (!(Array.isArray(data[valueKey])) && (typeof data[valueKey] === 'object')) {
                data[valueKey] = new Proxy(data[valueKey], Handler())
                checkForNestedObjectsAndMakeReactive(data[valueKey])
            }
        }
    };

    // if property is object
    if (!(Array.isArray(property)) && (typeof property === 'object')) {
        checkForNestedObjectsAndMakeReactive(property)

        const target = {
            object: {...property},
            name: key,
            type: 'Object',
        }

        // @ts-ignore
        return [target.object, (callback) => Set(target, undefined, callback(target.object))]
    }

    // if property is Array
    if (property.constructor === Array) {
        const target = {
            Array: property,
            name: key,
            type: 'Array',
        }
        // @ts-ignore
        return [property, (callback) => Set(target, undefined, callback(property))]
    }

    // if the property is a primative value
    const target = {
        value: property,
        name: key,
        type: 'Primative',
    }

    // @ts-ignore
    return [target.value, (callback) => Set(target, undefined, callback(target.value))]
}

/**
 * Will load a key value pair into @flux-js
 * @param propertyName the name you want to use to access the property
 * @param value the value you want to store fore use later
 * @constructor
 */
export const Use = (propertyName: string, value: any) => {
    // get all loaded libraries
    const library: Map = Globals.get().libraries

    // add new data to the list
    library.set(propertyName, value)
}

/**
 *
 * @param url the name of property you loaded into FluxJS
 * @constructor
 */
export const Import = (url: string) => {
    // decide where to look for package
    const containsSlash = (url.indexOf("/") !== -1)
    const isFluxPackage = (url.indexOf("@flux-js") !== -1)
    const rgx = new RegExp("/", "g")
    const parsed = url.replace(rgx, '.').replace('@flux-js.', '')

    // if user is looking for FluxJS export
    if (isFluxPackage) {
        // user wants spesific package
        if (containsSlash) {
            // check if exists
            if (!Globals.get().fluxJSExports[parsed]) return console.error(`Import Failed at -> Import(${url}) :: (${parsed}) does not exist as an export from FluxJS`)

            // return the package asked for
            return utility.getNestedProperty(Globals.get().fluxJSExports, parsed)
        }

        // return all exports from FluxJS
        return Globals.get().fluxJSExports
    }

    // check if the package has been loaded in
    const Library = Globals.get().libraries
    if (!Library.has(parsed)) return console.error(`Import Failed at -> Import(${url}) :: (${parsed}) has not been loaded into FluxJS with the Use() method`)

    // return the loaded property
    return Library.get(parsed)
}

window.Import = Import
window.Globals = Globals
