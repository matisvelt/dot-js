# Dot.js

A front-end framework written from scratch, plus a task application that proves every required feature.

## Run

```sh
npm start
```

Open <http://localhost:4173>. Run automated checks with `npm test`. Set `PORT` to override the default.

## Repository layout

- `framework/` — dependency-free framework source, tests, and complete usage documentation.
- `example/` — responsive task app demonstrating components, DOM creation/nesting, forms, direct and delegated events, shared reactive state, routing, HTTP, local persistence, and a virtualized 10,000-row list.
- `server.js` — minimal static server with SPA route fallback.

Read the [framework guide](framework/README.md) for architecture, examples, API details, best practices, and suggested review extensions.

For the three-person ownership plan, see [TEAM.md](TEAM.md): Martin owns DOM/components/events, Alex owns state/routing, and Matis owns HTTP/performance/example integration.
