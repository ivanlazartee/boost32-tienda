import { getProduct, getProducts, totalStock } from "../../services/productService.js";
import { getCategories } from "../../services/categoryService.js";
import { getSettings } from "../../services/settingsService.js";
import { productImage, priceBlock, productGrid, CUOTAS } from "../components.js";
import { addItem } from "../cart.js";
import { openCart } from "../drawer.js";
import { money } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { esc } from "../../utils/dom.js";
import { toast, loadingView } from "../../utils/ui.js";

const DESCRIPTIONS = {
  zapatillas: "Zapatilla urbana original con caja. Capellada resistente, suela de goma y plantilla acolchada para usar todo el día.",
  buzos: "Buzo de frisa premium, interior afelpado y capucha con cordón. Calce relajado, ideal para usar oversize.",
  camperas: "Campera liviana y abrigada, con bolsillos laterales y cierre frontal. Lista para el invierno tucumano.",
  remeras: "Remera de algodón peinado 24/1, cuello reforzado y calce cómodo. No se deforma con los lavados.",
  jeans: "Denim rígido de 12 oz con calce amplio. Cinco bolsillos y botón metálico.",
  bermudas: "Bermuda cómoda para el día a día, con bolsillos amplios y cintura con presillas.",
  sweaters: "Sweater tejido de hilo, suave y abrigado. Puños y cintura acanalados.",
  accesorios: "Accesorio original para completar el outfit.",
};

const SIZE_GUIDES = {
  calzado: { head: ["AR", "US", "CM"], rows: [["38", "6", "24"], ["39", "7", "25"], ["40", "7.5", "25.5"], ["41", "8.5", "26.5"], ["42", "9", "27"], ["43", "10", "28"], ["44", "10.5", "28.5"]] },
  ropa: { head: ["Talle", "Pecho (cm)", "Largo (cm)"], rows: [["S", "96", "68"], ["M", "102", "71"], ["L", "108", "74"], ["XL", "114", "76"], ["XXL", "120", "78"]] },
  pantalon: { head: ["Talle", "Cintura (cm)", "Cadera (cm)"], rows: [["38", "76", "96"], ["40", "80", "100"], ["42", "84", "104"], ["44", "88", "108"], ["46", "92", "112"], ["48", "96", "116"]] },
};

