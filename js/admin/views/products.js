import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  totalStock,
  stockStatus,
} from "../../services/productService.js";
import { getCategories, sizeCurves, brands } from "../../services/categoryService.js";
import { getSettings } from "../../services/settingsService.js";
import { money, plural } from "../../utils/format.js";
import { icon } from "../../utils/icons.js";
import { thumb } from "../../utils/image.js";
import { esc, debounce } from "../../utils/dom.js";
import { openModal, closeModal, confirmDialog, toast, loadingView } from "../../utils/ui.js";

const state = { products: [], categories: [], threshold: 3, filters: { q: "", category: "", brand: "", stock: "" } };

export async function render(container, query) {
  container.innerHTML = loadingView();

  const [products, categories, settings] = await Promise.all([getProducts(), getCategories(), getSettings()]);
  state.products = products;
  state.categories = categories;
  state.threshold = settings.lowStockThreshold;
  state.filters = { q: query.q ?? "", category: query.categoria ?? "", brand: "", stock: query.stock ?? "" };

  container.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-subtitle">Catálogo, precios y stock por talle</p>
      </div>
      <div class="page-head__actions">
        <button class="btn btn--ghost" id="export-btn">${icon("download")} Exportar</button>
        <button class="btn btn--primary" id="new-btn">${icon("plus")} Nuevo producto</button>
      </div>
    </div>

    <section class="card">
      <div class="toolbar">
        <label class="field-search">
          ${icon("search")}
          <span class="sr-only">Buscar producto</span>
          <input class="input" type="search" id="f-q" placeholder="Buscar por nombre o SKU…" value="${esc(state.filters.q)}">
        </label>
        <select class="select" id="f-category" aria-label="Categoría">
          <option value="">Todas las categorías</option>
          ${categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}
        </select>
        <select class="select" id="f-brand" aria-label="Marca">
          <option value="">Todas las marcas</option>
          ${brands.map((b) => `<option>${esc(b)}</option>`).join("")}
        </select>
        <select class="select" id="f-stock" aria-label="Stock">
          <option value="">Todo el stock</option>
          <option value="bajo">Stock bajo o agotado</option>
          <option value="agotado">Solo agotados</option>
          <option value="inactivo">Ocultos en la tienda</option>
        </select>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Talles</th>
              <th>Stock</th>
              <th>Visible</th>
              <th class="col-actions"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <p class="toolbar__count" id="count" style="padding: var(--sp-3) var(--sp-4)"></p>
    </section>
  `;

  container.querySelector("#f-category").value = state.filters.category;
  container.querySelector("#f-stock").value = state.filters.stock;

  bindToolbar(container);
  renderRows(container);

  container.querySelector("#new-btn").addEventListener("click", () => openProductForm(container));
  container.querySelector("#export-btn").addEventListener("click", () => exportCsv());

  if (query.nuevo) openProductForm(container);
}

// ---------- Filtros ----------
function bindToolbar(container) {
  const update = () => {
    state.filters = {
      q: container.querySelector("#f-q").value.trim().toLowerCase(),
      category: container.querySelector("#f-category").value,
      brand: container.querySelector("#f-brand").value,
      stock: container.querySelector("#f-stock").value,
    };
    renderRows(container);
  };
  container.querySelector("#f-q").addEventListener("input", debounce(update, 150));
  ["#f-category", "#f-brand", "#f-stock"].forEach((s) => container.querySelector(s).addEventListener("change", update));
}

function filtered() {
  const { q, category, brand, stock } = state.filters;
  const term = q.toLowerCase();
  return state.products.filter((p) => {
    if (term && !`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(term)) return false;
    if (category && p.category !== category) return false;
    if (brand && p.brand !== brand) return false;
    const st = stockStatus(p, state.threshold);
    if (stock === "bajo" && st === "ok") return false;
    if (stock === "agotado" && st !== "out") return false;
    if (stock === "inactivo" && p.active) return false;
    return true;
  });
}

