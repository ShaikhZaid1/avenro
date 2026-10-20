import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export class OutOfStockError extends Error {}

type Line = { variantId: string; quantity: number };

/**
 * Reduce stock for every line in ONE transaction.
 * The `stock >= quantity` condition runs inside the database UPDATE itself,
 * so two buyers can never take the last item. If any line fails, nothing changes.
 * Call this only after payment is verified (or when a COD order is placed).
 */
export async function reserveStock(lines: Line[], tx?: Prisma.TransactionClient) {
  const run = async (db: Prisma.TransactionClient) => {
    for (const { variantId, quantity } of lines) {
      const res = await db.productVariant.updateMany({
        where: { id: variantId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (res.count === 0) throw new OutOfStockError(`Variant ${variantId} is out of stock`);
    }
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/** Put stock back (cancelled or RTO orders). */
export async function restoreStock(lines: Line[]) {
  await prisma.$transaction(
    lines.map((l) =>
      prisma.productVariant.update({ where: { id: l.variantId }, data: { stock: { increment: l.quantity } } })
    )
  );
}

/** A product shows "Sold out" when every variant has 0 stock. */
export const isSoldOut = (variants: { stock: number }[]) => variants.every((v) => v.stock <= 0);
