export default interface T_REACTIVE_ELEMENT {
    [key:string]: any,
    id: string,
    index: number,
    propertyName: string,
    rawHTML: string,
    element: Array<Element>,
    binding: string,
    bindings: Array<this>,
}
