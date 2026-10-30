import { esc } from "./dom.js";

// Las fotos salen de Unsplash (licencia libre). Guardamos solo el id de la foto.
// Si el producto tiene una URL completa (ej. Firebase Storage), se usa tal cual.
export function imageUrl(image, width = 400) {
  if (!image) return null;
  if (/^https?:\/\//.test(image)) return image;
  return `https://unsplash.com/photos/${image}/download?w=${width}`;
}

/** Miniatura con fallback: si no hay foto o falla, muestra las iniciales. */
export function thumb(product, { size = "", width = 160 } = {}) {
  const url = imageUrl(product.image, width);
  const label = (product.brand || product.name || "?").slice(0, 2).toUpperCase();
  return `
    <div class="thumb ${size}" data-fallback="${esc(label)}">
      ${
        url
          ? `<img src="${esc(url)}" alt="${esc(product.name)}" loading="lazy" decoding="async">`
          : `<span class="thumb__fallback" title="Sin foto">${esc(label)}</span>`
      }
    </div>`;
}

/** Un solo listener global: cualquier <img> que falle dentro de .thumb muestra el fallback. */
export function installImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      const box = img.closest("[data-fallback]");
      if (!box) return;
      img.remove();
      box.insertAdjacentHTML(
        "beforeend",
        `<span class="thumb__fallback" title="Foto no disponible">${esc(box.dataset.fallback)}</span>`
      );
    },
    true
  );
}
