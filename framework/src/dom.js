// Martin: DOM rendering, reusable components, attributes, forms, and events.
const TEXT = Symbol("text");
// Every mounted application is kept here so redraw() can update it.
const mounts = new Set();

// h() makes a simple JavaScript description of an HTML element.
export function h(type, props, ...children) {
  return { type, props: props || {}, children: children.flat(Infinity).filter(value => value !== null && value !== undefined && value !== false) };
}

export function component(render) {
  // A component is a function that receives props and child elements.
  const Component = (props = {}, ...children) => render({ ...props, children });
  Component.displayName = render.name || "Component";
  return Component;
}

function vnode(value) {
  // Text needs its own node description because it is not an HTML element.
  return typeof value === "string" || typeof value === "number"
    ? { type: TEXT, value: String(value), props: {}, children: [] }
    : value;
}

function setProp(element, originalName, value) {
  // JavaScript uses className, while HTML uses class.
  const name = originalName === "className" ? "class" : originalName;
  if (name === "style" && value && typeof value === "object") {
    // Style objects are copied onto the element's style object.
    Object.assign(element.style, value);
    return;
  }
  if (name.startsWith("on") && typeof value === "function") {
    // onClick$prevent becomes a click listener which calls preventDefault().
    const [event, ...modifiers] = name.slice(2).toLowerCase().split("$");
    element.addEventListener(event, browserEvent => {
      if (modifiers.includes("prevent")) browserEvent.preventDefault();
      if (modifiers.includes("stop")) browserEvent.stopPropagation();
      value(browserEvent);
    });
    return;
  }
  if (name === "delegate" && value) {
    // Delegation puts one listener on a parent instead of one on every child.
    for (const [event, rules] of Object.entries(value)) {
      element.addEventListener(event, browserEvent => {
        for (const [selector, handler] of Object.entries(rules)) {
          const target = browserEvent.target.closest(selector);
          if (target && element.contains(target)) return handler(browserEvent, target);
        }
      });
    }
    return;
  }
  if (["value", "checked", "selected"].includes(name)) element[name] = value;
  else if (value === true) element.setAttribute(name, "");
  else if (value !== false && value != null) element.setAttribute(name, String(value));
}

export function createNode(raw) {
  // Convert the JavaScript node description into a real browser DOM node.
  const node = vnode(raw);
  if (node.type === TEXT) return document.createTextNode(node.value);
  // Special features, such as lazyList, can provide their own renderer.
  if (typeof node.renderDOM === "function") return node.renderDOM(createNode);
  if (typeof node.type === "function") return createNode(node.type(node.props, ...node.children));
  const element = document.createElement(node.type);
  Object.entries(node.props).forEach(([key, value]) => setProp(element, key, value));
  node.children.forEach(child => element.append(createNode(child)));
  return element;
}

export function mount(root, view) {
  // Save the view and draw it inside the selected root element.
  const record = { root, view };
  record.render = () => root.replaceChildren(createNode(view()));
  mounts.add(record);
  record.render();
  return () => mounts.delete(record);
}

export function redraw() {
  // A microtask groups updates that happen during the same event.
  queueMicrotask(() => mounts.forEach(record => record.render()));
}
