// Router por hash: #/productos, #/pedidos?estado=pendiente, etc.
// Cada vista es un módulo que exporta `render(container, query)`.

export function createRouter({ routes, fallback, container, onChange }) {
  async function resolve() {
    const hash = location.hash.replace(/^#\/?/, "") || fallback;
    const [path, queryString = ""] = hash.split("?");
    const route = routes[path] ? path : fallback;
    if (route !== path) {
      location.replace(`#/${fallback}`);
      return;
    }

    const query = Object.fromEntries(new URLSearchParams(queryString));
    onChange?.(route);

    const view = await routes[route]();
    container.innerHTML = "";
    await view.render(container, query);
    container.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }

  window.addEventListener("hashchange", resolve);
  return { start: resolve, navigate: (to) => (location.hash = `#/${to}`) };
}
