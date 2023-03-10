import { HydrateDOM } from "./single-file-template";
import * as directivesAPI from "./directives-api";
import * as Globals from "./globals";
import * as SFT from "./single-file-template";

export const Get = (target: object, key: string) => target[key]


export const deleteProperty = (target: object, key: string) => Reflect.deleteProperty(target, key)


export const Set = async (target: object, key: string, value: any) => {
    debugger
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
    debugger
    // get binding for reactive property
    const binding = Globals.get().reactivity[target.name]
    if (!binding) return

    // get the exposed data for binding
    const exposedData = Globals.get().exposedData[binding.id]

    // make sure to update exposed data with new target
    const updateExposedData = (value) => {
        return exposedData[target["name"]] = value
    }

    // update primative
    if (target.type === "Primative") {
        target.value = value
        updateExposedData(value)
    }

    // update object
    if (target.type === "Object") {
        target.object[key] = value
        updateExposedData(target.object)
    }

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
