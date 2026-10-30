// Datos de ejemplo — Pedidos
// Las fechas son relativas a "hoy" (daysAgo / hour) para que el demo
// siempre se vea actualizado, sin importar cuándo lo muestres.

export const ORDER_STATUSES = [
  { id: "pendiente", label: "Pendiente", tone: "warning" },
  { id: "pagado", label: "Pagado", tone: "info" },
  { id: "enviado", label: "Enviado", tone: "accent" },
  { id: "entregado", label: "Entregado", tone: "success" },
  { id: "cancelado", label: "Cancelado", tone: "danger" },
];

export const PAYMENT_METHODS = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  efectivo: "Efectivo (en local)",
};

export const SHIPPING_METHODS = {
  andreani: "Andreani",
  correo: "Correo Argentino",
  retiro: "Retiro en local",
  moto: "Moto (Tucumán)",
};

// items: [productId, talle, cantidad]
export const orders = [
  { id: "1048", customerId: "c11", daysAgo: 0, hour: "11:42", status: "pendiente", payment: "transferencia", shipping: "correo", items: [["p006", "41", 1], ["p027", "Único", 1]], shippingCost: 8500 },
  { id: "1047", customerId: "c01", daysAgo: 0, hour: "10:15", status: "pagado", payment: "mercadopago", shipping: "moto", items: [["p001", "42", 1]], shippingCost: 3000 },
  { id: "1046", customerId: "c03", daysAgo: 0, hour: "09:03", status: "pagado", payment: "mercadopago", shipping: "andreani", items: [["p009", "L", 1], ["p019", "42", 1]], shippingCost: 9900 },
  { id: "1045", customerId: "c07", daysAgo: 1, hour: "20:31", status: "pendiente", payment: "transferencia", shipping: "retiro", items: [["p015", "M", 3]], shippingCost: 0 },
  { id: "1044", customerId: "c02", daysAgo: 1, hour: "18:12", status: "enviado", payment: "mercadopago", shipping: "andreani", items: [["p004", "39", 1], ["p017", "S", 1]], shippingCost: 9900 },
  { id: "1043", customerId: "c05", daysAgo: 1, hour: "12:47", status: "enviado", payment: "mercadopago", shipping: "correo", items: [["p013", "M", 1]], shippingCost: 8500 },
  { id: "1042", customerId: "c10", daysAgo: 2, hour: "17:20", status: "entregado", payment: "efectivo", shipping: "retiro", items: [["p025", "Único", 2], ["p015", "L", 1]], shippingCost: 0 },
  { id: "1041", customerId: "c04", daysAgo: 2, hour: "15:05", status: "enviado", payment: "mercadopago", shipping: "andreani", items: [["p003", "40", 1]], shippingCost: 9900 },
  { id: "1040", customerId: "c08", daysAgo: 3, hour: "21:44", status: "cancelado", payment: "transferencia", shipping: "correo", items: [["p014", "M", 1]], shippingCost: 8500 },
  { id: "1039", customerId: "c06", daysAgo: 3, hour: "11:30", status: "entregado", payment: "mercadopago", shipping: "andreani", items: [["p011", "L", 1], ["p021", "42", 1]], shippingCost: 9900 },
  { id: "1038", customerId: "c09", daysAgo: 4, hour: "19:10", status: "entregado", payment: "mercadopago", shipping: "correo", items: [["p018", "42", 1], ["p016", "M", 1]], shippingCost: 8500 },
  { id: "1037", customerId: "c01", daysAgo: 4, hour: "10:55", status: "entregado", payment: "transferencia", shipping: "moto", items: [["p010", "M", 1], ["p027", "Único", 2]], shippingCost: 3000 },
  { id: "1036", customerId: "c03", daysAgo: 5, hour: "16:40", status: "entregado", payment: "mercadopago", shipping: "andreani", items: [["p002", "41", 1]], shippingCost: 9900 },
  { id: "1035", customerId: "c07", daysAgo: 5, hour: "13:02", status: "entregado", payment: "efectivo", shipping: "retiro", items: [["p006", "40", 1], ["p015", "S", 2]], shippingCost: 0 },
  { id: "1034", customerId: "c02", daysAgo: 6, hour: "18:25", status: "entregado", payment: "mercadopago", shipping: "andreani", items: [["p012", "M", 1], ["p026", "Único", 1]], shippingCost: 9900 },
  { id: "1033", customerId: "c04", daysAgo: 6, hour: "09:48", status: "entregado", payment: "transferencia", shipping: "correo", items: [["p023", "L", 1], ["p019", "40", 1]], shippingCost: 8500 },
  { id: "1032", customerId: "c05", daysAgo: 8, hour: "14:14", status: "entregado", payment: "mercadopago", shipping: "correo", items: [["p004", "41", 1]], shippingCost: 8500 },
  { id: "1031", customerId: "c06", daysAgo: 11, hour: "19:33", status: "entregado", payment: "mercadopago", shipping: "andreani", items: [["p001", "40", 1], ["p017", "M", 2]], shippingCost: 9900 },
  { id: "1030", customerId: "c10", daysAgo: 14, hour: "12:00", status: "entregado", payment: "efectivo", shipping: "retiro", items: [["p021", "40", 1], ["p025", "Único", 1]], shippingCost: 0 },
  { id: "1029", customerId: "c09", daysAgo: 18, hour: "17:47", status: "entregado", payment: "mercadopago", shipping: "correo", items: [["p009", "M", 1]], shippingCost: 8500 },
];
