import { HydrateDOM } from "./single-file-template";
import * as directivesAPI from "./directives-api";
import * as Globals from "./globals";
import * as SFT from "./single-file-template";

export const Get = (target: object, key: string) => target[key]


export const deleteProperty = (target: object, key: string) => Reflect.deleteProperty(target, key)


export const Set = async (target: object, key: string, value: any) => {
    // start updating exposed data and DOM
    if (Globals.get("RenderProcessStarted") === false) {
        // hydrates
        if (target.type !== 'Array') await reactivityHydration(target, key, value)

        // hydrate directives using array
        if (target.type === 'Array') await directivesHydration(target, key, value)
    }
}

/**
 * Handles the hydration for all reactive properties
 * @param target
 */
export const reactivityHydration = async (target, key, value) => {
    // get binding for reactive property
    const binding = Globals.get().reactivity[target.name]
    if (!binding) return

    // get the exposed data for binding
    const exposedData = Globals.get().exposedData[binding.id[0]]

    // make sure to update exposed data with new target
    const updateExposedData = (value, key) => {
        if (key) exposedData[target["name"]][key] = value
        else exposedData[target["name"]] = value
        return exposedData
    }

    // update primative
    if (target.type === "Primative") {
        target.value = value
        updateExposedData(value, null)
    }

    // update object
    if (target.type === "Object") updateExposedData(target.Object, key)

    // updated all elements in binding to have the RAW value at render
    for (const i in binding.bindings) {
        const found = binding.bindings[i]
        if (found.refreshElement && binding.Element) binding.Element.forEach(element => element.innerHTML = binding.rawHTML)
    }

    // hydrate
    for (const i in binding.bindings) {
        const found = binding.bindings[i]
        debugger
        await SFT.HydrateDOM(found)
    }
}

/**
 * Handles the hydration for all directives
 * @param target
 */
export const directivesHydration = async (target, key, value) => {
    // update the target (key) with new value
    target.Array = value

    // get binding for reactive property
    const binding = Globals.get().directives[target.name]
    if (!binding) return

    // make sure to update exposed data with new target
    Globals.get().exposedData[binding.id][target["name"]] = target.Array

    // choose what to update
    switch (binding.type) {
        case "@for": return directivesAPI.updateForDirective(binding, target.name)
    }
}

/**
 * The handler for the core reactivity
 * @constructor
 */
export const Handler = () => ({get: Get, set: Set, deleteProperty})
