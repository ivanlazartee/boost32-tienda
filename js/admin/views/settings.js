import { getSettings, saveSettings } from "../../services/settingsService.js";
import { esc } from "../../utils/dom.js";
import { toast, loadingView } from "../../utils/ui.js";

export async function render(container) {
  container.innerHTML = loadingView();
  const s = await getSettings();

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Configuración</h1>
        <p class="page-subtitle">Datos de la tienda, contacto y reglas de venta</p>
      </div>
    </div>

    <form class="card card__body" id="settings-form">
      <section class="settings-grid">
        <div>
          <h2 class="section-title">Tienda</h2>
          <p class="text-sm text-muted">Cómo aparece la marca en la web.</p>
        </div>
        <div class="form-grid">
          <label class="field"><span class="field__label">Nombre</span>
            <input class="input" name="storeName" value="${esc(s.storeName)}"></label>
          <label class="field"><span class="field__label">Bajada</span>
            <input class="input" name="tagline" value="${esc(s.tagline)}"></label>
          <label class="field span-2"><span class="field__label">Dirección del local</span>
            <input class="input" name="address" value="${esc(s.address)}"></label>
          <label class="field span-2"><span class="field__label">Horarios</span>
            <input class="input" name="hours" value="${esc(s.hours)}"></label>
        </div>
      </section>

      <section class="settings-grid">
        <div>
          <h2 class="section-title">Contacto</h2>
          <p class="text-sm text-muted">Se usa en el footer y en el botón de WhatsApp.</p>
        </div>
        <div class="form-grid">
          <label class="field"><span class="field__label">WhatsApp</span>
            <input class="input" name="whatsapp" value="${esc(s.whatsapp)}" inputmode="tel"></label>
          <label class="field"><span class="field__label">Instagram</span>
            <input class="input" name="instagram" value="${esc(s.instagram)}"></label>
          <label class="field span-2"><span class="field__label">Email</span>
            <input class="input" name="email" type="email" value="${esc(s.email)}"></label>
        </div>
      </section>

      <section class="settings-grid">
        <div>
          <h2 class="section-title">Ventas</h2>
          <p class="text-sm text-muted">Reglas que se muestran en la tienda y el checkout.</p>
        </div>
        <div class="form-grid">
          <label class="field"><span class="field__label">Envío gratis desde</span>
            <div class="input-prefix"><span>$</span><input class="input" name="freeShippingFrom" type="number" min="0" value="${s.freeShippingFrom}"></div></label>
          <label class="field"><span class="field__label">Descuento por transferencia</span>
            <input class="input" name="transferDiscount" type="number" min="0" max="100" value="${s.transferDiscount}">
            <span class="field__hint">En porcentaje.</span></label>
          <label class="field"><span class="field__label">Cuotas sin interés</span>
            <select class="select" name="installments">
              ${[1, 3, 6, 12].map((n) => `<option value="${n}" ${n === s.installments ? "selected" : ""}>${n === 1 ? "Sin cuotas" : `${n} cuotas`}</option>`).join("")}
            </select></label>
          <label class="field"><span class="field__label">Aviso de stock bajo</span>
            <input class="input" name="lowStockThreshold" type="number" min="0" value="${s.lowStockThreshold}">
            <span class="field__hint">Unidades por debajo de las cuales se marca como "bajo".</span></label>
        </div>
      </section>

      <div style="display:flex;justify-content:flex-end;gap:var(--sp-2);padding-top:var(--sp-5);border-top:1px solid var(--color-border)">
        <button type="reset" class="btn btn--ghost">Descartar</button>
        <button type="submit" class="btn btn--primary">Guardar cambios</button>
      </div>
    </form>
  `;

  container.querySelector("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    await saveSettings({
      storeName: f.storeName.value.trim(),
      tagline: f.tagline.value.trim(),
      address: f.address.value.trim(),
      hours: f.hours.value.trim(),
      whatsapp: f.whatsapp.value.trim(),
      instagram: f.instagram.value.trim(),
      email: f.email.value.trim(),
      freeShippingFrom: Number(f.freeShippingFrom.value) || 0,
      transferDiscount: Number(f.transferDiscount.value) || 0,
      installments: Number(f.installments.value),
      lowStockThreshold: Number(f.lowStockThreshold.value) || 0,
    });
    toast("Configuración guardada");
  });
}