// ---------- Tabla ----------
function renderRows(container) {
  const list = filtered();
  const catName = (id) => state.categories.find((c) => c.id === id)?.name ?? id;
  const tbody = container.querySelector("#rows");

  container.querySelector("#count").textContent = `${plural(list.length, "producto", "productos")} de ${state.products.length}`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><strong>Sin resultados</strong>Probá con otro filtro o buscá por SKU.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((p) => {
      const total = totalStock(p);
      const st = stockStatus(p, state.threshold);
      const stockBadge =
        st === "out"
          ? `<span class="badge badge--danger">Agotado</span>`
          : st === "low"
            ? `<span class="badge badge--warning">${total} u. · Bajo</span>`
            : `<span class="badge badge--success">${total} u.</span>`;

      return `
      <tr data-id="${p.id}">
        <td>
          <div class="product-cell">
            ${thumb(p)}
            <div>
              <p class="product-cell__name">${esc(p.name)}</p>
              <p class="product-cell__meta"><span class="tag">${esc(p.brand)}</span> <span class="mono">${esc(p.sku)}</span></p>
            </div>
          </div>
        </td>
        <td class="text-2">${esc(catName(p.category))}</td>
        <td class="num">
          <strong>${money(p.price)}</strong>
          ${p.comparePrice ? `<div class="text-xs text-muted"><s>${money(p.comparePrice)}</s></div>` : ""}
        </td>
        <td>
          <div class="sizes">
            ${Object.entries(p.stock)
              .map(([size, qty]) => {
                const cls = Number(qty) === 0 ? "is-out" : Number(qty) <= 1 ? "is-low" : "";
                return `<span class="size ${cls}" title="${esc(size)}: ${qty} u.">${esc(size)}</span>`;
              })
              .join("")}
          </div>
        </td>
        <td>${stockBadge}</td>
        <td>
          <label class="switch">
            <input type="checkbox" data-action="toggle" ${p.active ? "checked" : ""}>
            <span class="switch__track"></span>
            <span class="sr-only">Visible en la tienda</span>
          </label>
        </td>
        <td class="col-actions">
          <div class="row-actions">
            <button class="btn btn--icon" data-action="edit" aria-label="Editar ${esc(p.name)}">${icon("edit")}</button>
            <button class="btn btn--icon is-danger" data-action="delete" aria-label="Eliminar ${esc(p.name)}">${icon("trash")}</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  tbody.onclick = async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.closest("tr").dataset.id;
    const product = state.products.find((p) => p.id === id);

    if (btn.dataset.action === "edit") openProductForm(container, product);

    if (btn.dataset.action === "delete") {
      const ok = await confirmDialog({
        title: "Eliminar producto",
        message: `Vas a eliminar <strong>${esc(product.name)}</strong>. Esta acción no se puede deshacer.`,
        confirmText: "Eliminar",
        danger: true,
      });
      if (!ok) return;
      await deleteProduct(id);
      state.products = state.products.filter((p) => p.id !== id);
      renderRows(container);
      toast("Producto eliminado");
    }
  };

  tbody.onchange = async (e) => {
    if (e.target.dataset.action !== "toggle") return;
    const id = e.target.closest("tr").dataset.id;
    const updated = await updateProduct(id, { active: e.target.checked });
    replaceInState(updated);
    toast(updated.active ? "Producto visible en la tienda" : "Producto oculto de la tienda");
  };
}

function replaceInState(product) {
  const i = state.products.findIndex((p) => p.id === product.id);
  if (i >= 0) state.products[i] = product;
  else state.products.unshift(product);
}

// ---------- Formulario alta / edición ----------
function openProductForm(container, product = null) {
  const isEdit = Boolean(product);
  const p = product ?? { name: "", brand: "BoosT32", category: "remeras", price: "", comparePrice: "", color: "", sku: "", image: "", stock: {}, active: true };

  const curveFor = (catId) => sizeCurves[state.categories.find((c) => c.id === catId)?.sizeType ?? "ropa"];

  const stockInputs = (catId, stock = {}) =>
    curveFor(catId)
      .map(
        (size) => `
        <label>${esc(size)}
          <input class="input" type="number" min="0" inputmode="numeric" name="stock_${esc(size)}" value="${stock[size] ?? 0}">
        </label>`
      )
      .join("");

  openModal({
    title: isEdit ? "Editar producto" : "Nuevo producto",
    size: "modal--lg",
    body: `
      <form id="product-form" class="form-grid" novalidate>
        <div class="field span-2">
          <label class="field__label" for="pf-name">Nombre</label>
          <input class="input" id="pf-name" name="name" required value="${esc(p.name)}" placeholder="Ej: Nike Air Force 1 '07">
        </div>

        <div class="field">
          <label class="field__label" for="pf-brand">Marca</label>
          <select class="select" id="pf-brand" name="brand">
            ${brands.map((b) => `<option ${b === p.brand ? "selected" : ""}>${esc(b)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="pf-category">Categoría</label>
          <select class="select" id="pf-category" name="category">
            ${state.categories.map((c) => `<option value="${c.id}" ${c.id === p.category ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label class="field__label" for="pf-price">Precio</label>
          <div class="input-prefix"><span>$</span>
            <input class="input" id="pf-price" name="price" type="number" min="0" step="1" required value="${p.price}">
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="pf-compare">Precio anterior <span class="text-muted">(opcional)</span></label>
          <div class="input-prefix"><span>$</span>
            <input class="input" id="pf-compare" name="comparePrice" type="number" min="0" step="1" value="${p.comparePrice ?? ""}">
          </div>
          <span class="field__hint">Se muestra tachado en la tienda.</span>
        </div>

        <div class="field">
          <label class="field__label" for="pf-color">Color</label>
          <input class="input" id="pf-color" name="color" value="${esc(p.color)}" placeholder="Ej: Negro / Blanco">
        </div>
        <div class="field">
          <label class="field__label" for="pf-sku">SKU</label>
          <input class="input mono" id="pf-sku" name="sku" value="${esc(p.sku)}" placeholder="Ej: NK-AF1-07-WHT">
        </div>

        <div class="field span-2">
          <label class="field__label" for="pf-image">Foto</label>
          <div class="img-preview">
            <div id="pf-thumb">${thumb(p, { size: "thumb--lg" })}</div>
            <input class="input" id="pf-image" name="image" value="${esc(p.image ?? "")}" placeholder="URL de la imagen o ID de Unsplash">
          </div>
          <span class="field__hint">Con Firebase esto pasa a ser un botón para subir la foto.</span>
        </div>

        <div class="span-2 form-section">
          <p class="form-section__title">Stock por talle</p>
          <div class="stock-grid" id="pf-stock">${stockInputs(p.category, p.stock)}</div>
        </div>

        <div class="span-2">
          <label class="switch">
            <input type="checkbox" name="active" ${p.active ? "checked" : ""}>
            <span class="switch__track"></span>
            Visible en la tienda
          </label>
        </div>
      </form>`,
    footer: `
      <button class="btn btn--ghost" data-close>Cancelar</button>
      <button class="btn btn--primary" type="submit" form="product-form">${isEdit ? "Guardar cambios" : "Crear producto"}</button>`,
    onMount(root) {
      const form = root.querySelector("#product-form");

      // Si cambia la categoría, cambia la curva de talles
      form.category.addEventListener("change", () => {
        root.querySelector("#pf-stock").innerHTML = stockInputs(form.category.value, {});
      });

      // Preview de la foto
      form.image.addEventListener(
        "input",
        debounce(() => {
          root.querySelector("#pf-thumb").innerHTML = thumb({ ...p, image: form.image.value.trim() }, { size: "thumb--lg" });
        }, 400)
      );

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = form.name.value.trim();
        const price = Number(form.price.value);
        form.name.classList.toggle("is-invalid", !name);
        form.price.classList.toggle("is-invalid", !price);
        if (!name || !price) {
          toast("Completá nombre y precio", { type: "error" });
          return;
        }

        const stock = Object.fromEntries(
          curveFor(form.category.value).map((size) => [size, Number(form.elements[`stock_${size}`].value || 0)])
        );

        const data = {
          name,
          brand: form.brand.value,
          category: form.category.value,
          price,
          comparePrice: Number(form.comparePrice.value) || null,
          color: form.color.value.trim(),
          sku: form.sku.value.trim() || autoSku(form.brand.value, name),
          image: form.image.value.trim() || null,
          stock,
          active: form.active.checked,
        };

        const submit = root.querySelector('[type="submit"]');
        submit.disabled = true;
        const saved = isEdit ? await updateProduct(p.id, data) : await createProduct(data);
        replaceInState(saved);
        closeModal();
        renderRows(container);
        toast(isEdit ? "Cambios guardados" : "Producto creado");
      });
    },
  });
}

function autoSku(brand, name) {
  const part = (s, n) => s.normalize("NFD").replace(/[^A-Za-z0-9]/g, "").slice(0, n).toUpperCase();
  return `${part(brand, 2)}-${part(name, 6)}-${Math.floor(Math.random() * 900 + 100)}`;
}

// ---------- Exportar CSV ----------
function exportCsv() {
  const rows = [["SKU", "Nombre", "Marca", "Categoría", "Precio", "Stock total", "Visible"]];
  filtered().forEach((p) => rows.push([p.sku, p.name, p.brand, p.category, p.price, totalStock(p), p.active ? "Sí" : "No"]));
  const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "boost32-productos.csv" });
  a.click();
  URL.revokeObjectURL(url);
  toast("CSV descargado");
}
