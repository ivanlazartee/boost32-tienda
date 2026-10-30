// Piezas de interfaz reutilizables de la tienda
import { money } from "../utils/format.js";
import { esc } from "../utils/dom.js";
import { icon } from "../utils/icons.js";
import { imageUrl } from "../utils/image.js";
import { totalStock } from "../services/productService.js";

export const CUOTAS = 3;

/** Imagen grande con fallback (iniciales de la marca si no carga). */
export function productImage(product, width = 700) {
  const url = imageUrl(product.image, width);
  const label = (product.brand || "?").slice(0, 2).toUpperCase();
  return `
    <div class="pcard__img" data-fallback="${esc(label)}" style="position:absolute;inset:0">
      ${url ? `<img src="${esc(url)}" alt="${esc(product.name)}" loading="lazy" decoding="async">` : `<span class="thumb__fallback">${esc(label)}</span>`}
    </div>`;
}

export const discountPercent = (p) =>
  p.comparePrice && p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;

export function priceBlock(p) {
  const off = discountPercent(p);
  return `
    <div class="price">
      <span class="price__now">${money(p.price)}</span>
      ${off ? `<span class="price__old">${money(p.comparePrice)}</span><span class="price__off">${off}% OFF</span>` : ""}
    </div>`;
}

export function productCard(p) {
  const out = totalStock(p) === 0;
  const off = discountPercent(p);
  const isHot = p.sold >= 100;

  return `
    <article class="pcard ${out ? "is-out" : ""}">
      <div class="pcard__media">
        ${productImage(p)}
        <div class="pcard__badges">
          ${out ? `<span class="flag flag--dark">Sin stock</span>` : ""}
          ${!out && off ? `<span class="flag flag--accent">−${off}%</span>` : ""}
          ${!out && isHot ? `<span class="flag">🔥 Top ventas</span>` : ""}
        </div>
        ${
          out
            ? ""
            : `<div class="pcard__quick">
                <a href="#/producto?id=${p.id}" class="btn btn--primary btn--block" tabindex="-1">${icon("bag")} Elegir talle</a>
              </div>`
        }
      </div>
      <div class="pcard__body">
        <p class="pcard__brand">${esc(p.brand)}</p>
        <h3 class="pcard__name"><a href="#/producto?id=${p.id}">${esc(p.name)}</a></h3>
        ${priceBlock(p)}
        <p class="pcard__cuotas">${CUOTAS} cuotas sin interés de ${money(Math.ceil(p.price / CUOTAS))}</p>
      </div>
    </article>`;
}

export function productGrid(list, extraClass = "") {
  if (!list.length) {
    return `<div class="empty"><strong>No encontramos productos</strong>Probá con otros filtros.</div>`;
  }
  return `<div class="products ${extraClass}">${list.map(productCard).join("")}</div>`;
}
