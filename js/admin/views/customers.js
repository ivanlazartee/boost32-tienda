import { getCustomers } from "../../services/customerService.js";
import { getOrders, isPaid } from "../../services/orderService.js";
import { money, date, initials, plural } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { esc, debounce } from "../../utils/dom.js";
import { loadingView } from "../../utils/ui.js";

export async function render(container) {
  container.innerHTML = loadingView();

  const [customers, orders] = await Promise.all([getCustomers(), getOrders()]);

  // Resumen por cliente: compras, total gastado, última compra
  const rows = customers
    .map((c) => {
      const own = orders.filter((o) => o.customerId === c.id);
      const paid = own.filter(isPaid);
      return {
        ...c,
        ordersCount: own.length,
        spent: paid.reduce((s, o) => s + o.total, 0),
        lastOrder: own[0]?.createdAt ?? null,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const repeat = rows.filter((r) => r.ordersCount > 1).length;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Clientes</h1>
        <p class="page-subtitle">${plural(rows.length, "cliente", "clientes")} · ${repeat} volvieron a comprar</p>
      </div>
    </div>

    <section class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))">
      <article class="card kpi"><p class="kpi__label">${icon("users")} Clientes</p><p class="kpi__value">${rows.length}</p></article>
      <article class="card kpi"><p class="kpi__label">${icon("cart")} Recompra</p><p class="kpi__value">${Math.round((repeat / rows.length) * 100)}%</p></article>
      <article class="card kpi"><p class="kpi__label">${icon("cash")} Gasto promedio</p><p class="kpi__value">${money(Math.round(totalSpent / rows.length))}</p></article>
    </section>

    <section class="card">
      <div class="toolbar">
        <label class="field-search">
          ${icon("search")}
          <span class="sr-only">Buscar cliente</span>
          <input class="input" type="search" id="f-q" placeholder="Buscar por nombre, email o ciudad…">
        </label>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Cliente</th><th>Ubicación</th><th>Pedidos</th><th>Última compra</th><th class="text-right">Total gastado</th><th class="col-actions"></th></tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>
  `;

  const tbody = container.querySelector("#rows");
  const paint = (term = "") => {
    const list = rows.filter((r) => `${r.name} ${r.email} ${r.city} ${r.province}`.toLowerCase().includes(term));
    tbody.innerHTML = list.length
      ? list
          .map(
            (r) => `
        <tr>
          <td>
            <div class="product-cell">
              <span class="avatar">${initials(r.name)}</span>
              <div>
                <p class="product-cell__name">${esc(r.name)}</p>
                <p class="product-cell__meta">${esc(r.email)}</p>
              </div>
            </div>
          </td>
          <td class="text-2">${esc(r.city)}<div class="text-xs text-muted">${esc(r.province)}</div></td>
          <td class="num">${r.ordersCount}${r.ordersCount > 1 ? ' <span class="badge badge--accent badge--plain">Recurrente</span>' : ""}</td>
          <td class="text-2">${r.lastOrder ? date(r.lastOrder) : "—"}</td>
          <td class="text-right num"><strong>${money(r.spent)}</strong></td>
          <td class="col-actions">
            <a class="btn btn--icon" href="https://wa.me/549${esc(r.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp a ${esc(r.name)}">${icon("whatsapp")}</a>
          </td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="6"><div class="empty"><strong>Sin resultados</strong>No encontramos clientes con ese dato.</div></td></tr>`;
  };

  container.querySelector("#f-q").addEventListener("input", debounce((e) => paint(e.target.value.trim().toLowerCase()), 150));
  paint();
}
