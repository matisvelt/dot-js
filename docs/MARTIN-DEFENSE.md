# Martin's defense guide

## My responsibility

My part is the base of the framework. I worked on DOM creation, components, properties, forms, events, mounting, and redrawing.

Main file: `framework/src/dom.js`

The most important functions in my part are:

- `h()` — describes an HTML element with JavaScript.
- `component()` — creates reusable components.
- `createNode()` — changes our descriptions into real DOM elements.
- `setProp()` — applies attributes, styles, form values, and events.
- `mount()` — starts the application inside an HTML element.
- `redraw()` — updates mounted applications.

## Main idea

Usually, we can create an element like this:

```js
const heading = document.createElement("h1");
heading.textContent = "Hello";
document.body.append(heading);
```

In Dot.js, the same element can be described like this:

```js
h("h1", {}, "Hello")
```

`h()` does not immediately create an HTML element. It returns a plain JavaScript object:

```js
{
  type: "h1",
  props: {},
  children: ["Hello"]
}
```

Later, `createNode()` reads this object and creates the real DOM element. This separation lets the whole user interface be described with JavaScript functions.

## How `h()` works

The arguments are:

1. Element type, such as `"button"` or a component function.
2. Properties, such as class, style, and events.
3. Any number of child elements.

```js
h("button", { className: "save", onClick: save }, "Save")
```

Nested child arrays are flattened. Empty values such as `null` and `false` are removed. This makes lists and conditional elements easier to write.

## How components work

A component is a reusable function which returns an element description.

```js
const Button = component(({ children, kind }) =>
  h("button", { className: kind }, children)
);
```

It can then be reused:

```js
h(Button, { kind: "primary" }, "Save")
h(Button, { kind: "danger" }, "Delete")
```

`component()` combines the properties and children into one object. `createNode()` notices that the type is a function, calls it, and renders its result.

## How attributes and styles work

`setProp()` handles several kinds of values:

- `className` becomes the HTML `class` attribute.
- A style object is copied to `element.style`.
- `value`, `checked`, and `selected` are set as DOM properties.
- `true` creates an empty Boolean attribute.
- Normal values are converted to strings and set as attributes.

Example:

```js
h("input", {
  className: "task-input",
  required: true,
  style: { color: "black" }
})
```

## How event handling works

Event properties begin with `on`:

```js
h("button", { onClick: () => console.log("clicked") }, "Click")
```

The framework changes `onClick` into a normal `click` event listener. Event modifiers can also be added:

```js
h("form", { onSubmit$prevent: saveTask }, children)
```

`$prevent` calls `preventDefault()`. `$stop` calls `stopPropagation()`. They can be used together.

Event delegation is useful for a list. Instead of adding one listener to every task, one listener is added to the parent:

```js
h("ul", {
  delegate: {
    click: {
      "[data-delete]": deleteTask
    }
  }
}, tasks)
```

The framework uses `closest()` to find which child was clicked.

## Mounting and redrawing

`mount(root, view)` saves the root element and view function. It renders the first version immediately.

```js
mount(document.querySelector("#app"), App)
```

When `redraw()` is called, each mounted view is created again and replaces the old contents. A microtask is used so several changes during one event can be grouped together.

This implementation replaces the root contents instead of comparing old and new trees. It is simple and easy to understand. A future improvement could be DOM diffing or keyed updates.

## What I should demonstrate

1. Open the task application.
2. Show one `h()` call in `example/src/app.js`.
3. Explain that it becomes a plain node description.
4. Show `createNode()` turning descriptions into DOM elements.
5. Add a task to demonstrate form submission and `$prevent`.
6. Complete and delete tasks to demonstrate delegated events.
7. Show the reusable `Button` component.

## Short presentation script

> My part is the rendering and component system. The application does not manually call `createElement` everywhere. Instead, `h()` creates a JavaScript description of the interface. `createNode()` reads that description and creates the real DOM. If the node type is a function, it is treated as a reusable component. Properties are handled in one place, including styles, form values, direct events, and delegated events. Finally, `mount()` starts the application and `redraw()` refreshes it when state or routes change.

## Questions I may be asked

### Why did you create `h()`?

It gives the application one consistent way to describe elements, components, properties, and children with JavaScript. The framework can then control how the descriptions become DOM.

### Why use `className` instead of `class`?

`className` is familiar in JavaScript-based user interfaces. `setProp()` converts it to the real `class` attribute.

### What is the difference between a component and an element?

An element has a string type such as `"div"`. A component has a function as its type. The function receives properties and children and returns more element descriptions.

### Why use delegated events?

Large or changing lists do not need a separate listener on every row. One parent listener can handle clicks from all current and future children.

### Does the framework copy React?

No. It uses the general idea of describing a user interface with JavaScript, but the implementation was written from basic browser APIs. It has its own small API and rendering process.

### What is the weakness of the current renderer?

Normal redraws replace the root contents. This is easy to understand but can do more DOM work than necessary. Keyed reconciliation would be a useful next feature.

## Code I should know especially well

Before the defense, I should be able to explain these sections without reading this guide:

- How `h()` creates its return object.
- Why `vnode()` treats text differently.
- How `setProp()` recognizes events.
- How delegated events find the clicked child.
- How `createNode()` handles elements and components.
- What `mount()` and `redraw()` do.
