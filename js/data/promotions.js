// Datos de ejemplo — Promociones y cupones

export const promotions = [
  { id: "promo1", code: "BOOST10", description: "10% off en toda la tienda", type: "percent", value: 10, minPurchase: 0, uses: 84, maxUses: 200, endsInDays: 30, active: true },
  { id: "promo2", code: "TRANSFE15", description: "15% off pagando por transferencia", type: "percent", value: 15, minPurchase: 0, uses: 132, maxUses: null, endsInDays: null, active: true },
  { id: "promo3", code: "ENVIOGRATIS", description: "Envío gratis en compras desde $150.000", type: "shipping", value: 0, minPurchase: 150000, uses: 57, maxUses: null, endsInDays: 15, active: true },
  { id: "promo4", code: "CYBER25", description: "25% off — CyberMonday", type: "percent", value: 25, minPurchase: 80000, uses: 0, maxUses: 300, endsInDays: 4, active: false },
  { id: "promo5", code: "BIENVENIDA", description: "$5.000 off en tu primera compra", type: "fixed", value: 5000, minPurchase: 40000, uses: 41, maxUses: null, endsInDays: null, active: true },
];
