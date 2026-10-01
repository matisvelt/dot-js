import test from "node:test";
import assert from "node:assert/strict";
import { h, component, createStore, request } from "../src/index.js";

// Check that h() cleans up nested child arrays correctly.
test("h flattens and filters children", () => {
  const node = h("div", { className: "box" }, "a", [null, h("span", {}, "b")], false);
  assert.equal(node.type, "div");
  assert.equal(node.children.length, 2);
  assert.equal(node.children[1].type, "span");
});

// Check that a component receives both its named props and children.
test("component passes props and children", () => {
  const Greeting = component(({ name, children }) => h("p", {}, name, children));
  const result = Greeting({ name: "Dot" }, "!");
  assert.deepEqual(result.children, ["Dot", "!"]);
});

// Check normal state updates, selected values, and unsubscribing.
test("store updates, merges, subscribes and selects", async () => {
  const store = createStore({ count: 0, label: "a" });
  const updates = [];
  const selected = [];
  // This listener watches all store updates.
  const unsubscribe = store.subscribe(value => updates.push(value.count));
  // This listener only watches the label.
  store.select(value => value.label, value => selected.push(value));
  store.set({ count: 1 });
  store.set(value => ({ count: value.count + 1 }));
  store.set({ label: "b" });
  unsubscribe();
  // The final update must not appear in the unsubscribed updates array.
  store.set({ count: 3 });
  assert.deepEqual(updates, [1, 2, 2]);
  assert.deepEqual(selected, ["b"]);
  assert.deepEqual(store.get(), { count: 3, label: "b" });
});

// Replace fetch for this test so no real internet request is needed.
test("request parses JSON and reports HTTP errors", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  assert.deepEqual(await request("/ok"), { ok: true });
  // The second fake response checks the error information.
  globalThis.fetch = async () => new Response("nope", { status: 418, headers: { "content-type": "text/plain" } });
  await assert.rejects(request("/bad"), error => error.status === 418 && error.body === "nope");
  globalThis.fetch = original;
});
