import { getOrders, isPaid, statusInfo } from "../../services/orderService.js";
import { getProducts, getLowStockProducts, totalStock, stockStatus } from "../../services/productService.js";
import { getCustomers } from "../../services/customerService.js";
import { getSettings } from "../../services/settingsService.js";
import { money, moneyCompact, weekday, daysAgoToDate, isSameDay, relative, plural, dateLong } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { thumb } from "../../utils/image.js";
import { esc } from "../../utils/dom.js";
import { loadingView } from "../../utils/ui.js";

export async function render(container) {
  container.innerHTML = loadingView();

  const [orders, products, lowStock, customers, settings] = await Promise.all([
    getOrders(),
    getProducts(),
    getLowStockProducts(),
    getCustomers(),
    getSettings(),
  ]);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  // ---------- Métricas ----------
  const today = new Date();
  const paid = orders.filter(isPaid);
  const sumTotal = (list) => list.reduce((s, o) => s + o.total, 0);

  const todayOrders = paid.filter((o) => isSameDay(new Date(o.createdAt), today));
  const yesterdayOrders = paid.filter((o) => isSameDay(new Date(o.createdAt), daysAgoToDate(1)));
  const todaySales = sumTotal(todayOrders);
  const yesterdaySales = sumTotal(yesterdayOrders);

  const last30 = paid.filter((o) => new Date(o.createdAt) >= daysAgoToDate(29));
  const monthSales = sumTotal(last30);
  const avgTicket = last30.length ? Math.round(monthSales / last30.length) : 0;
  const pending = orders.filter((o) => o.status === "pendiente");

  const diff = yesterdaySales ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : null;
  const trend =
    diff === null
      ? "Primer venta del período"
      : `<span class="trend ${diff >= 0 ? "trend--up" : "trend--down"}">${icon(diff >= 0 ? "arrowUp" : "arrowDown", 'width="12" height="12"')}${Math.abs(diff)}%</span> vs. ayer`;

  // ---------- Ventas últimos 7 días ----------
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = daysAgoToDate(6 - i);
    const dayOrders = paid.filter((o) => isSameDay(new Date(o.createdAt), d));
    return { date: d, total: sumTotal(dayOrders), count: dayOrders.length, isToday: i === 6 };
  });
  const weekTotal = days.reduce((s, d) => s + d.total, 0);

  // ---------- Más vendidos ----------
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const topMax = top[0]?.sold || 1;

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Hola, Marcos</h1>
        <p class="page-subtitle">Así viene ${esc(settings.storeName)} hoy · ${dateLong(today.toISOString())}</p>
      </div>
      <div class="page-head__actions">
        <a href="#/pedidos" class="btn btn--ghost">${icon("receipt")} Ver pedidos</a>
        <a href="#/productos?nuevo=1" class="btn btn--primary">${icon("plus")} Nuevo producto</a>
      </div>
    </div>

    ${
      lowStock.length
        ? `<div class="alert-strip" role="status">
            ${icon("alert")}
            <span><strong>${plural(lowStock.length, "producto", "productos")}</strong> con stock bajo o agotado.</span>
            <a href="#/productos?stock=bajo">Revisar stock →</a>
          </div>`
        : ""
    }

    <section class="kpis" aria-label="Indicadores principales">
      <article class="card kpi kpi--accent">
        <p class="kpi__label">${icon("cash")} Ventas de hoy</p>
        <p class="kpi__value">${money(todaySales)}</p>
        <p class="kpi__foot">${plural(todayOrders.length, "pedido cobrado", "pedidos cobrados")} · ${trend}</p>
      </article>
      <article class="card kpi">
        <p class="kpi__label">${icon("cart")} Ventas últimos 30 días</p>
        <p class="kpi__value">${money(monthSales)}</p>
        <p class="kpi__foot">${plural(last30.length, "pedido", "pedidos")}</p>
      </article>
      <article class="card kpi">
        <p class="kpi__label">${icon("clock")} Pedidos pendientes</p>
        <p class="kpi__value">${pending.length}</p>
        <p class="kpi__foot">Esperando pago o confirmación</p>
      </article>
      <article class="card kpi">
        <p class="kpi__label">${icon("ticket")} Ticket promedio</p>
        <p class="kpi__value">${money(avgTicket)}</p>
        <p class="kpi__foot">Últimos 30 días</p>
      </article>
    </section>

    <div class="grid-2">
      <section class="card">
        <div class="card__head">
          <h2 class="section-title">Ventas de la semana</h2>
          <span class="text-xs text-muted">Pedidos cobrados</span>
        </div>
        ${salesChart(days, weekTotal)}
      </section>

      <section class="card">
        <div class="card__head">
          <h2 class="section-title">Más vendidos</h2>
          <a href="#/productos" class="card__link">Ver todos</a>
        </div>
        <ol class="list" style="padding-top: var(--sp-3)">
          ${top
            .map(
              (p, i) => `
            <li class="list__item">
              <span class="rank">${i + 1}</span>
              ${thumb(p)}
              <div class="list__main">
                <p class="list__title">${esc(p.name)}</p>
                <div class="meter" aria-hidden="true"><span style="width:${(p.sold / topMax) * 100}%"></span></div>
              </div>
              <span class="list__value">${p.sold}<span class="text-muted text-xs"> u.</span></span>
            </li>`
            )
            .join("")}
        </ol>
      </section>
    </div>

    <div class="grid-2">
      <section class="card">
        <div class="card__head">
          <h2 class="section-title">Últimos pedidos</h2>
          <a href="#/pedidos" class="card__link">Ver todos</a>
        </div>
        <div class="table-wrap" style="padding-top: var(--sp-3)">
          <table class="table table--compact">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Estado</th><th class="text-right">Total</th></tr>
            </thead>
            <tbody>
              ${orders
                .slice(0, 6)
                .map((o) => {
                  const s = statusInfo(o.status);
                  const c = customerById.get(o.customerId);
                  return `
                  <tr class="is-clickable" data-href="#/pedidos?id=${o.id}">
                    <td><span class="mono">#${o.id}</span><div class="text-xs text-muted">${relative(o.createdAt)}</div></td>
                    <td>${esc(c?.name ?? "—")}<div class="text-xs text-muted">${esc(c?.city ?? "")}</div></td>
                    <td><span class="badge badge--${s.tone}">${s.label}</span></td>
                    <td class="text-right num"><strong>${money(o.total)}</strong></td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <div class="card__head">
          <h2 class="section-title">Stock para reponer</h2>
          <a href="#/productos?stock=bajo" class="card__link">Ver todo</a>
        </div>
        <ul class="list" style="padding-top: var(--sp-3)">
          ${
            lowStock.length
              ? lowStock
                  .sort((a, b) => totalStock(a) - totalStock(b))
                  .slice(0, 6)
                  .map((p) => {
                    const st = stockStatus(p, settings.lowStockThreshold);
                    return `
                  <li class="list__item">
                    ${thumb(p)}
                    <div class="list__main">
                      <p class="list__title">${esc(p.name)}</p>
                      <p class="list__meta">${esc(p.brand)} · ${plural(totalStock(p), "unidad", "unidades")}</p>
                    </div>
                    <span class="badge ${st === "out" ? "badge--danger" : "badge--warning"}">${st === "out" ? "Agotado" : "Bajo"}</span>
                  </li>`;
                  })
                  .join("")
              : `<li class="empty"><strong>Todo en orden</strong>No hay productos con stock bajo.</li>`
          }
        </ul>
      </section>
    </div>
  `;

  container.querySelectorAll("tr[data-href]").forEach((tr) =>
    tr.addEventListener("click", () => (location.hash = tr.dataset.href))
  );
}

/** Gráfico de barras en HTML/CSS: una serie, hover con tooltip, hoy resaltado. */
function salesChart(days, weekTotal) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const niceMax = niceCeil(max);
  const ticks = [0, 0.5, 1].map((f) => niceMax * f);

  return `
    <div class="chart">
      <div class="chart__summary">
        <span class="chart__total">${money(weekTotal)}</span>
        <span class="text-sm text-muted">en los últimos 7 días</span>
      </div>
      <div class="chart__plot" role="img" aria-label="Ventas por día de los últimos 7 días">
        <div class="chart__yaxis" aria-hidden="true">
          ${ticks.map((t) => `<span style="bottom:${(t / niceMax) * 100}%">${moneyCompact(t)}</span>`).join("")}
        </div>
        <div class="chart__area">
          ${ticks.slice(1).map((t) => `<div class="chart__grid" style="bottom:${(t / niceMax) * 100}%"></div>`).join("")}
          <div class="chart__bars">
            ${days
              .map(
                (d) => `
              <div class="chart__col ${d.isToday ? "is-today" : ""}" tabindex="0"
                   aria-label="${weekday(d.date)}: ${money(d.total)}, ${plural(d.count, "pedido", "pedidos")}">
                <div class="chart__bar" style="height:${Math.max((d.total / niceMax) * 100, d.total ? 2 : 0.6)}%"></div>
                <div class="chart__tooltip">
                  ${d.isToday ? "Hoy" : weekday(d.date)} ${d.date.getDate()}
                  <strong>${money(d.total)}</strong>
                  ${plural(d.count, "pedido", "pedidos")}
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="chart__xaxis" aria-hidden="true">
          ${days.map((d) => `<span class="${d.isToday ? "is-today" : ""}">${d.isToday ? "Hoy" : weekday(d.date)}</span>`).join("")}
        </div>
      </div>
    </div>`;
}

/** Redondea hacia arriba a un número "lindo" para el eje (1, 2, 5 × 10^n). */
function niceCeil(value) {
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}