export async function render(container, query) {
  container.innerHTML = loadingView();
  const [product, all, categories, settings] = await Promise.all([
    getProduct(query.id),
    getProducts(),
    getCategories(),
    getSettings(),
  ]);

  if (!product || !product.active) {
    container.innerHTML = `
      <div class="container empty" style="padding:var(--sp-10) 0">
        <strong>Este producto no está disponible</strong>
        <p style="margin:6px 0 var(--sp-5)">Puede que se haya agotado o que el link esté mal.</p>
        <a class="btn btn--primary" href="#/tienda">Ver la tienda</a>
      </div>`;
    return;
  }

  const category = categories.find((c) => c.id === product.category);
  const sizeType = category?.sizeType ?? "ropa";
  const guide = SIZE_GUIDES[sizeType];
  const sizes = Object.entries(product.stock);
  const soldOut = totalStock(product) === 0;
  const onlySize = sizes.length === 1 ? sizes[0][0] : null;
  const transferPrice = Math.round(product.price * (1 - settings.transferDiscount / 100));

  const related = all
    .filter((p) => p.active && p.id !== product.id && p.category === product.category && totalStock(p) > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const waText = encodeURIComponent(`¡Hola! Quería consultar por ${product.name} (${product.sku}) 👟`);

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="Ubicación">
        <a href="#/">Inicio</a><span>/</span>
        <a href="#/tienda?cat=${product.category}">${esc(category?.name ?? "Tienda")}</a><span>/</span>
        <span>${esc(product.name)}</span>
      </nav>

      <div class="pdp">
        <div class="pdp__media">
          <div class="pdp__main">${productImage(product, 1200)}</div>
        </div>

        <div>
          <span class="pdp__brand">${esc(product.brand)}</span>
          <h1 class="pdp__title">${esc(product.name)}</h1>
          ${priceBlock(product)}

          <div class="pay-box">
            <div>${icon("card")} <span><strong>${CUOTAS} cuotas sin interés</strong> de ${money(Math.ceil(product.price / CUOTAS))}</span></div>
            <div>${icon("cash")} <span><strong>${money(transferPrice)}</strong> con transferencia (${settings.transferDiscount}% off)</span></div>
            <div>${icon("truck")} <span>Envío gratis en compras desde ${money(settings.freeShippingFrom)}</span></div>
          </div>

          <p class="text-sm text-2" style="margin-bottom:var(--sp-5)">Color: <strong style="color:var(--color-text)">${esc(product.color)}</strong></p>

          ${
            soldOut
              ? `<div class="pay-box" style="border-color:var(--color-danger-soft)">
                  <strong>Sin stock por ahora</strong>
                  <span class="text-sm text-2">Escribinos y te avisamos cuando vuelva a entrar.</span>
                </div>`
              : `
              <div class="pdp__label">
                <span>Talle${onlySize ? ": Único" : ""}</span>
                ${guide ? `<button type="button" id="guide-link">Guía de talles</button>` : ""}
              </div>
              ${
                onlySize
                  ? ""
                  : `<div class="size-picker" role="radiogroup" aria-label="Elegí tu talle">
                      ${sizes
                        .map(([s, q]) => `<button type="button" class="chip" role="radio" aria-checked="false" data-size="${esc(s)}" data-stock="${q}" ${Number(q) === 0 ? "disabled" : ""}>${esc(s)}</button>`)
                        .join("")}
                    </div>`
              }
              <p class="stock-note" id="stock-note" aria-live="polite"></p>

              <div class="buy-row">
                <div class="qty" aria-label="Cantidad">
                  <button type="button" data-step="-1" aria-label="Restar">−</button>
                  <span id="qty">1</span>
                  <button type="button" data-step="1" aria-label="Sumar">+</button>
                </div>
                <button class="btn btn--primary" id="add-btn">${icon("bag")} Agregar al carrito</button>
              </div>`
          }

          <a class="btn btn--ghost pdp__wa" href="https://wa.me/${settings.whatsapp}?text=${waText}" target="_blank" rel="noopener">
            ${icon("whatsapp")} Consultar por WhatsApp
          </a>

          <div class="details">
            <details open>
              <summary>Descripción</summary>
              <p>${esc(DESCRIPTIONS[product.category] ?? "")}</p>
              <p class="text-xs text-muted">SKU: <span class="mono">${esc(product.sku)}</span></p>
            </details>
            ${
              guide
                ? `<details id="guide">
                    <summary>Guía de talles</summary>
                    <table class="size-table" style="margin-bottom:var(--sp-4)">
                      <thead><tr>${guide.head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
                      <tbody>${guide.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
                    </table>
                  </details>`
                : ""
            }
            <details>
              <summary>Envíos y cambios</summary>
              <ul>
                <li>Envíos a todo el país por Andreani o Correo Argentino (2 a 6 días hábiles).</li>
                <li>En San Miguel de Tucumán y Yerba Buena, envío en moto en el día.</li>
                <li>Retiro sin cargo en el local.</li>
                <li>Primer cambio sin cargo dentro de los 30 días.</li>
              </ul>
            </details>
          </div>
        </div>
      </div>

      ${
        related.length
          ? `<section class="section">
              <div class="section-head">
                <h2 class="section-head__title">También te <em>puede gustar</em></h2>
              </div>
              ${productGrid(related)}
            </section>`
          : ""
      }
    </div>`;

  if (soldOut) return;

  // ---------- Interacción: talle + cantidad + agregar ----------
  let size = onlySize;
  let qty = 1;
  const note = container.querySelector("#stock-note");
  const qtyEl = container.querySelector("#qty");
  const maxFor = () => (size ? Number(product.stock[size]) : 1);

  const updateNote = () => {
    if (!size) return (note.textContent = "");
    const left = maxFor();
    note.textContent = left <= 2 ? `¡Quedan solo ${left}!` : "";
  };
  updateNote();

  container.querySelector(".size-picker")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-size]");
    if (!btn || btn.disabled) return;
    size = btn.dataset.size;
    container.querySelectorAll("[data-size]").forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-checked", String(active));
    });
    qty = Math.min(qty, maxFor());
    qtyEl.textContent = qty;
    updateNote();
  });

  container.querySelector(".qty").addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    if (!step) return;
    qty = Math.max(1, Math.min(qty + Number(step.dataset.step), maxFor() || 1));
    qtyEl.textContent = qty;
  });

  container.querySelector("#add-btn").addEventListener("click", () => {
    if (!size) {
      note.textContent = "Elegí un talle para continuar";
      container.querySelector(".size-picker")?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
        { duration: 250 }
      );
      return;
    }
    addItem(product, size, qty);
    toast(`${product.name} (talle ${size}) agregado`);
    openCart();
  });

  container.querySelector("#guide-link")?.addEventListener("click", () => {
    const g = container.querySelector("#guide");
    g.open = true;
    g.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
