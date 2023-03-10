import T_COMPONENT from "../interfaces/T_component"
import * as utility from "../libs/utility";
import * as Globals from "./globals";
import * as SFT from "./single-file-template";
import {collectReactiveElements, OnEvents} from "./template-parser";

export const ActiveNode = function(this: any, params: {name:string, id:string, script_text: string, template_text: string, styles_text: string}): T_COMPONENT {
    const {name, id, script_text, styles_text, template_text} = params
    // the unique id for the node
    this.id = id

    // the name of the component
    this.name = name

    // the reactive elements in the node's template
    this.reactivity = []

    // children of current component
    this.children = []

    // updated with the node's template Document
    this.html = () => null

    // tells component if it has called mounted already
    this.Mounted = false

    // gives the node's template script
    this.script_text = () => script_text

    // gives the node's template html
    this.template_text = () => template_text

    // gives the node's template styles
    this.styles_text = () => styles_text

    // the name to use the html template
    this.element_key = () => utility.getElementKey(name)

    // will be set to the innerHTML of a component element
    this.slotData = null

    // the props defined for a component
    this.$props = null

    /**
     * Will search through it's children for an ID match
     * @param id
     */
    this.getChildById = (id: string) => this.children.filter((child: T_COMPONENT) => child.id == id)

    /**
     * Called once component tree has finished initializing and ready to mount
     * @param passed_props
     * @param id
     * @constructor
     */
    this.Mount = async (passed_props: unknown, id: string): Promise<T_COMPONENT> => {
        let self = this
        const component_tree_queue = Globals.get('component_tree_queue');
        component_tree_queue.push(this.name)
        Globals.set('component_tree_queue', component_tree_queue)

        // save all props passed to component
        self.$props = passed_props
        self.id = id

        // get the defined (mounted) method for this component
        const onMount = Globals.get('onMounted')[this.name]

        // run the mount Function passing the context
        const reactiveProperties = await onMount({
            id: self.id,
            name: self.name,
            slotData: self.slotData,
            props: self.$props,
            DOM: () => self.html(),
        })

        // merge props with exposed data from component
        const exposedData =  Globals.get('exposedData')
        exposedData[self.id] = {...passed_props, ...reactiveProperties}

        // setup this component's template
        this.html = await this.Setup()

        // this.reactivity = await collectReactiveElements(this)
        await OnEvents(this)

        // wait till the entire component tree has been set up and then render
        const renderProcessStarted: boolean =  Globals.get("RenderProcessStarted")
        if ((!renderProcessStarted) && (Globals.removeFromTreeQueue(this.name).length == 0))
            await this.Render()


        return self
    }

    /**
     * Called when the component is imported for the first time
     * @constructor
     */
    this.Setup = (): Promise<T_COMPONENT> => {
        return new Promise(async (resolve) => {
            // prepare child template
            await SFT.prepareTemplate(this)

            //apply directive logic
            await SFT.manageBindingsForDirectives(this)


            // initialize the component and its children
            await SFT.mountChildrenComponents(this)

            // start collection of reactive elements
            await collectReactiveElements(this)
            resolve(this.html)
        })
    }

    /**
     * Called once the component tree has initialized and is ready to render
     * @constructor
     */
    this.Render = (): Promise<T_COMPONENT> => {
        return new Promise(async (resolve) => {
            // tell system that the render process has started already
            Globals.set("RenderProcessStarted", true)

            // render the root component
            if (Globals.get().root.html.body) Globals.get().renderElement.appendChild(Globals.get().root.html.body)

            // hydrate the initial reactive data updates
            const reactivity = Globals.get().reactivity
            for (const propertyName in reactivity) {
                const binding = reactivity[propertyName]

                await SFT.HydrateDOM(binding)
            }

            Globals.set("RenderProcessStarted", false)

            resolve(this)
        })
    }

    return this
}

