import T_GLOBALS from "../interfaces/T_globals";
import T_COMPONENT from "../interfaces/T_component";
import * as FluxJS from "../exports"

const Globals: T_GLOBALS = {
    root: null,
    onMounted: [],
    reactivity: {},
    exposedData: {},
    loaded_components: {},
    component_tree_queue: [],

    // @ts-ignore
    libraries: new Map([]),

    // all exports from @flux-js
    fluxJSExports: FluxJS
}

/**
 * Will return the globals object
 */
export const get = (key?: string): any => ((key !== undefined)? Globals[key] : Globals)

/**
 * Will add a property to the Globals object
 */
export const set = (globalName: string, globalValue: any) => Globals[globalName] = globalValue

/**
 * Will load a component into FluxJS
 */
export const loadComponent = (id: string, component: T_COMPONENT) => (Globals.loaded_components[id] = component)

/**
 * Will remove an (initializerName) from the queue
 */
export const removeFromTreeQueue = (name: string) => {
    Globals.component_tree_queue.forEach((initializerName: string, i: number) => {
        if (initializerName == name) Globals.component_tree_queue.splice(i, 1)
    })
    return Globals.component_tree_queue
}

/**
 * Will check if a component element key exists on a loaded component
 */
export const componentElementKeyExists = (element_key: string) => {
    let element_key_exists = false;
    const loaded_components = get('loaded_components')
    for (const componentId in loaded_components) {
        const component = loaded_components[componentId]
        if (component.element_key() == element_key) element_key_exists = true
    }
    return element_key_exists
}

/**
 * Will get a components data
 */
export const getComponentByName = (name: string): T_COMPONENT => {
    let component = null;
    for (const key in Globals.loaded_components) {
        if (Globals.loaded_components[key].name == name) component = Globals.loaded_components[key]
    }
    return component
}

/**
 * Will get a components data
 */
export const getComponentByKey = (element_key: string): T_COMPONENT => {
    let component = null;
    for (const i in Globals.loaded_components) {
        if (Globals.loaded_components[i].element_key() == element_key) component = Globals.loaded_components[i]
    }
    return component
}

/**
 * Will add properties to an existing component and then returns the updated component
 */
export const updateComponent = (id: string, propertiesToAdd: object): Promise<T_COMPONENT> => {
    return new Promise((resolve: Function) => {
        let component = null;
        for (const key in Globals['loaded_components']) {
            if (Globals.loaded_components[key].id == id) {
                component = Globals.loaded_components[key] = {...Globals.loaded_components[key], ...propertiesToAdd}
            }
        }
        resolve(component)
    })
}
