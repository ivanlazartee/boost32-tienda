// Punto de entrada de la tienda online
import { createRouter } from "../admin/router.js";
import { icon } from "../utils/icons.js";
import { $, $$, esc } from "../utils/dom.js";
import { installImageFallback } from "../utils/image.js";
import { getCategories } from "../services/categoryService.js";
import { getSettings } from "../services/settingsService.js";
import { getCart } from "./cart.js";
import { openCart } from "./drawer.js";

const routes = {
  "": () => import("./views/home.js"),
  tienda: () => import("./views/catalog.js"),
  producto: () => import("./views/product.js"),
  checkout: () => import("./views/checkout.js"),
  ayuda: () => import("./views/help.js"),
};

async function setupShell() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  // Menú principal (desktop + mobile)
  const main = ["zapatillas", "buzos", "camperas", "remeras", "jeans", "accesorios"];
  const links = [
    { href: "#/tienda", text: "Todo", key: "todo" },
    ...main.map((id) => ({ href: `#/tienda?cat=${id}`, text: categories.find((c) => c.id === id)?.name ?? id, key: id })),
    { href: "#/tienda?ofertas=1", text: "Ofertas", key: "ofertas", sale: true },
  ];

  $("#menu").innerHTML = links
    .map((l) => `<a href="${l.href}" data-key="${l.key}" class="${l.sale ? "is-sale" : ""}">${esc(l.text)}</a>`)
    .join("");
  $("#mobile-menu").innerHTML = links
    .map((l) => `<a class="mobile-nav__link" href="${l.href}">${esc(l.text)}</a>`)
    .join("");

  $("#footer-cats").innerHTML = categories
    .map((c) => `<li><a href="#/tienda?cat=${c.id}">${esc(c.name)}</a></li>`)
    .join("");

  $("#footer-contact").innerHTML = `
    <li>${esc(settings.address)}</li>
    <li>${esc(settings.hours)}</li>
    <li><a href="https://instagram.com/${esc(settings.instagram.replace("@", ""))}" target="_blank" rel="noopener">${esc(settings.instagram)}</a></li>
    <li><a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></li>`;

  $("#wa-float").href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("¡Hola BoosT32! Quería hacer una consulta 👟")}`;
  $("#year").textContent = new Date().getFullYear();

  // Íconos estáticos del HTML
  $$("[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute("data-icon");
  });

  // Menú mobile
  const mobile = $("#mobile-nav");
  $("#burger").addEventListener("click", () => (mobile.hidden = false));
  $("#mobile-close").addEventListener("click", () => (mobile.hidden = true));
  mobile.addEventListener("click", (e) => {
    if (e.target.closest("a")) mobile.hidden = true;
  });

  // Buscador
  const bar = $("#search-bar");
  $("#search-btn").addEventListener("click", () => {
    bar.hidden = !bar.hidden;
    $("#search-btn").setAttribute("aria-expanded", String(!bar.hidden));
    if (!bar.hidden) bar.querySelector("input").focus();
  });
  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    location.hash = `#/tienda${q ? `?q=${encodeURIComponent(q)}` : ""}`;
    bar.hidden = true;
  });

  // Carrito
  $("#cart-btn").addEventListener("click", openCart);
  window.addEventListener("cart:changed", (e) => updateCartCount(e.detail.count, true));
  updateCartCount(getCart().count);
}

function updateCartCount(count, bump = false) {
  const el = $("#cart-count");
  el.textContent = count;
  el.hidden = count === 0;
  if (bump) {
    el.classList.remove("is-bump");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("is-bump");
  }
}

/** Marca activo el link del menú según la ruta actual. */
function highlightMenu() {
  const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const isShop = location.hash.startsWith("#/tienda");
  const key = !isShop ? null : params.get("ofertas") ? "ofertas" : params.get("cat") ?? (params.get("q") ? null : "todo");
  $$("#menu a").forEach((a) => a.classList.toggle("is-active", a.dataset.key === key));
}

installImageFallback();
await setupShell();

createRouter({
  routes,
  fallback: "",
  container: $("#view"),
  onChange: highlightMenu,
}).start();
