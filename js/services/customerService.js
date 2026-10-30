import { createCollection } from "./db.js";
import { customers as seed } from "../data/customers.js";
import { daysAgoToDate } from "../utils/format.js";

const collection = createCollection(
  seed.map(({ createdDaysAgo, ...c }) => ({ ...c, createdAt: daysAgoToDate(createdDaysAgo).toISOString() })),
  { prefix: "c" }
);

export async function getCustomers() {
  return collection.getAll();
}

export async function getCustomer(id) {
  return collection.getById(id);
}
