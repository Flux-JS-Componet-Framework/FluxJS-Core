# FluxJS Component API

FluxJS is a JavaScript `component` framework written in `TypeScript`. It was built
with performance in mind, and allows you to create beautiful `UI` with ease!

# Sections
- [Creating an FluxJS Application](#Creating-an-FluxJS-Application)
- [Root Component](#Root-Component)
- [Mounting the App](#Mounting-the-App)
- [Loading External Libraries](#Loading-External-Libraries)
- [Component Template Files](#Component-Template-Files)
- [Imports in Template Files](#Imports-in-Template-Files)
- [Routing](#Routing)
- [HTML Interpolation](#HTML-Interpolation)
- [Registering Children Components](#Registering-Children-Components)
- [Passing Props](#Passing-Props)
- [Slots](#Slots)
- [Declaring Reactive State](#Declaring-Reactive-State)


## Creating an FluxJS Application
Every FluxJS application starts by creating a new `App Instance` with the `createApp`
method:

```js
// import
import { createApp } from "@flux-js/core";

// initialization
await createApp(/* root component */, /* render element */)
```

> `Note*` unfortunately there is no way (at the moment) to have multiple `instances` of an FluxJS
>  application running in one `DOM`

## Root Component
The `root` component is just a component which contains other children. How do we get/import
a component to pass to `createApp`?

```js
// import
import { createApp, Component } from "@flux-js/core";

// component
const App = Component(/* component name */, /* template file */)

// initialization
await createApp(/* root component */, /* render element */)
```
As you see in the example above, we just use the `Component` method that is exposed to
you from the FluxJS `import`. This method will fetch your template component file, and
convert it into a usable component which can now be passed to the `createApp` function.

## Mounting the App
As you can see the `createApp` method's second argument expects a "container" argument.
This needs to be an actual DOM element.

```js
// import
import { createApp, Component } from "@flux-js/core";

// component
const App = Component('App', './App.html')

// initialization
await createApp(App, document.querySelector('#app'))
```

## Loading External Libraries
Flux-js exports a method called `Use`. This allows you to load any `external` libraries into flux-js.
```js
// imports
import { Use } from '@flux-js/core'

// other library
const library = {/***/}

// load into flux-js
Use("key", library)
```
To get your loaded items out from flux-js, you can use the `Import` method.
```js
// imports
import { Import } from '@flux-js/core'

// get from flux-js
const value = Import("key")
const nestedVal = Import("key/nestedVal")
```

## Component Template Files
FluxJS `component templates` are HTML files which will represent a component in a 
readable way. It allows us to encapsulate the template, logic, and styling of an FluxJS
component in a single file.
```html
<script>
    // imports
    const { Setup } = Import("@flux-js")
    
    // onMounted
    await Setup('App', async (context) => {
        // variables
        const heading = "Hello World"
        
        // expose to template below
        return { heading }
    })
</script>

<template>
    <h1>{ heading }</h1>
</template>

<style>
    .heading {
        color: red;
        font-weight: bold;
    }
</style>
```
As we can see, FluxJS `component templates` are a natural extension of the classic trio of HTML, 
CSS and JavaScript. The `<template>`, `<script>`, and `<style>` blocks encapsulate and colocate the view,
logic and styling of a component in the same file.

## Imports in Template Files
Native `JavaScript` imports will not work properly inside of `template files`. Instead, you will need to use
the exported `Import` method (with the `@flux-js` namespace) to get access to flux-js exports eg: (`Setup`, `Component`, `Reactive`)
>`Note*` the '*Import*' method is `globally` accessible inside the script tags
```html
<script>
    // get all exports
    const { Setup, Component, Reactive } = Import('@flux-js')
    
    // only import specific export
    const method = Import('@flux-js/Setup')
</script>
```

## Routing
In order to have multiple `root` components (Main pages in your application) you
will need to incorporate the `Router`.
```js
import { router } from "@flux-js/core"

// @ts-ignore
export const $router = new router([
    { path: '/', name: 'App', component: './App.html' },
    { path: '/about-us', name: 'AboutUs', component: './AboutUs.html' },
    { path: '/contact-us', name: 'ContactUs', component: './ContactUs.html' },
])
```
As you can see above, each route has 3 main properties: (`path`, `name`, `component`).
The `path` property is the url needed to be requested for the component to mount. The
`name` property is the name you `registered` the component with in the `Setup` method.
And lastly, the `component` property is the directory/url to the `component template`.


## HTML Interpolation
The most basic form of data binding is html `interpolation` using the `Mustache` 
syntax (single curly braces):

```html
// template
<p> Message: { msg }</p>
```
The mustache tag will be replaced with the value of the msg property from the 
corresponding component exposed data. It will also be updated whenever the msg 
property changes.

## Registering Children Components
To use a child component, we need to import it in the parent component. 
Assuming we created a `component template` called `ButtonCounter.html`, we 
now need to use the `Component` method exported to you by FluxJS.
```html
<script>
    // imports
    const { Setup, Component } = Import("@flux-js")
    
    // import child
    await Component('ButtonCounter', './ButtonCounter.html')

    // onMounted
    await Setup('App', async (context) => {/* parent logic */})
</script>

<template>
    <!-- child component -->
    <ajs-ButtonCounter></ajs-ButtonCounter>
</template>
```
> `Note*` The `Component` method will import on a `framework` level. Meaning if 
> you have already imported a child, you no longer need to reference an import
> for that child inside other component/children.

## Passing Props
In FluxJS you are able to pass data between a `Parent` & `Child` component. This
will allow for multiple uses of a component, but different data for each one. To pass a prop
to a `child` component, we must add an `attribute` to the component `Element`, prefixed
with a `#`.
```html
<template>
    <!-- child component -->
    <ajs-ButtonCounter #foo="bar" #hello="world"></ajs-ButtonCounter>
</template>
```
In the example above you can see `2` props being passed to our `ButtonCounter` component.
These are just `String` values though. So how would we pass a defined variable from the logic?
```html
<script>
    // import libraries
    const { Setup, Component } = Import("@flux-js")

    // import child
    await Component('ButtonCounter', './ButtonCounter.html')

    // onMounted
    await Setup('App', async (context) => {
        const items = []
        const click = () => console.log("I was clicked")
        return { 
            customVariable: 'Hello World',
            items, 
            click 
        }
    })
</script>
<template>
    <!-- child component -->
    <ajs-ButtonCounter #customVariable #items #click></ajs-ButtonCounter>
</template>
```
As you can see above, we first define the `variable` and return it from the component 
`logic`. Then we define the prop on the child the same as before, only we don't need 
to `assign a value` to the prop.

Accessing props passed to a `child` component is as easy as pulling them out of the
`context` object passed to every component.
```js
await Setup('App', async (context) => {
    const { props } = context
})
```

## Slots
In some cases, we may want to pass a template fragment to a child component, 
and let the child component render the fragment within its own template. For 
example, we may have a `<FancyButton>` component that supports usage like this:
```html
<FancyButton>
  Click me! <!-- slot content -->
</FancyButton>
```
The template of <FancyButton> looks like this:
```html
<button class="fancy-btn">
  <ajs-slot></ajs-slot> <!-- slot outlet -->
</button>
```
The `<ajs-slot>` element is a slot outlet that indicates where the parent-provided 
slot content should be rendered.
> `Note*` You can only have `one` slot element per component.

## Declaring Reactive State
In some instances you will want to create some piece of reactive data which is displayed to the user and
whenever the property is `updated`, the value shown to the user is `changed` too. This is where `Reactive()`
comes into play.
```html
<script>
    // import
    const { Setup, Reactive } = Import("@flux-js")
    
    // onMounted
    await Setup('App', async (context) => {
		// primitives
        const string = Reactive("foo") // { value: 'foo' }
        const number = Reactive(0) // { value: 0 }
        
        // objects
        const user = Reactive({ name: 'John', age: 21 }) // { name: 'John', age: 21 }
        
        // expose properties to the template
        return { string, number, user }
    })
</script>
```
As you can see in the example above, we declare a few variables as reactive properties. The properties can 
now be used in the template and will keep up to date with the latest changes to said property.
```html
<template>
    <p>String Value: { string.value }</p>
    <p>Number Value: { number.value }</p>
    <p>Object Value: { user.name } - { user.age }</p>
</template>
```
Turns into
```html
<template>
    <p>String Value: foo</p>
    <p>Number Value: 0</p>
    <p>Object Value: John - 21</p>
</template>
```
