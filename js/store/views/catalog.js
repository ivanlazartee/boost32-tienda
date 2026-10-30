import { getProducts, totalStock } from "../../services/productService.js";
import { getCategories, sizeCurves } from "../../services/categoryService.js";
import { productGrid, discountPercent } from "../components.js";
import { plural } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { esc } from "../../utils/dom.js";
import { loadingView } from "../../utils/ui.js";

const SORTS = {
  relevancia: "Más relevantes",
  vendidos: "Más vendidos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
};

export async function render(container, query) {
  container.innerHTML = loadingView();
  const [all, categories] = await Promise.all([getProducts(), getCategories()]);
  const products = all.filter((p) => p.active);

  // Los filtros viven en la URL: así se pueden compartir los links
  const f = {
    cat: query.cat ?? "",
    marca: query.marca ?? "",
    talle: query.talle ?? "",
    q: query.q ?? "",
    ofertas: query.ofertas === "1",
    orden: query.orden ?? "relevancia",
  };

  const category = categories.find((c) => c.id === f.cat);
  const title = f.q ? `“${f.q}”` : f.ofertas ? "Ofertas" : category?.name ?? "Toda la tienda";

  // Filtrar
  const term = f.q.toLowerCase();
  let list = products.filter((p) => {
    if (f.cat && p.category !== f.cat) return false;
    if (f.marca && p.brand !== f.marca) return false;
    if (f.ofertas && !discountPercent(p)) return false;
    if (f.talle && !(Number(p.stock[f.talle]) > 0)) return false;
    if (term && !`${p.name} ${p.brand} ${p.category} ${p.color}`.toLowerCase().includes(term)) return false;
    return true;
  });

  // Ordenar (los agotados siempre al final)
  const sorters = {
    // relevancia = ventas + un empujón a lo que está en oferta
    relevancia: (a, b) => b.sold + discountPercent(b) * 3 - (a.sold + discountPercent(a) * 3),
    vendidos: (a, b) => b.sold - a.sold,
    "precio-asc": (a, b) => a.price - b.price,
    "precio-desc": (a, b) => b.price - a.price,
  };
  list.sort((a, b) => (totalStock(a) === 0) - (totalStock(b) === 0) || sorters[f.orden](a, b));

  // Opciones de filtros (con cantidad)
  const base = products.filter((p) => !f.cat || p.category === f.cat);
  const brands = [...new Set(base.map((p) => p.brand))].sort();
  const sizes = category ? sizeCurves[category.sizeType] : null;

  const link = (changes) => {
    const next = { ...f, ...changes };
    const params = new URLSearchParams();
    if (next.cat) params.set("cat", next.cat);
    if (next.marca) params.set("marca", next.marca);
    if (next.talle) params.set("talle", next.talle);
    if (next.q) params.set("q", next.q);
    if (next.ofertas) params.set("ofertas", "1");
    if (next.orden !== "relevancia") params.set("orden", next.orden);
    const qs = params.toString();
    return `#/tienda${qs ? `?${qs}` : ""}`;
  };

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="Ubicación">
        <a href="#/">Inicio</a><span>/</span><a href="#/tienda">Tienda</a>${category ? `<span>/</span><span>${esc(category.name)}</span>` : ""}
      </nav>

      <div class="catalog-head">
        <h1>${esc(title)}</h1>
        <span class="text-muted text-sm">${plural(list.length, "producto", "productos")}</span>
      </div>

      <div class="catalog">
        <aside class="filters" id="filters" aria-label="Filtros">
          <div>
            <p class="filter__title">Categoría</p>
            <div class="filter__list">
              <a class="filter__opt ${!f.cat ? "is-active" : ""}" href="${link({ cat: "", talle: "" })}">Todas <small>${products.length}</small></a>
              ${categories
                .map((c) => {
                  const n = products.filter((p) => p.category === c.id).length;
                  return n ? `<a class="filter__opt ${f.cat === c.id ? "is-active" : ""}" href="${link({ cat: c.id, talle: "" })}">${esc(c.name)} <small>${n}</small></a>` : "";
                })
                .join("")}
            </div>
          </div>

          <div>
            <p class="filter__title">Marca</p>
            <div class="filter__list">
              <a class="filter__opt ${!f.marca ? "is-active" : ""}" href="${link({ marca: "" })}">Todas</a>
              ${brands
                .map((b) => `<a class="filter__opt ${f.marca === b ? "is-active" : ""}" href="${link({ marca: f.marca === b ? "" : b })}">${esc(b)} <small>${base.filter((p) => p.brand === b).length}</small></a>`)
                .join("")}
            </div>
          </div>

          ${
            sizes
              ? `<div>
                  <p class="filter__title">Talle disponible</p>
                  <div class="chips">
                    ${sizes.map((s) => `<a class="chip ${f.talle === s ? "is-active" : ""}" style="display:inline-grid;place-items:center" href="${link({ talle: f.talle === s ? "" : s })}">${esc(s)}</a>`).join("")}
                  </div>
                </div>`
              : `<p class="text-xs text-muted">Elegí una categoría para filtrar por talle.</p>`
          }

          <div>
            <a class="filter__opt ${f.ofertas ? "is-active" : ""}" href="${link({ ofertas: !f.ofertas })}">Solo ofertas ${f.ofertas ? "✓" : ""}</a>
          </div>
        </aside>

        <div>
          <div class="catalog__bar">
            <button class="btn btn--ghost filters-toggle" id="filters-toggle">${icon("filter")} Filtros</button>
            ${
              f.marca || f.talle || f.q || f.ofertas
                ? `<a href="${link({ marca: "", talle: "", q: "", ofertas: false })}" class="text-sm text-muted" style="text-decoration:underline">Limpiar filtros</a>`
                : "<span></span>"
            }
            <select class="select" id="sort" aria-label="Ordenar">
              ${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${k === f.orden ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </div>
          ${productGrid(list, "products--3")}
        </div>
      </div>
    </div>
  `;

  container.querySelector("#sort").addEventListener("change", (e) => (location.hash = link({ orden: e.target.value })));
  container.querySelector("#filters-toggle").addEventListener("click", () => container.querySelector("#filters").classList.toggle("is-open"));
}
