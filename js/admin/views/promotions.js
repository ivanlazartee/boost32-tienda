import { getPromotions, createPromotion, updatePromotion, deletePromotion } from "../../services/promotionService.js";
import { money, date } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { esc } from "../../utils/dom.js";
import { openModal, closeModal, confirmDialog, toast, loadingView } from "../../utils/ui.js";

const TYPE_LABEL = { percent: "Porcentaje", fixed: "Monto fijo", shipping: "Envío gratis" };

const benefit = (p) =>
  p.type === "percent" ? `${p.value}% off` : p.type === "fixed" ? `${money(p.value)} off` : "Envío gratis";

export async function render(container) {
  container.innerHTML = loadingView();
  let promos = await getPromotions();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Promociones</h1>
        <p class="page-subtitle">Cupones de descuento para redes, fechas especiales y clientes</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--primary" id="new-btn">${icon("plus")} Nuevo cupón</button>
      </div>
    </div>

    <section class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Código</th><th>Beneficio</th><th>Compra mínima</th><th>Usos</th><th>Vence</th><th>Activo</th><th class="col-actions"></th></tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </section>
  `;

  const tbody = container.querySelector("#rows");

  const paint = () => {
    tbody.innerHTML = promos
      .map((p) => {
        const usage = p.maxUses ? Math.min(p.uses / p.maxUses, 1) : null;
        return `
        <tr data-id="${p.id}">
          <td><span class="coupon-code">${esc(p.code)}</span><div class="text-xs text-muted" style="margin-top:4px">${esc(p.description)}</div></td>
          <td><strong>${benefit(p)}</strong><div class="text-xs text-muted">${TYPE_LABEL[p.type]}</div></td>
          <td class="num text-2">${p.minPurchase ? money(p.minPurchase) : "Sin mínimo"}</td>
          <td class="usage num">
            ${p.uses}${p.maxUses ? ` / ${p.maxUses}` : ""}
            ${usage !== null ? `<div class="meter"><span style="width:${usage * 100}%"></span></div>` : `<div class="text-xs text-muted">Sin límite</div>`}
          </td>
          <td class="text-2">${p.endsAt ? date(p.endsAt) : "Sin vencimiento"}</td>
          <td>
            <label class="switch">
              <input type="checkbox" data-action="toggle" ${p.active ? "checked" : ""}>
              <span class="switch__track"></span>
              <span class="sr-only">Cupón activo</span>
            </label>
          </td>
          <td class="col-actions">
            <div class="row-actions">
              <button class="btn btn--icon" data-action="copy" aria-label="Copiar código">${icon("ticket")}</button>
              <button class="btn btn--icon is-danger" data-action="delete" aria-label="Eliminar ${esc(p.code)}">${icon("trash")}</button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  };

  tbody.addEventListener("change", async (e) => {
    if (e.target.dataset.action !== "toggle") return;
    const id = e.target.closest("tr").dataset.id;
    const updated = await updatePromotion(id, { active: e.target.checked });
    promos = promos.map((p) => (p.id === id ? updated : p));
    toast(updated.active ? `Cupón ${updated.code} activado` : `Cupón ${updated.code} pausado`);
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.dataset.action === "toggle") return;
    const id = btn.closest("tr").dataset.id;
    const promo = promos.find((p) => p.id === id);

    if (btn.dataset.action === "copy") {
      await navigator.clipboard?.writeText(promo.code).catch(() => {});
      toast(`Código ${promo.code} copiado`);
    }
    if (btn.dataset.action === "delete") {
      if (!(await confirmDialog({ title: "Eliminar cupón", message: `¿Eliminar el cupón <strong>${esc(promo.code)}</strong>?`, confirmText: "Eliminar", danger: true }))) return;
      await deletePromotion(id);
      promos = promos.filter((p) => p.id !== id);
      paint();
      toast("Cupón eliminado");
    }
  });

  container.querySelector("#new-btn").addEventListener("click", () => {
    openModal({
      title: "Nuevo cupón",
      body: `
        <form id="promo-form" class="form-grid">
          <label class="field"><span class="field__label">Código</span>
            <input class="input mono" name="code" required placeholder="HOTSALE20" style="text-transform:uppercase"></label>
          <label class="field"><span class="field__label">Tipo</span>
            <select class="select" name="type">
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
              <option value="shipping">Envío gratis</option>
            </select></label>
          <label class="field"><span class="field__label">Valor</span>
            <input class="input" name="value" type="number" min="0" value="20"></label>
          <label class="field"><span class="field__label">Compra mínima</span>
            <div class="input-prefix"><span>$</span><input class="input" name="minPurchase" type="number" min="0" value="0"></div></label>
          <label class="field span-2"><span class="field__label">Descripción</span>
            <input class="input" name="description" placeholder="Ej: 20% off en toda la tienda por Hot Sale"></label>
          <label class="field"><span class="field__label">Límite de usos</span>
            <input class="input" name="maxUses" type="number" min="0" placeholder="Sin límite"></label>
          <label class="field"><span class="field__label">Vence</span>
            <input class="input" name="endsAt" type="date"></label>
        </form>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--primary" type="submit" form="promo-form">Crear cupón</button>`,
      onMount(root) {
        root.querySelector("#promo-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const f = e.target;
          const code = f.code.value.trim().toUpperCase().replace(/\s+/g, "");
          if (!code) return toast("El cupón necesita un código", { type: "error" });
          if (promos.some((p) => p.code === code)) return toast("Ese código ya existe", { type: "error" });

          const created = await createPromotion({
            code,
            type: f.type.value,
            value: Number(f.value.value) || 0,
            minPurchase: Number(f.minPurchase.value) || 0,
            description: f.description.value.trim() || benefit({ type: f.type.value, value: Number(f.value.value) }),
            maxUses: Number(f.maxUses.value) || null,
            endsAt: f.endsAt.value ? new Date(`${f.endsAt.value}T23:59`).toISOString() : null,
          });
          promos.unshift(created);
          closeModal();
          paint();
          toast(`Cupón ${code} creado`);
        });
      },
    });
  });

  paint();
}
