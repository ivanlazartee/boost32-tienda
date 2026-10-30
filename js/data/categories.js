// Datos de ejemplo — Categorías
// Cuando migremos a Firebase, esto pasa a ser la colección "categories".

export const categories = [
  { id: "zapatillas", name: "Zapatillas", sizeType: "calzado", coverImage: "NUoPWImmjCU" },
  { id: "buzos", name: "Buzos", sizeType: "ropa", coverImage: "JhKblPS3kc8" },
  { id: "camperas", name: "Camperas", sizeType: "ropa", coverImage: "2_r8gpoMBuA" },
  { id: "remeras", name: "Remeras", sizeType: "ropa", coverImage: "9rHCmr2YKdY" },
  { id: "jeans", name: "Jeans", sizeType: "pantalon", coverImage: "biTorBFzfFg" },
  { id: "bermudas", name: "Bermudas", sizeType: "pantalon", coverImage: "zCeYxaGi5GU" },
  { id: "sweaters", name: "Sweaters", sizeType: "ropa", coverImage: "JSyMOOsk0K8" },
  { id: "accesorios", name: "Accesorios", sizeType: "unico", coverImage: "bsLne1Rufsw" },
];

// Curvas de talles por tipo de prenda
export const sizeCurves = {
  ropa: ["S", "M", "L", "XL", "XXL"],
  pantalon: ["38", "40", "42", "44", "46", "48"],
  calzado: ["38", "39", "40", "41", "42", "43", "44"],
  unico: ["Único"],
};

export const brands = ["Nike", "Adidas", "Vans", "Lacoste", "Levi's", "BoosT32"];
