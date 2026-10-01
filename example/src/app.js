// Import everything through the framework's public entry point.
import {
  h,
  component,
  createStore,
  createRouter,
  mount,
  request,
  lazyList
} from "/framework/src/index.js";

// Load saved tasks when the page opens. If there are none, add one example task.
const saved = JSON.parse(localStorage.getItem("dot.tasks") || "null");
const store = createStore({
  tasks: saved || [
    { id: crypto.randomUUID(), title: "Read the Dot.js guide", done: false }
  ],
  filter: "all",
  quote: null,
  loading: false,
  error: ""
});

// Save the task list whenever that part of the state changes.
store.select(
  state => state.tasks,
  tasks => localStorage.setItem("dot.tasks", JSON.stringify(tasks))
);

// This button is reused in the task form and the remote data example.
const Button = component(({ children, kind = "primary", ...props }) =>
  h("button", { className: `button ${kind}`, ...props }, children)
);

// Shell contains the layout shared by every page.
const Shell = component(({ children }) =>
  h("div", { className: "shell" },
    h("header", {},
      h("a", { ...router.link("/"), className: "brand" },
        h("span", {}, "."),
        "js"
      ),
      h("nav", {},
        h("a", router.link("/"), "Tasks"),
        h("a", router.link("/performance"), "10k demo"),
        h("a", router.link("/about"), "About")
      )
    ),
    h("main", {}, children)
  )
);

// This helper keeps all task array updates in one place.
function updateTasks(changeTasks) {
  store.set(state => ({ tasks: changeTasks(state.tasks) }));
}

const Tasks = component(() => {
  const state = store.get();

  // Keep only the tasks selected by the current filter.
  const shown = state.tasks.filter(task =>
    state.filter === "all" || (state.filter === "done") === task.done
  );

  return h("section", {},
    h("div", { className: "hero" },
      h("p", { className: "eyebrow" }, "DOT.JS EXAMPLE"),
      h("h1", {}, "Small tasks, clear head."),
      h("p", {}, "A complete application built with a framework small enough to understand.")
    ),

    // $prevent stops the browser from reloading after form submission.
    h("form", {
      className: "composer",
      onSubmit$prevent: event => {
        const input = event.currentTarget.elements.title;
        const title = input.value.trim();
        if (title) {
          updateTasks(tasks => [
            ...tasks,
            { id: crypto.randomUUID(), title, done: false }
          ]);
        }
        input.value = "";
      }
    },
    h("input", {
      name: "title",
      placeholder: "What needs doing?",
      required: true,
      autocomplete: "off"
    }),
    h(Button, { type: "submit" }, "Add task")),

    h("div", { className: "toolbar" },
      h("div", { className: "filters" },
        ["all", "active", "done"].map(filter =>
          h("button", {
            className: state.filter === filter ? "active" : "",
            onClick: () => store.set({ filter })
          }, filter)
        )
      ),
      h("span", {}, `${state.tasks.filter(task => !task.done).length} remaining`)
    ),

    // One delegated click listener handles all task buttons in the list.
    h("ul", {
      className: "tasks",
      delegate: {
        click: {
          "[data-toggle]": (_, target) => updateTasks(tasks =>
            tasks.map(task => task.id === target.dataset.toggle
              ? { ...task, done: !task.done }
              : task)
          ),
          "[data-delete]": (_, target) => updateTasks(tasks =>
            tasks.filter(task => task.id !== target.dataset.delete)
          )
        }
      }
    }, shown.map(task =>
      h("li", { className: task.done ? "done" : "" },
        h("button", {
          className: "check",
          "data-toggle": task.id,
          "aria-label": "Toggle task"
        }, task.done ? "✓" : ""),
        h("span", {}, task.title),
        h("button", {
          className: "delete",
          "data-delete": task.id,
          "aria-label": "Delete task"
        }, "×")
      )
    )),

    !shown.length && h("p", { className: "empty" }, "Nothing here. A rare and beautiful sight."),

    // This section demonstrates an HTTP request and loading state.
    h("aside", { className: "quote" },
      h("div", {},
        h("strong", {}, "Remote data"),
        h("p", {}, state.loading
          ? "Loading…"
          : state.quote || "Fetch a piece of advice through Dot.request().")
      ),
      h(Button, {
        kind: "quiet",
        disabled: state.loading,
        onClick: async () => {
          store.set({ loading: true, error: "" });
          try {
            const data = await request("https://api.adviceslip.com/advice");
            store.set({ quote: data.slip.advice });
          } catch (error) {
            store.set({ error: error.message, quote: "The request failed. Try again." });
          } finally {
            store.set({ loading: false });
          }
        }
      }, "Fetch advice")
    )
  );
});

// This page proves that the virtual list can handle a large amount of data.
const Performance = component(() =>
  h("section", {},
    h("div", { className: "page-heading" },
      h("p", { className: "eyebrow" }, "VIRTUAL RENDERING"),
      h("h1", {}, "10,000 rows. Only ~20 in the DOM."),
      h("p", {}, "Inspect the list while scrolling: Dot renders only the visible window plus a small buffer.")
    ),
    lazyList(
      Array.from({ length: 10000 }, (_, index) => `Generated item ${index + 1}`),
      (item, index) => h("div", { className: "virtual-row" },
        h("span", {}, String(index + 1).padStart(5, "0")),
        item
      ),
      { height: 440, rowHeight: 52 }
    )
  )
);

// A small third page is useful for showing route changes.
const About = component(() =>
  h("section", { className: "about page-heading" },
    h("p", { className: "eyebrow" }, "ABOUT"),
    h("h1", {}, "No magic. Just JavaScript."),
    h("p", {}, "Dot.js turns small virtual node descriptions into DOM, connects shared state, handles routes and events, and wraps HTTP requests."),
    h("a", { ...router.link("/"), className: "text-link" }, "← Back to tasks")
  )
);

// Match each URL to the component which should be displayed.
const router = createRouter([
  { path: "/", view: () => h(Tasks) },
  { path: "/performance", view: () => h(Performance) },
  { path: "/about", view: () => h(About) }
]);

// Start the application inside the #app element from index.html.
mount(document.querySelector("#app"), () => h(Shell, {}, router.view()));
