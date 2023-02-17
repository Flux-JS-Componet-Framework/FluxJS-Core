import { HydrateDOM } from "./single-file-template";
import * as Globals from "./globals";
import * as SFT from "./single-file-template";

export const Get = (target: object, key: string) => target[key]


export const deleteProperty = (target: object, key: string) => Reflect.deleteProperty(target, key)


export const Set = async (target: object, key: string, value: any) => {
    // update the target (key) with new value
    Reflect.set(target, key, value)

    // get binding for reactive property
    const binding = Globals.get().reactivity[target["name"]]

    // start updating exposed data and DOM
    if (binding && Globals.get("RenderProcessStarted") === false) {
        // make sure to update exposed data with new target
        Globals.get().exposedData[binding.id][target["name"]] = target

        // updated all elements in binding to have the RAW value at render
        for (const i in binding.bindings) {
            const found = binding.bindings[i]
            if (found.refreshElement && found.Element) found.Element.forEach(element => element.innerHTML = found.rawHTML)
        }

        // hydrate
        for (const i in binding.bindings) {
            const found = binding.bindings[i]
            await SFT.HydrateDOM(found)
        }
    }
}

/**
 * The handler for the core reactivity
 * @constructor
 */
export const Handler = () => ({get: Get, set: Set, deleteProperty})
