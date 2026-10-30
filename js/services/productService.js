import { createCollection } from "./db.js";
import { products as seed } from "../data/products.js";
import { getSettings } from "./settingsService.js";

const collection = createCollection(seed, { prefix: "p" });

export const totalStock = (product) =>
  Object.values(product.stock ?? {}).reduce((sum, qty) => sum + Number(qty || 0), 0);

/** Devuelve "ok" | "low" | "out" según el stock total del producto. */
export function stockStatus(product, threshold = 3) {
  const total = totalStock(product);
  if (total === 0) return "out";
  const sizesOut = Object.values(product.stock).filter((q) => Number(q) === 0).length;
  if (total <= threshold * 2 || sizesOut >= Math.ceil(Object.keys(product.stock).length / 2)) {
    return "low";
  }
  return "ok";
}

export async function getProducts() {
  return collection.getAll();
}

export async function getProduct(id) {
  return collection.getById(id);
}

export async function createProduct(data) {
  return collection.create({ sold: 0, active: true, ...data });
}

export async function updateProduct(id, changes) {
  return collection.update(id, changes);
}

export async function deleteProduct(id) {
  return collection.remove(id);
}

export async function getLowStockProducts() {
  const [list, settings] = await Promise.all([getProducts(), getSettings()]);
  return list.filter((p) => p.active && stockStatus(p, settings.lowStockThreshold) !== "ok");
}
