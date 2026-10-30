import { createCollection } from "./db.js";
import { orders as seed, ORDER_STATUSES, PAYMENT_METHODS, SHIPPING_METHODS } from "../data/orders.js";
import { products } from "../data/products.js";
import { daysAgoToDate } from "../utils/format.js";

export { ORDER_STATUSES, PAYMENT_METHODS, SHIPPING_METHODS };

// Convertimos el seed a la forma "real" que tendría un pedido guardado:
// fecha ISO + items con precio congelado al momento de la compra.
const productById = new Map(products.map((p) => [p.id, p]));

function hydrate(raw) {
  const date = daysAgoToDate(raw.daysAgo);
  const [h, m] = raw.hour.split(":").map(Number);
  date.setHours(h, m, 0, 0);

  const items = raw.items.map(([productId, size, qty]) => {
    const p = productById.get(productId);
    return { productId, name: p.name, brand: p.brand, image: p.image, size, qty, price: p.price };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = raw.payment === "transferencia" ? Math.round(subtotal * 0.15) : 0;

  return {
    id: raw.id,
    customerId: raw.customerId,
    createdAt: date.toISOString(),
    status: raw.status,
    payment: raw.payment,
    shipping: raw.shipping,
    items,
    subtotal,
    discount,
    shippingCost: raw.shippingCost,
    total: subtotal - discount + raw.shippingCost,
  };
}

const collection = createCollection(seed.map(hydrate));

export async function getOrders() {
  const list = await collection.getAll();
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getOrder(id) {
  return collection.getById(id);
}

/** Crea un pedido desde el checkout de la tienda. Devuelve el pedido con su número. */
export async function createOrder(data) {
  const all = await collection.getAll();
  const nextNumber = Math.max(...all.map((o) => Number(o.id)), 1000) + 1;
  return collection.create({
    ...data,
    id: String(nextNumber),
    createdAt: new Date().toISOString(),
    status: "pendiente",
  });
}

export async function updateOrderStatus(id, status) {
  return collection.update(id, { status });
}

export const statusInfo = (id) => ORDER_STATUSES.find((s) => s.id === id) ?? ORDER_STATUSES[0];

/** Pedidos que cuentan como venta (no pendientes ni cancelados). */
export const isPaid = (order) => ["pagado", "enviado", "entregado"].includes(order.status);
