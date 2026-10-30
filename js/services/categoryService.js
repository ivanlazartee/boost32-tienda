import { createCollection } from "./db.js";
import { categories as seed, sizeCurves, brands } from "../data/categories.js";

const collection = createCollection(seed, { prefix: "cat" });

export { sizeCurves, brands };

export async function getCategories() {
  return collection.getAll();
}

export async function createCategory(data) {
  const id = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return collection.create({ ...data, id });
}

export async function updateCategory(id, changes) {
  return collection.update(id, changes);
}

export async function deleteCategory(id) {
  return collection.remove(id);
}
