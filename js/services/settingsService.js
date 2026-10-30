import { createDocument } from "./db.js";
import { settings as seed } from "../data/settings.js";

const doc = createDocument(seed);

export async function getSettings() {
  return doc.get();
}

export async function saveSettings(changes) {
  return doc.set(changes);
}
