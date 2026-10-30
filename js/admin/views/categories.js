import { getCategories, createCategory, updateCategory, deleteCategory, sizeCurves } from "../../services/categoryService.js";
import { getProducts } from "../../services/productService.js";
import { plural } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { imageUrl } from "../../utils/image.js";
import { esc } from "../../utils/dom.js";
import { openModal, closeModal, confirmDialog, toast, loadingView } from "../../utils/ui.js";

const SIZE_LABELS = {
  ropa: "Ropa (S a XXL)",
  pantalon: "Pantalón (38 a 48)",
  calzado: "Calzado (38 a 44)",
  unico: "Talle único",
};

export async function render(container) {
  container.innerHTML = loadingView();
  let [categories, products] = await Promise.all([getCategories(), getProducts()]);

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Categorías</h1>
        <p class="page-subtitle">Organizan el menú de la tienda y la curva de talles</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--primary" id="new-btn">${icon("plus")} Nueva categoría</button>
      </div>
    </div>
    <div class="cat-grid" id="grid"></div>
  `;

  const grid = container.querySelector("#grid");

  const paint = () => {
    grid.innerHTML = categories
      .map((c) => {
        const count = products.filter((p) => p.category === c.id).length;
        const url = imageUrl(c.coverImage, 600);
        return `
        <article class="cat-card" data-id="${c.id}">
          <div class="cat-card__bg" data-fallback="">${url ? `<img src="${esc(url)}" alt="" loading="lazy">` : ""}</div>
          <div class="cat-card__actions">
            <button class="btn btn--icon" data-action="edit" aria-label="Editar ${esc(c.name)}">${icon("edit")}</button>
            <button class="btn btn--icon is-danger" data-action="delete" aria-label="Eliminar ${esc(c.name)}">${icon("trash")}</button>
          </div>
          <h2 class="cat-card__name">${esc(c.name)}</h2>
          <p class="cat-card__meta">${plural(count, "producto", "productos")} · ${SIZE_LABELS[c.sizeType]}</p>
          <a href="#/productos?categoria=${c.id}" class="card__link" style="margin-top:6px">Ver productos →</a>
        </article>`;
      })
      .join("");
  };

  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.closest("[data-id]").dataset.id;
    const cat = categories.find((c) => c.id === id);

    if (btn.dataset.action === "edit") openForm(cat);

    if (btn.dataset.action === "delete") {
      const inUse = products.some((p) => p.category === id);
      if (inUse) {
        toast("No se puede borrar: tiene productos asignados", { type: "error" });
        return;
      }
      if (!(await confirmDialog({ title: "Eliminar categoría", message: `¿Eliminar <strong>${esc(cat.name)}</strong>?`, confirmText: "Eliminar", danger: true }))) return;
      await deleteCategory(id);
      categories = categories.filter((c) => c.id !== id);
      paint();
      toast("Categoría eliminada");
    }
  });

  const openForm = (cat = null) => {
    openModal({
      title: cat ? "Editar categoría" : "Nueva categoría",
      size: "modal--sm",
      body: `
        <form id="cat-form" style="display:grid;gap:var(--sp-4)">
          <label class="field"><span class="field__label">Nombre</span>
            <input class="input" name="name" required value="${esc(cat?.name ?? "")}" placeholder="Ej: Chombas"></label>
          <label class="field"><span class="field__label">Curva de talles</span>
            <select class="select" name="sizeType">
              ${Object.keys(sizeCurves).map((k) => `<option value="${k}" ${k === (cat?.sizeType ?? "ropa") ? "selected" : ""}>${SIZE_LABELS[k]}</option>`).join("")}
            </select></label>
          <label class="field"><span class="field__label">Foto de portada</span>
            <input class="input" name="coverImage" value="${esc(cat?.coverImage ?? "")}" placeholder="URL o ID de Unsplash"></label>
        </form>`,
      footer: `<button class="btn btn--ghost" data-close>Cancelar</button>
               <button class="btn btn--primary" type="submit" form="cat-form">${cat ? "Guardar" : "Crear"}</button>`,
      onMount(root) {
        root.querySelector("#cat-form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const f = e.target;
          const data = { name: f.name.value.trim(), sizeType: f.sizeType.value, coverImage: f.coverImage.value.trim() || null };
          if (!data.name) return toast("Poné un nombre", { type: "error" });
          if (cat) {
            const updated = await updateCategory(cat.id, data);
            categories = categories.map((c) => (c.id === cat.id ? updated : c));
          } else {
            categories.push(await createCategory(data));
          }
          closeModal();
          paint();
          toast(cat ? "Categoría actualizada" : "Categoría creada");
        });
      },
    });
  };

  container.querySelector("#new-btn").addEventListener("click", () => openForm());
  paint();
}
