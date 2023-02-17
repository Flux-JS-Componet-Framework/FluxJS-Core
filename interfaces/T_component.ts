import T_REACTIVE_ELEMENT from "./T_reactiveElement";

export default interface T_COMPONENT {
    [key:string]: any,
    id: string,
    name: string,
    children: Array<T_COMPONENT>,
    reactivity: T_REACTIVE_ELEMENT,
    html: Document,
    slotData: Element | null,
    script_text: () => string,
    template_text: () => string,
    styles_text: () => string,
    getChildById: () => T_COMPONENT,
    element_key: () => string,
    Mounted: () => T_COMPONENT,
    Setup: () => T_COMPONENT,

}
