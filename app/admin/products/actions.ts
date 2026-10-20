"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Variant = { size: string; color: string; stock: number };
type State = { error?: string };

const refresh = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
};

export async function saveProduct(_prev: State, fd: FormData): Promise<State> {
  await requireAdmin();

  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const categoryName = String(fd.get("category") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const price = Math.round(Number(fd.get("price")) * 100); // rupees -> paise
  const isActive = fd.get("isActive") === "on";

  let images: string[] = [];
  let variants: Variant[] = [];
  try {
    images = JSON.parse(String(fd.get("images") ?? "[]"));
    variants = JSON.parse(String(fd.get("variants") ?? "[]"));
  } catch {
    return { error: "Invalid form data." };
  }

  if (!name) return { error: "Enter a product name." };
  if (!categoryName) return { error: "Enter a category." };
  if (!Number.isInteger(price) || price <= 0) return { error: "Enter a valid price." };
  if (!images.every((u) => typeof u === "string" && u.startsWith("https://res.cloudinary.com/"))) return { error: "Invalid image." };
  if (variants.length === 0) return { error: "Add at least one size." };

  const seen = new Set<string>();
  for (const v of variants) {
    v.size = String(v.size).trim();
    v.color = String(v.color).trim();
    if (!v.size || !v.color) return { error: "Every size row needs a size and a colour." };
    if (!Number.isInteger(v.stock) || v.stock < 0) return { error: "Stock must be 0 or more." };
    const key = `${v.size}|${v.color}`.toLowerCase();
    if (seen.has(key)) return { error: `Duplicate row: ${v.size} / ${v.color}.` };
    seen.add(key);
  }

  await prisma.$transaction(async (tx) => {
    const catSlug = slugify(categoryName);
    const category = await tx.category.upsert({
      where: { slug: catSlug },
      update: {},
      create: { name: categoryName, slug: catSlug },
    });

    let productId = id;
    let slug = "";
    if (id) {
      const p = await tx.product.update({
        where: { id },
        data: { name, description, price, images, isActive, categoryId: category.id },
      });
      slug = p.slug;
    } else {
      const base = slugify(name);
      const exists = await tx.product.findUnique({ where: { slug: base } });
      slug = exists ? `${base}-${Date.now().toString(36)}` : base;
      const p = await tx.product.create({
        data: { name, slug, description, price, images, isActive, categoryId: category.id },
      });
      productId = p.id;
    }

    for (const v of variants) {
      await tx.productVariant.upsert({
        where: { productId_size_color: { productId, size: v.size, color: v.color } },
        update: { stock: v.stock },
        create: {
          productId, size: v.size, color: v.color, stock: v.stock,
          sku: `${slug}-${v.size}-${v.color}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
        },
      });
    }
    // Rows removed in the form are set to 0 stock, not deleted, because old orders still reference them.
    await tx.productVariant.updateMany({
      where: { productId, NOT: variants.map((v) => ({ size: v.size, color: v.color })) },
      data: { stock: 0 },
    });
  });

  refresh();
  redirect("/admin/products?msg=saved");
}

export async function toggleActive(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { isActive: !p.isActive } });
  refresh();
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const used = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (used > 0) {
    // Past orders need this product's records, so hide it instead of deleting.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    refresh();
    redirect("/admin/products?msg=hidden");
  }
  await prisma.product.delete({ where: { id } });
  refresh();
  redirect("/admin/products?msg=deleted");
}
