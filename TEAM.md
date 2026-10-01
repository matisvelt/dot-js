# Team division

The framework is divided into three independently owned parts. `framework/src/dot.js` combines them into one stable public API, so the example application continues to work without import changes.

## Martin — DOM, components, and events

Primary file: `framework/src/dom.js`

Martin owns:

- `h()` virtual-node descriptions
- `component()` reusable components and props
- DOM creation and nested elements
- Attributes, inline styles, and form properties
- Direct event handlers and `$prevent`/`$stop` modifiers
- Delegated events
- `mount()`, rendering, and redraw scheduling

Suggested branch: `feature/martin-dom-components`

Defense preparation: [Martin's defense guide](docs/MARTIN-DEFENSE.md)

## Alex — State and routing

Primary file: `framework/src/state-router.js`

Alex owns:

- `createStore()` state reads and updates
- Subscriptions and selected dependencies
- Triggering UI updates after state changes
- Shared state between components and pages
- Route matching and URL parameters
- Programmatic navigation, links, and browser history

Suggested branch: `feature/alex-state-routing`

Defense preparation: [Alex's defense guide](docs/ALEX-DEFENSE.md)

## Matis — HTTP, performance, and integration

Primary files:

- `framework/src/http-performance.js`
- `example/`
- `server.js`

Matis owns:

- `request()` JSON/text responses and HTTP errors
- `lazyList()` virtual rendering
- Task application integration and styling
- Local-storage persistence
- Development server and SPA fallback
- End-to-end checks

Suggested branch: `feature/matis-http-example`

Defense preparation: [Matis's defense guide](docs/MATIS-DEFENSE.md)

## Shared work

Each person writes tests and documentation for their own feature. Before merging, another member reviews the branch. Use this integration order:

1. Martin's DOM module
2. Alex's state and router module
3. Matis's HTTP/performance module and example
4. All three run `npm test` and manually test the example together

The important boundary is that Alex imports only `h` and `redraw` from Martin's module. Matis's virtual list uses the generic `renderDOM(createNode)` extension supplied by Martin's renderer. The example imports only from `framework/src/index.js`, never from an owner's private module.
