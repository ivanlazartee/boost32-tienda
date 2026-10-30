// Carrito lateral (drawer)
import { getCart, setQty, removeItem, applyCoupon, removeCoupon, computeTotals } from "./cart.js";
import { getSettings } from "../services/settingsService.js";
import { money } from "../utils/format.js";
import { icon } from "../utils/icons.js";
import { thumb } from "../utils/image.js";
import { esc } from "../utils/dom.js";
import { toast } from "../utils/ui.js";

let root = null;
let settings = null;

export async function openCart() {
  settings ??= await getSettings();
  if (root) return;

  root = document.createElement("div");
  root.className = "drawer-root";
  root.innerHTML = `
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer__head">
        <h2 class="drawer__title" id="drawer-title">Tu carrito</h2>
        <button class="btn btn--icon" data-close aria-label="Cerrar carrito">${icon("x")}</button>
      </div>
      <div id="drawer-content" style="display:contents"></div>
    </aside>`;

  root.addEventListener("click", onClick);
  root.addEventListener("submit", onSubmit);
  document.body.append(root);
  document.body.style.overflow = "hidden";
  paint();
  root.querySelector("[data-close]").focus();
}

export function closeCart() {
  if (!root) return;
  root.remove();
  root = null;
  document.body.style.overflow = "";
}

window.addEventListener("cart:changed", () => root && paint());
window.addEventListener("hashchange", closeCart);
document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

function paint() {
  const cart = getCart();
  const content = root.querySelector("#drawer-content");
  root.querySelector("#drawer-title").textContent = cart.count ? `Tu carrito (${cart.count})` : "Tu carrito";

  if (!cart.items.length) {
    content.innerHTML = `
      <div class="drawer__body">
        <div class="cart-empty">
          ${icon("bag")}
          <p class="section-title">Tu carrito está vacío</p>
          <p class="text-sm text-muted" style="margin:6px 0 var(--sp-5)">Sumá algo que te guste y volvé acá.</p>
          <a href="#/tienda" class="btn btn--primary">Ver productos</a>
        </div>
      </div>`;
    return;
  }

  const totals = computeTotals({ freeShippingFrom: settings.freeShippingFrom });
  const missing = Math.max(settings.freeShippingFrom - totals.subtotal, 0);
  const progress = Math.min(totals.subtotal / settings.freeShippingFrom, 1) * 100;

  content.innerHTML = `
    <div class="ship-progress">
      ${
        totals.freeShipping
          ? `<strong class="text-accent">¡Tenés envío gratis!</strong>`
          : `Te faltan <strong>${money(missing)}</strong> para el <strong>envío gratis</strong>`
      }
      <div class="ship-progress__bar"><span style="width:${totals.freeShipping ? 100 : progress}%"></span></div>
    </div>

    <div class="drawer__body">
      ${cart.items
        .map(
          (i) => `
        <div class="cart-item" data-key="${esc(i.key)}">
          ${thumb(i, { width: 200 })}
          <div>
            <p class="cart-item__name">${esc(i.name)}</p>
            <p class="cart-item__meta">${esc(i.brand)} · Talle ${esc(i.size)}</p>
            <div class="qty qty--sm">
              <button data-qty="-1" aria-label="Restar uno">−</button>
              <span>${i.qty}</span>
              <button data-qty="1" aria-label="Sumar uno" ${i.qty >= i.maxQty ? "disabled" : ""}>+</button>
            </div>
          </div>
          <div class="cart-item__right">
            <strong class="num">${money(i.price * i.qty)}</strong>
            <button class="cart-item__remove" data-remove>Quitar</button>
          </div>
        </div>`
        )
        .join("")}
    </div>

    <div class="drawer__foot">
      ${
        cart.coupon
          ? `<div class="coupon-applied"><span>${icon("ticket", 'width="16" height="16" style="display:inline;vertical-align:-3px"')} <strong>${esc(cart.coupon.code)}</strong> aplicado</span><button data-remove-coupon>Quitar</button></div>`
          : `<form class="coupon" id="coupon-form">
              <input class="input" name="code" placeholder="Código de descuento" aria-label="Código de descuento">
              <button class="btn btn--ghost" style="height:40px">Aplicar</button>
            </form>`
      }
      <div class="summary-row"><span>Subtotal</span><span class="num">${money(totals.subtotal)}</span></div>
      ${totals.couponDiscount ? `<div class="summary-row"><span>Descuento cupón</span><span class="num text-accent">− ${money(totals.couponDiscount)}</span></div>` : ""}
      <div class="summary-row"><span>Envío</span><span>${totals.freeShipping ? '<span class="text-accent">Gratis</span>' : "Se calcula en el checkout"}</span></div>
      <div class="summary-row is-total"><span>Total</span><span class="num">${money(totals.total)}</span></div>
      <p class="text-xs text-muted" style="margin-top:6px">
        o ${money(Math.round(totals.total * (1 - settings.transferDiscount / 100)))} con transferencia (${settings.transferDiscount}% off)
      </p>
      <a href="#/checkout" class="btn btn--primary btn--block">Finalizar compra ${icon("arrowRight")}</a>
      <button class="btn btn--block" data-close style="margin-top:6px;color:var(--color-text-2)">Seguir comprando</button>
    </div>`;
}

function onClick(e) {
  if (e.target === root || e.target.closest("[data-close]")) return closeCart();

  const item = e.target.closest("[data-key]");
  if (item) {
    const key = item.dataset.key;
    const current = getCart().items.find((i) => i.key === key);
    const qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) setQty(key, current.qty + Number(qtyBtn.dataset.qty));
    if (e.target.closest("[data-remove]")) {
      removeItem(key);
      toast("Producto quitado del carrito");
    }
  }

  if (e.target.closest("[data-remove-coupon]")) removeCoupon();
}

async function onSubmit(e) {
  if (e.target.id !== "coupon-form") return;
  e.preventDefault();
  const result = await applyCoupon(e.target.code.value);
  toast(result.message, { type: result.ok ? "ok" : "error" });
}
