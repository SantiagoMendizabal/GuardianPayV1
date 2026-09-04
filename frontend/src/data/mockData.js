export const INITIAL_USER = {
  name: "Anthony Luque",
  phone: "987654321",
  pin: "123456",
  balance: 1450.00,
  accountNumber: "8492-3021-9941",
  avatar: "AL"
};

export const INITIAL_TRANSACTIONS = [
  {
    id: "tx-101",
    title: "Supermercado Metro",
    category: "Compras",
    date: "Hoy, 11:20 AM",
    amount: -45.50,
    type: "egreso",
    recipient: "Metro Perú S.A.",
    phone: "912345678",
    riskScore: 4,
    status: "completado"
  },
  {
    id: "tx-102",
    title: "María Quispe (Mamá)",
    category: "Familia",
    date: "Ayer, 06:15 PM",
    amount: 150.00,
    type: "ingreso",
    recipient: "María Quispe",
    phone: "976543210",
    riskScore: 2,
    status: "completado"
  },
  {
    id: "tx-103",
    title: "Cafetería Starbucks",
    category: "Alimentos",
    date: "01 Sep, 09:30 AM",
    amount: -22.00,
    type: "egreso",
    recipient: "Delosi Perú",
    phone: "955443322",
    riskScore: 5,
    status: "completado"
  }
];

export const FREQUENT_CONTACTS = [
  { name: "Lucía Gómez", phone: "981234567", initial: "LG", color: "bg-pink-500" },
  { name: "Carlos Mendoza", phone: "971889922", initial: "CM", color: "bg-blue-500" },
  { name: "Mamá (María Q.)", phone: "976543210", initial: "MQ", color: "bg-emerald-500" },
  { name: "Pedro Soto", phone: "943219876", initial: "PS", color: "bg-amber-500" }
];
