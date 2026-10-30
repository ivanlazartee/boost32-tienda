// Componentes de interfaz reutilizables: modal, confirmación y toasts.
import { icon } from "./icons.js";
import { esc } from "./dom.js";

let lastFocus = null;

/**
 * Abre un modal. Devuelve { root, close }.
 * `onMount(root, close)` corre cuando el modal ya está en el DOM.
 */
export function openModal({ title, body, footer = "", size = "", onMount } = {}) {
  closeModal();
  lastFocus = document.activeElement;

  const root = document.createElement("div");
  root.className = "modal-root";
  root.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__head">
        <h2 class="modal__title" id="modal-title">${esc(title)}</h2>
        <button class="btn btn--icon" data-close aria-label="Cerrar">${icon("x")}</button>
      </div>
      <div class="modal__body">${body}</div>
      ${footer ? `<div class="modal__foot">${footer}</div>` : ""}
    </div>`;

  const close = () => closeModal();
  root.addEventListener("click", (e) => {
    if (e.target === root || e.target.closest("[data-close]")) close();
  });

  document.body.append(root);
  document.body.style.overflow = "hidden";
  root.querySelector("input, select, textarea, button:not([data-close])")?.focus();
  onMount?.(root, close);
  return { root, close };
}

export function closeModal() {
  const root = document.querySelector(".modal-root");
  if (!root) return;
  root.remove();
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/** Confirmación con promesa: `if (await confirmDialog({...})) { ... }` */
export function confirmDialog({ title = "¿Seguro?", message = "", confirmText = "Confirmar", danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const { root } = openModal({
      title,
      size: "modal--sm",
      body: `<p class="text-2">${message}</p>`,
      footer: `
        <button class="btn btn--ghost" data-close>Cancelar</button>
        <button class="btn ${danger ? "btn--danger" : "btn--primary"}" data-ok>${esc(confirmText)}</button>`,
    });
    root.querySelector("[data-ok]").addEventListener("click", () => {
      answered = true;
      closeModal();
      resolve(true);
    });
    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) {
        observer.disconnect();
        if (!answered) resolve(false);
      }
    });
    observer.observe(document.body, { childList: true });
  });
}

/** Notificación chiquita abajo a la derecha. */
export function toast(message, { type = "ok", duration = 2800 } = {}) {
  let box = document.querySelector(".toasts");
  if (!box) {
    box = document.createElement("div");
    box.className = "toasts";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.append(box);
  }
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "toast--danger" : ""}`;
  el.innerHTML = `${icon(type === "error" ? "alert" : "check")}<span>${esc(message)}</span>`;
  box.append(el);
  setTimeout(() => {
    el.classList.add("is-leaving");
    setTimeout(() => el.remove(), 220);
  }, duration);
}

export const loadingView = (text = "Cargando…") =>
  `<div class="loading"><div><div class="spinner"></div>${esc(text)}</div></div>`;
