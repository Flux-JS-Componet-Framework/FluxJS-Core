# ActiveJS

ActiveJS is a JavaScript `component` framework written in `TypeScript`. It was built
with performance in mind, and allows you to create beautiful `UI` with ease!

# Sections
- [Creating an ActiveJS Application](#Creating-an-ActiveJS-Application)
- [Root Component](#Root-Component)
- [Mounting the App](#Mounting-the-App)
- [Component Template Files](#Component-Template-Files)
- [Routing](#Routing)
- [HTML Interpolation](#HTML-Interpolation)
- [Registering Children Components](#Registering-Children-Components)
- [Passing Props](#Passing-Props)
- [Slots](#Slots)


## Creating an ActiveJS Application
Every ActiveJS application starts by creating a new `App Instance` with the `createApp`
method:

```js
// import
import { createApp } from "@jordan_langton/activejs";

// initialization
await createApp(/* root component */, /* render element */)
```

> `Note*` unfortunately there is no way (at the moment) to have multiple `instances` of an activeJS
>  application running in one `DOM`

## Root Component
The `root` component is just a component which contains other children. How do we get/import
a component to pass to `createApp`?

```js
// import
import { createApp, Component } from "@jordan_langton/activejs";

// component
const App = Component(/* component name */, /* template file */)

// initialization
await createApp(/* root component */, /* render element */)
```
As you see in the example above, we just use the `Component` method that is exposed to
you from the ActiveJS `import`. This method will fetch your template component file, and
convert it into a usable component which can now be passed to the `createApp` function.

## Mounting the App
As you can see the `createApp` method's second argument expects a "container" argument.
This needs to be an actual DOM element.

```js
// import
import { createApp, Component } from "@jordan_langton/activejs";

// component
const App = Component('App', './App.html')

// initialization
await createApp(App, document.querySelector('#app'))
```

## Component Template Files
ActiveJS `component templates` are HTML files which will represent a component in a 
readable way. It allows us to encapsulate the template, logic, and styling of an ActiveJS
component in a single file.
```html
<script>
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
As we can see, ActiveJS `component templates` are a natural extension of the classic trio of HTML, 
CSS and JavaScript. The `<template>`, `<script>`, and `<style>` blocks encapsulate and colocate the view,
logic and styling of a component in the same file.

## Routing
In order to have multiple `root` components (Main pages in your application) you
will need to incorporate the `Router`.
```js
import { Router } from "@activejs/router"

// @ts-ignore
export const $router = new Router([
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
now need to use the `Component` method exported to you by ActiveJS.
```html
<script>
    // import libraries
    import { Setup, Component } from "@activejs"
    
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
In ActiveJS you are able to pass data between a `Parent` & `Child` component. This
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
    import { Setup, Component } from "@activejs"

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
<script>
    await Setup('App', async (context) => {
        const { props } = context
    })
</script>
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
