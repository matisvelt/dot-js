# Dot.js framework

Dot.js is a dependency-free front-end framework for small single-page applications. Application code declares a tree of virtual nodes; Dot turns the tree into DOM and owns rendering, state-driven updates, route resolution, events, and HTTP data access.

## Architecture and principles

The public API is assembled by `src/dot.js` from three team-owned modules and has six small layers:

1. `h` creates virtual-node descriptions.
2. `mount` renders a root view and `redraw` schedules updates.
3. `component` makes reusable, props-based view functions.
4. `createStore` owns shared state and subscriptions.
5. `createRouter` maps the URL to views and parameters.
6. `request` and `lazyList` cover remote data and large collections.

The design favors plain JavaScript, one-way data flow, explicit state updates, and browser standards. Dot owns the render lifecycle, making it a framework rather than a collection of unrelated helpers. There is no build step, JSX compiler, runtime dependency, or hidden global store.

Team ownership is documented in the repository's `TEAM.md`: Martin maintains `dom.js`, Alex maintains `state-router.js`, and Matis maintains `http-performance.js` plus example integration.

## Installation

Copy `framework/src` into a project, or import it from this repository:

```js
import { h, mount } from "./framework/src/index.js";
```

Serve the project over HTTP because browsers restrict ES modules opened with `file://`. For this repository:

```sh
npm start
```

Then open <http://localhost:4173>. Node.js 18 or newer is recommended (tests use its built-in test runner).

## Getting started

HTML needs only a mounting element and a module script:

```html
<div id="app"></div>
<script type="module" src="./app.js"></script>
```

Create and mount a view:

```js
import { h, mount, createStore } from "./framework/src/index.js";

const counter = createStore({ count: 0 });

function App() {
  return h("button", {
    onClick: () => counter.set(s => ({ count: s.count + 1 }))
  }, `Count: ${counter.get().count}`);
}

mount(document.querySelector("#app"), App);
```

`store.set` schedules a redraw automatically.

## DOM and components

`h(type, props, ...children)` creates elements and nests any number of children. Nested child arrays are flattened; `null`, `undefined`, and `false` are ignored.

```js
const Card = component(({ title, children }) =>
  h("article", { className: "card", style: { padding: "1rem" } },
    h("h2", {}, title), children)
);

h(Card, { title: "Profile" }, h("p", {}, "Ada Lovelace"));
```

Use normal HTML attribute names, or `className`. Object-valued `style` properties are assigned to the DOM style object. `value`, `checked`, and `selected` update their DOM properties, which makes controlled form fields possible.

## Events and forms

Event properties start with `on`: `onClick`, `onInput`, `onSubmit`, and so on. Add `$prevent`, `$stop`, or both to control default behavior and bubbling.

```js
h("form", {
  onSubmit$prevent$stop: event => save(event.currentTarget.elements.title.value)
}, h("input", { name: "title" }), h("button", {}, "Save"));
```

For event delegation, attach one listener to a parent and map selectors to handlers. The second argument is the closest matching element.

```js
h("ul", { delegate: { click: {
  "[data-remove]": (event, target) => remove(target.dataset.remove)
} } }, rows);
```

## Shared state

`createStore(initial)` returns:

- `get()` — current state.
- `set(objectOrUpdater)` — shallow-merges object state and redraws mounted apps. An updater receives current state.
- `subscribe(listener)` — observes every update and returns an unsubscribe function.
- `select(selector, listener)` — observes one derived value and fires only when it changes by `Object.is` comparison.

```js
const session = createStore({ user: null, theme: "light" });
session.set({ user: { name: "Lin" } });
const stop = session.select(s => s.user, user => console.log(user));
```

Export a store from a module to share it between components and routed pages. Keep state minimal; derive filtered or counted values in views. Never mutate arrays in place—return new arrays and objects so selectors can detect change.

## Routing

Routes use the History API and support named path parameters:

```js
const router = createRouter([
  { path: "/", view: () => h(Home) },
  { path: "/users/:id", view: ({ id }) => h(User, { id }) }
]);

h("a", router.link("/users/42"), "Open user");
router.navigate("/", { replace: true });
mount(root, () => router.view());
```

`router.link(path)` supplies `href` and a click handler, preserving native link semantics while avoiding a page reload. Back/forward navigation is handled through `popstate`. The server must return the application HTML for unknown paths (the included server does this).

## HTTP

`request(url, options)` wraps `fetch`, requests JSON by default, parses JSON or text from the response content type, and throws an error containing `status` and `body` for non-2xx responses.

```js
try {
  const tasks = await request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Ship it" })
  });
} catch (error) {
  console.error(error.status, error.body);
}
```

Track loading and error state in a store so every dependent component reacts consistently.

## Performance: virtual lists

`lazyList` renders only the rows near the visible viewport instead of every item. For 10,000 fixed-height rows, the DOM contains roughly the viewport row count plus overscan.

```js
lazyList(items, item => h("div", {}, item.name), {
  height: 400,
  rowHeight: 48,
  overscan: 4
});
```

Rows must have the declared fixed height. Use stable source arrays; virtual rendering is intended for large display lists rather than variable-height content.

## Best practices

- Keep components pure: read state, return virtual nodes, and change state only in event or async handlers.
- Put domain state in exported stores; keep temporary form values in the DOM until submission when live synchronization is unnecessary.
- Use semantic HTML and native links, labels, buttons, and form validation for accessibility.
- Delegate events for long or frequently changing lists.
- Catch HTTP failures and expose loading, success, empty, and error states.
- Split routes and components into modules as an application grows.
- Avoid expensive work inside views; calculate it during state updates or memoize it.

## API reference

| API | Purpose |
| --- | --- |
| `h(type, props, ...children)` | Describe an element or component |
| `component(render)` | Define a reusable props-based component |
| `mount(element, view)` | Own and render a DOM root; returns an unmount callback |
| `redraw()` | Schedule mounted views to render in a microtask |
| `createStore(initial)` | Create reactive shared state |
| `createRouter(routes, fallback?)` | Create URL-driven rendering and navigation |
| `request(url, options?)` | Fetch and parse remote data |
| `lazyList(items, render, options?)` | Window a large fixed-height list |

## Review extension ideas

Good additions for a reviewer are a route guard, store middleware/logger, keyed DOM reconciliation, loading retry policy, or a `class` object syntax such as `{ active: true }`. Each fits behind a small API without changing default behavior.
