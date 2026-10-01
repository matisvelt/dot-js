# Matis's defense guide

## My responsibility

My part is HTTP requests, performance, the example application, local persistence, and the development server.

Main files:

- `framework/src/http-performance.js`
- `example/src/app.js`
- `example/style.css`
- `server.js`

The main framework functions in my part are:

- `request()` — gets data from an HTTP source and returns parsed content.
- `lazyList()` — efficiently displays a very large fixed-height list.

## How the HTTP helper works

The framework wraps the browser's `fetch()` function:

```js
const data = await request("https://example.com/api/items");
```

The helper adds an `Accept: application/json` header by default. Options can still be passed for POST requests or custom headers:

```js
const task = await request("/api/tasks", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Study" })
});
```

The response `content-type` tells the helper whether to parse JSON or text.

`fetch()` does not throw an error for HTTP responses such as 404 or 500. It only throws for network failures. Therefore, the helper checks `response.ok` itself.

For an unsuccessful response, the error includes:

- `message` such as `HTTP 404`
- `status` such as `404`
- `body` containing the server response

This gives the application enough information to display a useful message.

## HTTP example in the application

The Fetch advice button shows the full async process:

1. Set `loading` to `true`.
2. Start the request inside `try`.
3. Save returned advice when it succeeds.
4. Show a readable error message inside `catch`.
5. Set `loading` to `false` inside `finally`.

`finally` runs after both success and failure, so the loading state always ends.

## Why the virtual list is faster

Creating 10,000 DOM rows at the same time can be slow and use unnecessary memory. The user can only see a small number of rows in the scroll area.

`lazyList()` creates:

1. A scrollable outer element.
2. A spacer with the height of the complete list.
3. A smaller window containing only the visible rows.

The spacer makes the scrollbar look correct even though most rows do not exist in the DOM.

The first visible row is calculated from the scroll position:

```js
Math.floor(element.scrollTop / rowHeight)
```

The end is calculated from the scroll position plus the visible height. A few extra rows, called `overscan`, are rendered above and below the screen. This prevents empty flashes during quick scrolling.

The small row window is moved down with its `top` style. Its contents are replaced whenever the user scrolls.

The result is that the demonstration contains 10,000 data items but normally only around 20–30 row elements.

## Limitation of the virtual list

Every row must use the configured fixed `rowHeight`. Variable-height rows would make the position calculation incorrect. Supporting variable row heights would require measuring rows and remembering their positions.

## How the example proves the framework works

The task application uses every required feature:

| Requirement | Example |
| --- | --- |
| Create and nest DOM | All pages are built with `h()` |
| Reusable components | `Button`, `Shell`, `Tasks`, `Performance`, `About` |
| Attributes and styles | Classes, required input, disabled button, CSS |
| Forms and input | Add task form |
| Direct events | Filter and Fetch advice buttons |
| Delegated events | Complete and delete task buttons |
| Shared state | Tasks, filter, quote, loading, and error |
| Routing | Tasks, 10k demo, and About pages |
| HTTP | Fetch advice button |
| Performance | Virtual 10,000-row list |

## Local storage

The application reads saved tasks when it starts:

```js
const saved = JSON.parse(localStorage.getItem("dot.tasks") || "null");
```

It uses `store.select()` to save only when the task array changes:

```js
store.select(
  state => state.tasks,
  tasks => localStorage.setItem("dot.tasks", JSON.stringify(tasks))
);
```

This is a browser-side bonus feature. It is not part of the framework's required default behavior.

## Development server

Browsers load JavaScript modules more reliably through HTTP than directly from a local file. `server.js` serves the example on port 4173.

It serves `/framework/...` from the project folder and other files from `example/`. It also returns `index.html` for unknown browser routes. This fallback is important: refreshing `/about` must still load the single-page application.

The server normalizes paths and checks that they stay inside the allowed base folder. This prevents requests from reading unrelated files.

## What I should demonstrate

1. Open the Tasks page and show that tasks remain after a refresh.
2. Press Fetch advice and explain loading, success, and error handling.
3. Open the 10k demo.
4. Scroll the list and inspect its DOM.
5. Show that only a small number of rows exist.
6. Explain the full-height spacer and moving visible window.
7. Refresh the About route to prove the server fallback works.

## Short presentation script

> My framework part covers HTTP and performance, and I integrated the example application. `request()` wraps fetch, parses JSON or text, and turns unsuccessful HTTP responses into useful errors. `lazyList()` improves performance by rendering only the rows visible in the scroll area, while a spacer preserves the correct total height. The task application proves all framework features work together. It also saves tasks locally, and the small Node server supports JavaScript modules and direct loading of application routes.

## Questions I may be asked

### Why wrap `fetch()`?

The application gets consistent JSON or text parsing and consistent errors. Without the wrapper, every page would repeat those checks.

### Why check `response.ok`?

`fetch()` normally resolves even when the server returns 404 or 500. Checking `ok` changes these into application errors.

### What does `finally` do?

It runs after success or failure. It is the correct place to stop the loading state.

### How is the performance improvement demonstrated?

The data array contains 10,000 items, but inspection shows only the visible rows and overscan rows in the DOM.

### What is overscan?

It is a small number of extra rows above and below the visible area. It makes scrolling look smooth.

### Why is the spacer needed?

It gives the scroll container the same height it would have if all rows existed. Without it, the scrollbar would only represent the rendered rows.

### Why use local storage?

It makes the example more useful and proves that store selectors can run side effects when one selected value changes.

### Why does the server return `index.html` for unknown paths?

Routes such as `/about` belong to the browser application, not separate server files. Returning the application HTML lets the router handle them.

### What could be improved?

HTTP caching, retries, cancellation, and variable-height virtual rows could be added. The example could also use a real backend instead of local storage.

## Code I should know especially well

Before the defense, I should be able to explain:

- How `request()` chooses JSON or text.
- Why `response.ok` is checked.
- How loading and errors are handled in the example.
- How the virtual list calculates its start and end rows.
- Why spacer height and overscan are needed.
- How local storage and the server route fallback work.
