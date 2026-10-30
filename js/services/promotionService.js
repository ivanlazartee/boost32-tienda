import { createCollection } from "./db.js";
import { promotions as seed } from "../data/promotions.js";
import { daysAgoToDate } from "../utils/format.js";

const collection = createCollection(
  seed.map(({ endsInDays, ...p }) => ({
    ...p,
    endsAt: endsInDays == null ? null : daysAgoToDate(-endsInDays).toISOString(),
  })),
  { prefix: "promo" }
);

export async function getPromotions() {
  return collection.getAll();
}

export async function createPromotion(data) {
  return collection.create({ uses: 0, active: true, ...data });
}

export async function updatePromotion(id, changes) {
  return collection.update(id, changes);
}

export async function deletePromotion(id) {
  return collection.remove(id);
}
