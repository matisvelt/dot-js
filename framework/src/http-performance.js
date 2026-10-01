// Matis: HTTP requests and virtual rendering for large collections.
export async function request(url, options = {}) {
  // Use JSON by default, but keep any headers given by the application.
  const response = await fetch(url, { ...options, headers: { Accept: "application/json", ...options.headers } });
  const type = response.headers.get("content-type") || "";
  // Parse the response according to its content type.
  const body = type.includes("json") ? await response.json() : await response.text();
  // Include the status and body so the application can show a useful error.
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status, body });
  return body;
}

export function lazyList(items, renderItem, { height = 420, rowHeight = 56, overscan = 4 } = {}) {
  // This node uses the custom rendering option from dom.js.
  return {
    renderDOM(createNode) {
      const element = document.createElement("div");
      // Only this outer element scrolls.
      element.className = "dot-lazy-list";
      Object.assign(element.style, { overflowY: "auto", height: `${height}px` });
      const spacer = document.createElement("div");
      // The spacer gives the scrollbar the height of the full list.
      Object.assign(spacer.style, { position: "relative", height: `${items.length * rowHeight}px` });
      const windowElement = document.createElement("div");
      // Visible rows are placed inside this smaller moving element.
      Object.assign(windowElement.style, { position: "absolute", left: "0", right: "0" });
      spacer.append(windowElement);
      element.append(spacer);
      const renderWindow = () => {
        // Work out which rows are visible, with a few extra on each side.
        const start = Math.max(0, Math.floor(element.scrollTop / rowHeight) - overscan);
        const end = Math.min(items.length, Math.ceil((element.scrollTop + height) / rowHeight) + overscan);
        windowElement.style.top = `${start * rowHeight}px`;
        // Replace only the small visible part instead of all 10,000 rows.
        windowElement.replaceChildren(...items.slice(start, end).map((item, index) => createNode(renderItem(item, start + index))));
      };
      element.addEventListener("scroll", renderWindow, { passive: true });
      renderWindow();
      return element;
    }
  };
}
