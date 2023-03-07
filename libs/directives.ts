// Bind directive
export const BIND = {
    ":id": "bind-id",
    "@Bind:id": "bind-id",

    ":class": "bind-class",
    "@Bind:class": "bind-class",

    ":disabled": "bind-disabled",
    "@Bind:disabled": "bind-disabled",

    ":checked": "bind-checked",
    "@Bind:checked": "bind-checked",

    ":href": "bind-href",
    "@Bind:href": "bind-href",

    ":style": "bind-style",
    "@Bind:style": "bind-style",

    ":type": "bind-type",
    "@Bind:type": "bind-type",

    ":value": "bind-value",
    "@Bind:value": "bind-value",

    ":innerHTML": "bind-innerHTML",
    "@Bind:innerHTML": "bind-innerHTML",

    ":innerText": "bind-innerText",
    "@Bind:innerText": "bind-innerText",
};

// On directive
export const ON = {
    "@click": "vm-u67W2a8",
    "@On:click": "vm-u67W2a8",
    "@submit": "vm-dIbLGpz",
    "@On:submit": "vm-dIbLGpz",
    "@enter": "vm-rwAaot4",
    "@On:enter": "vm-rwAaot4",
    "@change": "vm-8ikHgbc",
    "@On:change": "vm-8ikHgbc",
    "@input": "vm-fbnsI6S",
    "@On:input": "vm-fbnsI6S",
    "@scroll": "vm-ldN8dke",
    "@On:scroll": "vm-ldN8dke",
};

// If directive
export const IF = {
    "@If": "if-A2xo7Jy",
    "@Else": "if-Ajf67Jy"
};

// For directive
export const FOR = {
    "@For": "for-gtSXBIq",
    ":key": "af-key",
};

export const FADE_ANIMATION = {
    "@animate:Fade": "vm-animate-fade",
    "@in:Fade": "vm-animate-in-fade",
    "@out:Fade": "vm-animate-out-fade",
};

export const Zoom_ANIMATION = {
    "@animate:Zoom": "vm-animate-zoom",
    "@in:Zoom": "vm-animate-in-zoom",
    "@out:Zoom": "vm-animate-out-zoom",
};

export const ANIMATIONS = {
    ...FADE_ANIMATION,
    ...Zoom_ANIMATION,
};

// view directives
export const directives = {
    ...BIND,
    ...ON,
    ...IF,
    ...FOR,
    ...ANIMATIONS
};

export const EventTypes = [
    'mouseover',
    'mouseout',
    'keydown',
    'load',
    'animationend',
    'animationiteration',
    'animationstart',
    'blur',
    'canplay',
    'change',
    'click',
    'copy',
    'paste',
    'cut',
    'dblclick',
    'focus',
    'input',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseover',
    'mouseout',
    'mouseup',
    'mousewheel',
    'pause',
    'play',
    'playing',
    'scroll',
    'submit',
    'wheel',
]
export const directiveAttributes = [
    'data-property'
]
