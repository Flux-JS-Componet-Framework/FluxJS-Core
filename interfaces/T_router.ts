import T_COMPONENT from "./T_component";


export default interface T_ROUTER {
    [key:string]: any,
    isRouter: boolean,
    init: () => void,
    route: (route: string) => T_COMPONENT,
}
