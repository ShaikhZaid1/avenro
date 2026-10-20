import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SIZES = ["S", "M", "L", "XL"];
const WAIST_SIZES = ["30", "32", "34", "36"];

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Admin", email, passwordHash: await bcrypt.hash(password, 12), role: "ADMIN" },
  });

  const items = [
    { name: "Boxy Oxford Shirt", cat: "Shirts", price: 179900, color: "Blue", description: "A crisp oxford with an easy drape for everyday wear.", stock: [5, 8, 6, 2] },
    { name: "Everyday Tee", cat: "T-shirts", price: 79900, color: "Green", description: "A soft cotton staple with a relaxed, dependable fit.", stock: [12, 15, 9, 0] },
    { name: "Pleated Chinos", cat: "Bottoms", price: 219900, color: "Khaki", description: "Roomy pleats and a clean leg make these an easy daily trouser.", stock: [0, 4, 4, 3] },
    { name: "Straight-Leg Denim", cat: "Jeans", price: 249900, color: "Indigo", description: "Classic indigo denim in a comfortable straight-leg cut.", sizes: WAIST_SIZES, stock: [7, 10, 8, 4] },
    { name: "Relaxed Cotton Shirt", cat: "Shirts", price: 189900, color: "Ecru", description: "Lightweight cotton and a relaxed shape for easy layering.", stock: [5, 8, 6, 3] },
    { name: "Everyday Trousers", cat: "Pants", price: 199900, color: "Charcoal", description: "Versatile charcoal trousers with a comfortable straight fit.", sizes: WAIST_SIZES, stock: [4, 8, 7, 3] },
    { name: "Heavyweight Pocket Tee", cat: "T-shirts", price: 89900, color: "White", description: "A substantial cotton tee finished with a practical chest pocket.", stock: [9, 12, 8, 5] },
    { name: "Weekend Cargo Pants", cat: "Pants", price: 229900, color: "Olive", description: "Relaxed utility pants with useful pockets and an easy fit.", sizes: WAIST_SIZES, stock: [3, 7, 6, 2] },
  ];

  for (const it of items) {
    const slug = it.name.toLowerCase().replace(/\s+/g, "-");
    const category = await prisma.category.upsert({
      where: { slug: it.cat.toLowerCase() },
      update: {},
      create: { name: it.cat, slug: it.cat.toLowerCase() },
    });
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { description: true },
    });
    await prisma.product.upsert({
      where: { slug },
      update: existing?.description === "Sample product. Edit it from the admin panel."
        ? { description: it.description }
        : {},
      create: {
        name: it.name, slug, description: it.description,
        price: it.price, images: [], categoryId: category.id,
        variants: { create: (it.sizes ?? SIZES).map((size, i) => ({ size, color: it.color, sku: `${slug}-${size}-${it.color}`.toUpperCase(), stock: it.stock[i] })) },
      },
    });
  }
  console.log("Seeded admin user and sample products.");
}

main().finally(() => prisma.$disconnect());
