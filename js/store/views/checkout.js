import { getCart, computeTotals, clearCart } from "../cart.js";
import { getSettings } from "../../services/settingsService.js";
import { createOrder, PAYMENT_METHODS, SHIPPING_METHODS } from "../../services/orderService.js";
import { money } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { thumb } from "../../utils/image.js";
import { esc } from "../../utils/dom.js";
import { toast } from "../../utils/ui.js";

const SHIPPING = [
  { id: "moto", label: "Moto en el día", detail: "San Miguel de Tucumán y Yerba Buena", cost: 3000 },
  { id: "andreani", label: "Andreani a domicilio", detail: "Todo el país · 2 a 5 días hábiles", cost: 9900 },
  { id: "correo", label: "Correo Argentino", detail: "Todo el país · 3 a 6 días hábiles", cost: 8500 },
  { id: "retiro", label: "Retiro en el local", detail: "Sin cargo · Listo en 2 horas", cost: 0 },
];

const PROVINCES = ["Tucumán", "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego"];

export async function render(container) {
  const settings = await getSettings();
  const cart = getCart();

  if (!cart.items.length) {
    container.innerHTML = `
      <div class="container success">
        <h1>Tu carrito<br>está vacío</h1>
        <p>Sumá productos para poder finalizar la compra.</p>
        <a href="#/tienda" class="btn btn--primary btn--lg">Ir a la tienda</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="container">
      <nav class="breadcrumb" aria-label="Ubicación"><a href="#/">Inicio</a><span>/</span><span>Checkout</span></nav>
      <div class="checkout">
        <form id="checkout-form" novalidate>
          <h1>Finalizar compra</h1>

          <section class="step">
            <h2 class="step__title"><span class="step__num">1</span> Tus datos</h2>
            <div class="form-grid">
              <label class="field span-2"><span class="field__label">Nombre y apellido</span>
                <input class="input" name="name" autocomplete="name" required></label>
              <label class="field"><span class="field__label">Email</span>
                <input class="input" name="email" type="email" autocomplete="email" required></label>
              <label class="field"><span class="field__label">WhatsApp</span>
                <input class="input" name="phone" type="tel" autocomplete="tel" placeholder="381 555 1234" required></label>
            </div>
          </section>

          <section class="step">
            <h2 class="step__title"><span class="step__num">2</span> Entrega</h2>
            <div class="options">
              ${SHIPPING.map(
                (s, i) => `
                <label class="option">
                  <input type="radio" name="shipping" value="${s.id}" ${i === 1 ? "checked" : ""}>
                  <span class="option__main"><strong>${s.label}</strong><span>${s.detail}</span></span>
                  <span class="option__price" data-ship-price="${s.id}"></span>
                </label>`
              ).join("")}
            </div>
            <div class="form-grid" id="address" style="margin-top:var(--sp-5)">
              <label class="field span-2"><span class="field__label">Dirección</span>
                <input class="input" name="street" autocomplete="street-address" placeholder="Calle, número, piso/depto" required></label>
              <label class="field"><span class="field__label">Ciudad</span>
                <input class="input" name="city" autocomplete="address-level2" required></label>
              <label class="field"><span class="field__label">Provincia</span>
                <select class="select" name="province">${PROVINCES.map((p) => `<option>${p}</option>`).join("")}</select></label>
              <label class="field"><span class="field__label">Código postal</span>
                <input class="input" name="zip" inputmode="numeric" autocomplete="postal-code" required></label>
            </div>
          </section>

          <section class="step">
            <h2 class="step__title"><span class="step__num">3</span> Pago</h2>
            <div class="options">
              <label class="option">
                <input type="radio" name="payment" value="mercadopago" checked>
                <span class="option__main"><strong>Mercado Pago / tarjeta</strong><span>${settings.installments} cuotas sin interés · Débito, crédito o dinero en cuenta</span></span>
              </label>
              <label class="option">
                <input type="radio" name="payment" value="transferencia">
                <span class="option__main"><strong>Transferencia bancaria</strong><span>${settings.transferDiscount}% de descuento · Te pasamos el alias al confirmar</span></span>
                <span class="badge badge--accent badge--plain">−${settings.transferDiscount}%</span>
              </label>
            </div>
          </section>
        </form>

        <aside class="order-box" aria-label="Resumen del pedido">
          <h2 class="section-title" style="margin-bottom:var(--sp-3)">Tu pedido</h2>
          <div>
            ${cart.items
              .map(
                (i) => `
              <div class="cart-item">
                <div style="position:relative">${thumb(i, { width: 160 })}<span class="cart-count thumb__qty">${i.qty}</span></div>
                <div>
                  <p class="cart-item__name">${esc(i.name)}</p>
                  <p class="cart-item__meta">Talle ${esc(i.size)}</p>
                </div>
                <strong class="num text-sm">${money(i.price * i.qty)}</strong>
              </div>`
              )
              .join("")}
          </div>
          <div id="totals" style="margin-top:var(--sp-4)"></div>
          <button class="btn btn--primary btn--block btn--lg" style="margin-top:var(--sp-5)" type="submit" form="checkout-form" id="pay-btn">
            Confirmar pedido
          </button>
          <p class="text-xs text-muted" style="margin-top:var(--sp-3);text-align:center">
            ${icon("shield", 'width="14" height="14" style="display:inline;vertical-align:-2px"')} Compra protegida · Datos seguros
          </p>
        </aside>
      </div>
    </div>`;

  const form = container.querySelector("#checkout-form");

  const currentTotals = () => {
    const ship = SHIPPING.find((s) => s.id === form.shipping.value);
    return computeTotals({
      shippingCost: ship.cost,
      transferPercent: form.payment.value === "transferencia" ? settings.transferDiscount : 0,
      freeShippingFrom: settings.freeShippingFrom,
    });
  };

  const paintTotals = () => {
    const t = currentTotals();
    const isPickup = form.shipping.value === "retiro";
    container.querySelector("#address").hidden = isPickup;

    SHIPPING.forEach((s) => {
      container.querySelector(`[data-ship-price="${s.id}"]`).innerHTML =
        s.cost === 0 || t.freeShipping ? '<span class="text-accent">Gratis</span>' : money(s.cost);
    });

    container.querySelector("#totals").innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span class="num">${money(t.subtotal)}</span></div>
      ${t.couponDiscount ? `<div class="summary-row"><span>Cupón ${esc(getCart().coupon.code)}</span><span class="num text-accent">− ${money(t.couponDiscount)}</span></div>` : ""}
      ${t.transferDiscount ? `<div class="summary-row"><span>Descuento transferencia</span><span class="num text-accent">− ${money(t.transferDiscount)}</span></div>` : ""}
      <div class="summary-row"><span>Envío</span><span class="num">${t.shipping ? money(t.shipping) : '<span class="text-accent">Gratis</span>'}</span></div>
      <div class="summary-row is-total"><span>Total</span><span class="num">${money(t.total)}</span></div>
      ${form.payment.value === "mercadopago" ? `<p class="text-xs text-muted" style="text-align:right">o ${settings.installments} cuotas de ${money(Math.ceil(t.total / settings.installments))}</p>` : ""}`;
  };

  form.addEventListener("change", paintTotals);
  form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
  paintTotals();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isPickup = form.shipping.value === "retiro";
    const required = ["name", "email", "phone", ...(isPickup ? [] : ["street", "city", "zip"])];
    let firstInvalid = null;

    required.forEach((name) => {
      const input = form.elements[name];
      const valid = input.value.trim() && (name !== "email" || /\S+@\S+\.\S+/.test(input.value));
      input.classList.toggle("is-invalid", !valid);
      if (!valid && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      toast("Revisá los datos marcados en rojo", { type: "error" });
      return;
    }

    const btn = container.querySelector("#pay-btn");
    btn.disabled = true;
    btn.textContent = "Procesando…";

    const t = currentTotals();
    const cartNow = getCart();
    const order = await createOrder({
      customer: {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        address: isPickup ? null : `${form.street.value.trim()}, ${form.city.value.trim()}, ${form.province.value} (${form.zip.value.trim()})`,
      },
      items: cartNow.items.map(({ productId, name, brand, image, size, qty, price }) => ({ productId, name, brand, image, size, qty, price })),
      payment: form.payment.value,
      shipping: form.shipping.value,
      coupon: cartNow.coupon?.code ?? null,
      subtotal: t.subtotal,
      discount: t.couponDiscount + t.transferDiscount,
      shippingCost: t.shipping,
      total: t.total,
    });

    clearCart();
    renderSuccess(container, order, settings);
  });
}

function renderSuccess(container, order, settings) {
  const isTransfer = order.payment === "transferencia";
  const firstName = order.customer.name.split(" ")[0];

  const summary = [
    `¡Hola ${settings.storeName}! Soy ${order.customer.name} y acabo de hacer el pedido #${order.id}:`,
    ...order.items.map((i) => `• ${i.qty}× ${i.name} (talle ${i.size})`),
    `Total: ${money(order.total)}`,
    `Pago: ${PAYMENT_METHODS[order.payment]} · Entrega: ${SHIPPING_METHODS[order.shipping]}`,
  ].join("\n");

  container.innerHTML = `
    <div class="container success">
      <div class="success__icon">${icon("check")}</div>
      <h1>¡Gracias, ${esc(firstName)}!</h1>
      <p>Recibimos tu pedido <strong class="mono" style="color:var(--color-text)">#${order.id}</strong> por <strong style="color:var(--color-text)">${money(order.total)}</strong>.
        Te mandamos el detalle a ${esc(order.customer.email)}.</p>

      ${
        isTransfer
          ? `<div class="transfer-box">
              <strong>Datos para transferir</strong>
              <p class="text-xs text-muted">Mandanos el comprobante por WhatsApp y despachamos tu pedido.</p>
              <dl>
                <dt>Alias</dt><dd>BOOST32.TIENDA</dd>
                <dt>CBU</dt><dd>0000003100012345678901</dd>
                <dt>Titular</dt><dd>BoosT32 S.R.L.</dd>
                <dt>Monto</dt><dd>${money(order.total)}</dd>
              </dl>
            </div>`
          : `<p class="text-sm">En un sitio real, acá te redirigimos a <strong>Mercado Pago</strong> para completar el pago.</p>`
      }

      <div style="display:flex;gap:var(--sp-3);justify-content:center;flex-wrap:wrap">
        <a class="btn btn--whatsapp btn--lg" href="https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(summary)}" target="_blank" rel="noopener">
          ${icon("whatsapp")} Enviar pedido por WhatsApp
        </a>
        <a class="btn btn--ghost btn--lg" href="#/tienda">Seguir comprando</a>
      </div>
    </div>`;
  window.scrollTo({ top: 0 });
}
