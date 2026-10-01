# Alex's defense guide

## My responsibility

My part is reactive application state and URL routing.

Main file: `framework/src/state-router.js`

The two main functions are:

- `createStore()` — stores shared data and tells the interface when it changes.
- `createRouter()` — connects browser URLs to application pages.

## State management idea

An application needs one reliable source for shared data. In the example, the store holds tasks, the selected filter, remote advice, and loading state.

```js
const store = createStore({
  tasks: [],
  filter: "all",
  loading: false
});
```

Any component can read the same data:

```js
const state = store.get();
```

It can update the data with an object:

```js
store.set({ filter: "done" });
```

Or with a function when the new value depends on the old value:

```js
store.set(state => ({
  tasks: [...state.tasks, newTask]
}));
```

## How `createStore()` works

The first state is cloned with `structuredClone()`. This prevents outside code from changing the original object after the store is created.

The current state is inside the `createStore()` function. It cannot be directly accessed from outside. The returned methods are the only public way to work with it.

When `set()` receives an object, it shallow-merges the object into the old state. This means changing the filter does not remove the tasks:

```js
store.set({ filter: "done" });
```

When state changes, `set()` does two things:

1. It calls all subscribed listeners.
2. It calls `redraw()` so the visible application updates.

## Subscriptions and dependencies

`subscribe()` runs a listener after every state change:

```js
const stop = store.subscribe(state => {
  console.log(state);
});
```

It returns an unsubscribe function:

```js
stop();
```

`select()` watches only one chosen value:

```js
store.select(
  state => state.tasks,
  tasks => localStorage.setItem("tasks", JSON.stringify(tasks))
);
```

The selector result is compared with its previous value using `Object.is()`. The listener only runs when that selected value changes. In the example, changing the loading state does not save the task list again.

Objects and arrays should not be changed in place. A new array or object should be created so the change can be detected:

```js
// Good
store.set(state => ({ tasks: [...state.tasks, newTask] }));

// Bad
state.tasks.push(newTask);
```

## Routing idea

Routing controls which page is shown based on the URL.

```js
const router = createRouter([
  { path: "/", view: () => h(Tasks) },
  { path: "/about", view: () => h(About) }
]);
```

The application displays the selected page with:

```js
router.view()
```

## Route matching

`match(pathname)` checks the URL against every route. It also supports parameters:

```js
{ path: "/users/:id", view: params => h(User, params) }
```

For `/users/42`, the route receives:

```js
{ id: "42" }
```

The path is converted to a small regular expression. The parameter names are saved and matched values are decoded.

## Navigation and links

`navigate()` uses the browser History API:

```js
router.navigate("/about");
```

`history.pushState()` changes the URL without downloading the whole page again. After changing the URL, the router resolves it and redraws the interface.

`router.link()` returns properties for a normal anchor element:

```js
h("a", router.link("/about"), "About")
```

The result still has an `href`, so it behaves like a real link. A normal click is handled inside the application. Ctrl-click or Cmd-click is not taken over, which allows the user to open a new tab.

The `popstate` event handles browser back and forward buttons.

## What I should demonstrate

1. Open the task page and add a task.
2. Explain how `store.set()` changes the task array and causes redraw.
3. Select the Done filter and show that all components read the same store.
4. Refresh the page and explain that `select()` was used for local storage.
5. Move between Tasks, 10k demo, and About.
6. Use the browser back button to demonstrate `popstate`.
7. If asked, explain how a `:parameter` route would be matched.

## Short presentation script

> My part handles state and routing. `createStore()` keeps shared application data private and exposes methods to read, update, and observe it. Every state update notifies listeners and asks the renderer to redraw. `select()` lets a component or side effect depend on only one part of the state. `createRouter()` compares the browser path with our route definitions. It uses the History API to change pages without a full reload and listens for back and forward navigation.

## Questions I may be asked

### Why is shared state needed?

Several parts of the application need the same data. A shared store keeps them consistent and provides one controlled update process.

### Why does `set()` merge objects?

It allows one property to be updated without repeating the complete state object. For example, changing `loading` should not delete `tasks`.

### What is the difference between `subscribe()` and `select()`?

`subscribe()` runs after every state update. `select()` runs only when its selected value changes.

### Why return an unsubscribe function?

A listener may no longer be needed when a feature is removed. Unsubscribing avoids unused work and possible memory leaks.

### Why use the History API?

It changes the URL without refreshing the whole document. This makes navigation faster and keeps the application state alive.

### How do back and forward buttons work?

The browser sends a `popstate` event. The router reads the new path, finds its route, and redraws the page.

### What happens when no route matches?

The router renders the fallback view. By default, it displays a “Not found” heading.

### What could be improved?

The router could support query parameters, nested routes, and route guards. The store could support middleware, actions, or batching rules.

## Code I should know especially well

Before the defense, I should be able to explain:

- Why initial state is cloned.
- The two forms of `store.set()`.
- When subscribers and selectors run.
- Why arrays should be copied instead of mutated.
- How a route path becomes a regular expression.
- How `navigate()`, `link()`, and `popstate` work together.
