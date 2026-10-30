import {
  getOrders,
  updateOrderStatus,
  statusInfo,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
} from "../../services/orderService.js";
import { getCustomers } from "../../services/customerService.js";
import { getSettings } from "../../services/settingsService.js";
import { money, relative, dateLong, time, plural } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { thumb } from "../../utils/image.js";
import { esc, debounce } from "../../utils/dom.js";
import { openModal, closeModal, toast, loadingView } from "../../utils/ui.js";

const state = { orders: [], customers: new Map(), settings: null, tab: "todos", q: "" };

export async function render(container, query) {
  container.innerHTML = loadingView();

  const [orders, customers, settings] = await Promise.all([getOrders(), getCustomers(), getSettings()]);
  state.orders = orders;
  state.customers = new Map(customers.map((c) => [c.id, c]));
  state.settings = settings;
  state.tab = query.estado ?? "todos";
  state.q = "";

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Pedidos</h1>
        <p class="page-subtitle">Seguimiento de ventas, pagos y envíos</p>
      </div>
    </div>

    <section class="card">
      <div class="tabs" role="tablist" id="tabs"></div>
      <div class="toolbar">
        <label class="field-search">
          ${icon("search")}
          <span class="sr-only">Buscar pedido</span>
          <input class="input" type="search" id="f-q" placeholder="Buscar por número de pedido o cliente…">
        </label>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Pago</th>
              <th>Envío</th>
              <th>Estado</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>
  `;

  container.querySelector("#f-q").addEventListener(
    "input",
    debounce((e) => {
      state.q = e.target.value.trim().toLowerCase();
      renderRows(container);
    }, 150)
  );

  renderTabs(container);
  renderRows(container);

  if (query.id) {
    const order = state.orders.find((o) => o.id === query.id);
    if (order) openOrderDetail(container, order);
  }
}

function renderTabs(container) {
  const count = (id) => (id === "todos" ? state.orders.length : state.orders.filter((o) => o.status === id).length);
  const tabs = [{ id: "todos", label: "Todos" }, ...ORDER_STATUSES];
  const el = container.querySelector("#tabs");

  el.innerHTML = tabs
    .map(
      (t) => `
      <button class="tab ${state.tab === t.id ? "is-active" : ""}" role="tab" aria-selected="${state.tab === t.id}" data-tab="${t.id}">
        ${esc(t.label)} <span class="tab__count">${count(t.id)}</span>
      </button>`
    )
    .join("");

  el.onclick = (e) => {
    const btn = e.target.closest("[data-tab]");
    if (!btn) return;
    state.tab = btn.dataset.tab;
    renderTabs(container);
    renderRows(container);
  };
}

function renderRows(container) {
  const tbody = container.querySelector("#rows");
  const list = state.orders.filter((o) => {
    if (state.tab !== "todos" && o.status !== state.tab) return false;
    if (!state.q) return true;
    const c = state.customers.get(o.customerId);
    return `${o.id} ${c?.name ?? ""} ${c?.city ?? ""}`.toLowerCase().includes(state.q);
  });

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><strong>No hay pedidos acá</strong>Cuando entren pedidos con este estado, aparecen en esta lista.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((o) => {
      const c = state.customers.get(o.customerId);
      const s = statusInfo(o.status);
      const units = o.items.reduce((n, i) => n + i.qty, 0);
      return `
      <tr class="is-clickable" data-id="${o.id}" tabindex="0">
        <td><span class="mono"><strong>#${o.id}</strong></span><div class="text-xs text-muted">${relative(o.createdAt)}</div></td>
        <td>${esc(c?.name ?? "—")}<div class="text-xs text-muted">${esc(c?.city ?? "")}</div></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            ${o.items.slice(0, 3).map((i) => thumb(i, { size: "thumb--sm", width: 120 })).join("")}
            <span class="text-xs text-muted">${plural(units, "unidad", "unidades")}</span>
          </div>
        </td>
        <td class="text-2">${PAYMENT_METHODS[o.payment]}</td>
        <td class="text-2">${SHIPPING_METHODS[o.shipping]}</td>
        <td><span class="badge badge--${s.tone}">${s.label}</span></td>
        <td class="text-right num"><strong>${money(o.total)}</strong></td>
      </tr>`;
    })
    .join("");

  const open = (row) => openOrderDetail(container, state.orders.find((o) => o.id === row.dataset.id));
  tbody.onclick = (e) => {
    const row = e.target.closest("tr[data-id]");
    if (row) open(row);
  };
  tbody.onkeydown = (e) => {
    const row = e.target.closest("tr[data-id]");
    if (row && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open(row);
    }
  };
}

function openOrderDetail(container, order) {
  const c = state.customers.get(order.customerId);
  const flow = ["pendiente", "pagado", "enviado", "entregado"];
  const reached = flow.indexOf(order.status);

  const waText = encodeURIComponent(
    `¡Hola ${c?.name.split(" ")[0] ?? ""}! Te escribimos de ${state.settings.storeName} por tu pedido #${order.id}. ` +
      `Estado actual: ${statusInfo(order.status).label}.`
  );
  const waLink = `https://wa.me/549${c?.phone ?? ""}?text=${waText}`;

  openModal({
    title: `Pedido #${order.id}`,
    size: "modal--lg",
    body: `
      ${
        order.status === "cancelado"
          ? `<p class="badge badge--danger" style="margin-bottom:var(--sp-5)">Pedido cancelado</p>`
          : `<div class="steps" aria-label="Progreso del pedido">
              ${flow.map((s, i) => `<div class="steps__item ${i <= reached ? "is-done" : ""}">${statusInfo(s).label}</div>`).join("")}
            </div>`
      }

      <dl class="order-meta">
        <div><dt>Cliente</dt><dd>${esc(c?.name ?? "—")}</dd></div>
        <div><dt>Ciudad</dt><dd>${esc(c ? `${c.city}, ${c.province}` : "—")}</dd></div>
        <div><dt>Fecha</dt><dd>${dateLong(order.createdAt)} · ${time(order.createdAt)}</dd></div>
        <div><dt>Pago</dt><dd>${PAYMENT_METHODS[order.payment]}</dd></div>
        <div><dt>Envío</dt><dd>${SHIPPING_METHODS[order.shipping]}</dd></div>
        <div><dt>Contacto</dt><dd>${esc(c?.email ?? "—")}</dd></div>
      </dl>

      <ul class="list order-items">
        ${order.items
          .map(
            (i) => `
          <li class="list__item">
            ${thumb(i)}
            <div class="list__main">
              <p class="list__title">${esc(i.name)}</p>
              <p class="list__meta">Talle ${esc(i.size)} · ${i.qty} × ${money(i.price)}</p>
            </div>
            <span class="list__value">${money(i.price * i.qty)}</span>
          </li>`
          )
          .join("")}
      </ul>

      <div class="order-totals num">
        <div><span>Subtotal</span><span>${money(order.subtotal)}</span></div>
        ${order.discount ? `<div><span>Descuento transferencia</span><span>− ${money(order.discount)}</span></div>` : ""}
        <div><span>Envío</span><span>${order.shippingCost ? money(order.shippingCost) : "Gratis"}</span></div>
        <div class="is-total"><span>Total</span><span>${money(order.total)}</span></div>
      </div>

      <div class="form-section">
        <label class="field">
          <span class="field__label">Cambiar estado</span>
          <select class="select" id="od-status" style="max-width:260px">
            ${ORDER_STATUSES.map((s) => `<option value="${s.id}" ${s.id === order.status ? "selected" : ""}>${s.label}</option>`).join("")}
          </select>
        </label>
      </div>`,
    footer: `
      <a class="btn btn--whatsapp" href="${waLink}" target="_blank" rel="noopener">${icon("whatsapp")} Avisar por WhatsApp</a>
      <span style="flex:1"></span>
      <button class="btn btn--ghost" data-close>Cerrar</button>
      <button class="btn btn--primary" id="od-save">Guardar estado</button>`,
    onMount(root) {
      root.querySelector("#od-save").addEventListener("click", async () => {
        const status = root.querySelector("#od-status").value;
        if (status === order.status) {
          closeModal();
          return;
        }
        const updated = await updateOrderStatus(order.id, status);
        state.orders = state.orders.map((o) => (o.id === updated.id ? updated : o));
        closeModal();
        renderTabs(container);
        renderRows(container);
        window.dispatchEvent(new Event("orders:changed"));
        toast(`Pedido #${order.id} → ${statusInfo(status).label}`);
      });
    },
  });
}
