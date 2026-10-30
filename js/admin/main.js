// Punto de entrada del panel de administración
import { createRouter } from "./router.js";
import { icon } from "../utils/icons.js";
import { $, $$, esc } from "../utils/dom.js";
import { installImageFallback } from "../utils/image.js";
import { getOrders } from "../services/orderService.js";
import { toast } from "../utils/ui.js";

// Cada vista se carga recién cuando se visita (import dinámico).
const routes = {
  dashboard: () => import("./views/dashboard.js"),
  productos: () => import("./views/products.js"),
  pedidos: () => import("./views/orders.js"),
  clientes: () => import("./views/customers.js"),
  categorias: () => import("./views/categories.js"),
  promociones: () => import("./views/promotions.js"),
  configuracion: () => import("./views/settings.js"),
};

const navItems = [
  { label: "General" },
  { route: "dashboard", text: "Dashboard", icon: "dashboard" },
  { route: "pedidos", text: "Pedidos", icon: "receipt", countId: "pending" },
  { label: "Catálogo" },
  { route: "productos", text: "Productos", icon: "box" },
  { route: "categorias", text: "Categorías", icon: "tags" },
  { route: "promociones", text: "Promociones", icon: "percent" },
  { label: "Tienda" },
  { route: "clientes", text: "Clientes", icon: "users" },
  { route: "configuracion", text: "Configuración", icon: "settings" },
];

function renderNav() {
  $("#nav").innerHTML = navItems
    .map((item) =>
      item.label
        ? `<p class="nav__label">${esc(item.label)}</p>`
        : `<a class="nav__link" href="#/${item.route}" data-route="${item.route}">
            ${icon(item.icon)}<span>${esc(item.text)}</span>
            ${item.countId ? `<span class="nav__count" data-count="${item.countId}" hidden></span>` : ""}
          </a>`
    )
    .join("");
}

function setActive(route) {
  $$(".nav__link").forEach((a) => {
    const active = a.dataset.route === route;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = `${$(`.nav__link[data-route="${route}"] span`)?.textContent ?? "Panel"} · BoosT32`;
  $("#app").classList.remove("is-nav-open");
}

/** Contador de pedidos pendientes en el menú. Las vistas avisan con el evento "orders:changed". */
async function refreshPendingCount() {
  const orders = await getOrders();
  const pending = orders.filter((o) => o.status === "pendiente").length;
  const badge = $('[data-count="pending"]');
  if (!badge) return;
  badge.textContent = pending;
  badge.hidden = pending === 0;
}

function hydrateStaticIcons() {
  $$("[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute("data-icon");
  });
}

function setupShell() {
  const app = $("#app");
  $("#menu-btn").addEventListener("click", () => app.classList.add("is-nav-open"));
  $("#sidebar-backdrop").addEventListener("click", () => app.classList.remove("is-nav-open"));

  // El buscador global lleva a Productos con el texto ya filtrado
  $("#global-search").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim();
    location.hash = `#/productos${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  });

  $("#notif-btn").addEventListener("click", () => {
    location.hash = "#/pedidos?estado=pendiente";
    toast("Mostrando pedidos pendientes");
  });
}

renderNav();
hydrateStaticIcons();
setupShell();
installImageFallback();
refreshPendingCount();
window.addEventListener("orders:changed", refreshPendingCount);

createRouter({
  routes,
  fallback: "dashboard",
  container: $("#view"),
  onChange: setActive,
}).start();
