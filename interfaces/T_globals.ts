import T_COMPONENT from "./T_component";
import T_REACTIVE_ELEMENT from "./T_reactiveElement";

export default interface T_GLOBALS {
    [key:string]: any,

    // this is the root component
    root: T_COMPONENT | null,

    // this is a list of mounting methods
    onMounted: Array<Function>,

    // list of every reactive property in use
    reactivity: T_REACTIVE_ELEMENT | object,

    // every loaded component's exposed properties
    exposedData: object,

    // contains every loaded component
    loaded_components: T_COMPONENT | object

    // used to help system understand when all children have initialized
    component_tree_queue: Array<string>
}
