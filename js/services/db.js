// ==========================================================================
// "Base de datos" en memoria.
//
// Imita la forma de trabajar de Firestore (todo es async y devuelve copias),
// así cuando conectemos Firebase solo reemplazamos este archivo y las vistas
// no se enteran. Los cambios se pierden al recargar: es un demo.
// ==========================================================================

const LATENCY_MS = 120; // simula la demora de red

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => structuredClone(value);

export function createCollection(seed = [], { prefix = "id" } = {}) {
  const items = new Map(seed.map((item) => [item.id, clone(item)]));
  let counter = seed.length;

  const nextId = () => {
    counter += 1;
    let id = `${prefix}${String(counter).padStart(3, "0")}`;
    while (items.has(id)) {
      counter += 1;
      id = `${prefix}${String(counter).padStart(3, "0")}`;
    }
    return id;
  };

  return {
    async getAll() {
      await wait();
      return [...items.values()].map(clone);
    },

    async getById(id) {
      await wait();
      const item = items.get(id);
      return item ? clone(item) : null;
    },

    async create(data) {
      await wait();
      const item = { ...clone(data), id: data.id ?? nextId() };
      items.set(item.id, item);
      return clone(item);
    },

    async update(id, changes) {
      await wait();
      const current = items.get(id);
      if (!current) throw new Error(`No existe el registro ${id}`);
      const updated = { ...current, ...clone(changes), id };
      items.set(id, updated);
      return clone(updated);
    },

    async remove(id) {
      await wait();
      return items.delete(id);
    },
  };
}

export function createDocument(seed = {}) {
  let doc = clone(seed);
  return {
    async get() {
      await wait();
      return clone(doc);
    },
    async set(changes) {
      await wait();
      doc = { ...doc, ...clone(changes) };
      return clone(doc);
    },
  };
}
