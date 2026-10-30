import { getSettings } from "../../services/settingsService.js";
import { money } from "../../utils/format.js";
import { esc } from "../../utils/dom.js";

export async function render(container, query) {
  const s = await getSettings();

  const topics = [
    {
      id: "envios",
      title: "Envíos y entregas",
      items: [
        `Envío gratis en compras desde ${money(s.freeShippingFrom)}.`,
        "Andreani y Correo Argentino a todo el país (2 a 6 días hábiles).",
        "Moto en el día en San Miguel de Tucumán y Yerba Buena.",
        `Retiro sin cargo en ${s.address}.`,
      ],
    },
    {
      id: "cambios",
      title: "Cambios y devoluciones",
      items: [
        "Primer cambio sin cargo dentro de los 30 días.",
        "El producto tiene que estar sin uso y con etiquetas.",
        "Podés cambiar por otro talle, color o producto.",
      ],
    },
    {
      id: "talles",
      title: "Guía de talles",
      items: [
        "Cada producto tiene su tabla de medidas en la ficha.",
        "Las remeras y buzos oversize: si dudás, elegí tu talle habitual.",
        "Zapatillas: si estás entre dos talles, elegí el más grande.",
      ],
    },
    {
      id: "pagos",
      title: "Medios de pago",
      items: [
        `${s.installments} cuotas sin interés con Mercado Pago.`,
        `${s.transferDiscount}% de descuento pagando por transferencia.`,
        "Efectivo en el local.",
      ],
    },
  ];

  container.innerHTML = `
    <div class="container" style="max-width:820px">
      <nav class="breadcrumb"><a href="#/">Inicio</a><span>/</span><span>Ayuda</span></nav>
      <div class="catalog-head"><h1>Ayuda</h1></div>
      <div class="details">
        ${topics
          .map(
            (t) => `
          <details id="${t.id}" ${query.tema === t.id ? "open" : ""}>
            <summary>${esc(t.title)}</summary>
            <ul>${t.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
          </details>`
          )
          .join("")}
      </div>
    </div>`;

  if (query.tema) container.querySelector(`#${CSS.escape(query.tema)}`)?.scrollIntoView({ block: "center" });
}
