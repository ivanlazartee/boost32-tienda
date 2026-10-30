// ==========================================================================
// Carrito en memoria. Avisa los cambios con el evento "cart:changed".
// (Más adelante se puede guardar en Firebase para usuarios logueados.)
// ==========================================================================

import { getPromotions } from "../services/promotionService.js";

const state = {
  items: [], // { key, productId, name, brand, image, size, price, qty, maxQty }
  coupon: null, // { code, type, value, minPurchase }
};

const emit = () => window.dispatchEvent(new CustomEvent("cart:changed", { detail: getCart() }));

export function getCart() {
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = state.items.reduce((n, i) => n + i.qty, 0);
  return { items: structuredClone(state.items), coupon: state.coupon, subtotal, count };
}

export function addItem(product, size, qty = 1) {
  const key = `${product.id}__${size}`;
  const maxQty = Number(product.stock[size] ?? 0);
  const existing = state.items.find((i) => i.key === key);

  if (existing) {
    existing.qty = Math.min(existing.qty + qty, maxQty);
  } else {
    state.items.push({
      key,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      size,
      price: product.price,
      qty: Math.min(qty, maxQty),
      maxQty,
    });
  }
  emit();
}

export function setQty(key, qty) {
  const item = state.items.find((i) => i.key === key);
  if (!item) return;
  if (qty <= 0) return removeItem(key);
  item.qty = Math.min(qty, item.maxQty);
  emit();
}

export function removeItem(key) {
  state.items = state.items.filter((i) => i.key !== key);
  emit();
}

export function clearCart() {
  state.items = [];
  state.coupon = null;
  emit();
}

/** Valida un cupón contra las promociones activas. Devuelve { ok, message }. */
export async function applyCoupon(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: "Ingresá un código" };

  const promos = await getPromotions();
  const promo = promos.find((p) => p.code === code);
  const { subtotal } = getCart();

  if (!promo || !promo.active) return { ok: false, message: "El cupón no existe o no está vigente" };
  if (promo.endsAt && new Date(promo.endsAt) < new Date()) return { ok: false, message: "El cupón venció" };
  if (promo.minPurchase && subtotal < promo.minPurchase) {
    return { ok: false, message: `Este cupón aplica desde $${promo.minPurchase.toLocaleString("es-AR")}` };
  }

  state.coupon = { code: promo.code, type: promo.type, value: promo.value, minPurchase: promo.minPurchase };
  emit();
  return { ok: true, message: `Cupón ${promo.code} aplicado` };
}

export function removeCoupon() {
  state.coupon = null;
  emit();
}

/**
 * Calcula todos los montos del carrito.
 * Ej: subtotal 300.000, cupón 10% → descuento 30.000;
 *     paga con transferencia (15%) → 15% sobre 270.000 = 40.500.
 */
export function computeTotals({ shippingCost = 0, transferPercent = 0, freeShippingFrom = Infinity } = {}) {
  const { subtotal, coupon } = getCart();
  let couponDiscount = 0;
  let freeShipping = subtotal >= freeShippingFrom;

  if (coupon && subtotal >= (coupon.minPurchase || 0)) {
    if (coupon.type === "percent") couponDiscount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.type === "fixed") couponDiscount = Math.min(coupon.value, subtotal);
    if (coupon.type === "shipping") freeShipping = true;
  }

  const afterCoupon = subtotal - couponDiscount;
  const transferDiscount = Math.round((afterCoupon * transferPercent) / 100);
  const shipping = freeShipping ? 0 : shippingCost;

  return {
    subtotal,
    couponDiscount,
    transferDiscount,
    shipping,
    freeShipping,
    total: afterCoupon - transferDiscount + shipping,
  };
}
