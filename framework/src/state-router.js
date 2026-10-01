// Alex: reactive shared state and URL-based routing.
import { h, redraw } from "./dom.js";

export function createStore(initialState) {
  // Clone the first value so outside code cannot change it by accident.
  let state = structuredClone(initialState);
  const listeners = new Set();
  return {
    get: () => state,
    set(update) {
      // set() accepts either a new value or a function using the old value.
      const next = typeof update === "function" ? update(state) : update;
      state = typeof next === "object" && next !== null && !Array.isArray(next) ? { ...state, ...next } : next;
      listeners.forEach(listener => listener(state));
      // State changes are shown on the page automatically.
      redraw();
      return state;
    },
    subscribe(listener) {
      // Returning this function gives the caller a way to unsubscribe.
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    select(selector, listener) {
      // select() only runs its listener when the chosen value changes.
      let previous = selector(state);
      return this.subscribe(next => {
        const selected = selector(next);
        if (!Object.is(previous, selected)) {
          previous = selected;
          listener(selected);
        }
      });
    }
  };
}

export function createRouter(routes, fallback = () => h("h1", {}, "Not found")) {
  // current stores the route which matches the browser URL.
  let current = null;
  const match = pathname => {
    for (const route of routes) {
      const keys = [];
      const pattern = route.path.replace(/:[^/]+/g, key => {
        // For example, /users/:id captures the id part of the URL.
        keys.push(key.slice(1));
        return "([^/]+)";
      });
      const found = pathname.match(new RegExp(`^${pattern}/?$`));
      if (found) return { route, params: Object.fromEntries(keys.map((key, index) => [key, decodeURIComponent(found[index + 1])])) };
    }
    return null;
  };
  const resolve = () => {
    // Check the current URL again and update the displayed page.
    current = match(location.pathname);
    redraw();
  };
  const navigate = (path, options = {}) => {
    // History API changes the URL without doing a full page reload.
    history[options.replace ? "replaceState" : "pushState"]({}, "", path);
    resolve();
  };
  const link = path => ({ href: path, onClick$prevent: event => {
    // Ctrl/Cmd-click is left alone so opening a new tab still works.
    if (!event.metaKey && !event.ctrlKey) navigate(path);
  } });
  // popstate handles the browser back and forward buttons.
  if (typeof window !== "undefined") window.addEventListener("popstate", resolve);
  resolve();
  return { view: () => current ? current.route.view(current.params) : fallback(), navigate, link, match };
}
