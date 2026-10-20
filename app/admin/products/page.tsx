import { prisma } from "@/lib/prisma";
import { inr } from "@/lib/utils";
import ProductForm from "./ProductForm";
import { deleteProduct, toggleActive } from "./actions";

const messages: Record<string, string> = {
  saved: "Product saved.",
  hidden: "This product is in past orders, so it was hidden instead of deleted.",
  deleted: "Product deleted.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const [{ msg }, products, categories] = await Promise.all([
    searchParams,
    prisma.product.findMany({
      include: { category: true, variants: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
  ]);
  const categoryNames = categories.map((category) => category.name);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Store inventory</p>
          <h1 className="mt-1 text-3xl font-semibold">Products</h1>
        </div>
        <p className="text-sm text-neutral-500">{products.length} items</p>
      </div>

      {msg && messages[msg] && (
        <p role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {messages[msg]}
        </p>
      )}

      <details className="group border border-neutral-300 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-medium">
          <span><span className="mr-2 text-lg text-green-800">+</span>Add product</span>
          <span className="text-sm text-neutral-500 group-open:hidden">Open form</span>
          <span className="hidden text-sm text-neutral-500 group-open:inline">Close form</span>
        </summary>
        <div className="border-t border-neutral-200 p-4">
          <ProductForm categories={categoryNames} />
        </div>
      </details>

      <section aria-label="Product inventory" className="divide-y divide-neutral-200 border-y border-neutral-200">
        {products.map((product) => {
          const totalStock = product.variants.reduce((total, variant) => total + variant.stock, 0);

          return (
            <article key={product.id} className="bg-white py-4">
              <div className="flex flex-wrap items-center justify-between gap-4 px-3">
                <div className="min-w-48">
                  <p className="text-xs text-neutral-500">{product.category.name}</p>
                  <h2 className="mt-1 font-medium">{product.name}</h2>
                  <p className="mt-1 text-sm text-neutral-600">{inr(product.price)} <span className="mx-1 text-neutral-300">·</span> {totalStock} in stock</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={product.isActive ? "text-xs text-green-800" : "text-xs text-neutral-500"}>
                    {product.isActive ? "Visible" : "Hidden"}
                  </span>
                  <form action={toggleActive.bind(null, product.id)}>
                    <button className="border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50">
                      {product.isActive ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <button className="px-2 py-2 text-xs text-red-700 hover:underline">Delete</button>
                  </form>
                </div>
              </div>

              <details className="group mt-3 px-3">
                <summary className="cursor-pointer text-xs text-neutral-600 underline decoration-neutral-300 underline-offset-4">
                  Edit product and stock
                </summary>
                <div className="pt-4">
                  <ProductForm
                    categories={categoryNames}
                    product={{
                      id: product.id,
                      name: product.name,
                      category: product.category.name,
                      description: product.description,
                      price: product.price / 100,
                      isActive: product.isActive,
                      images: product.images,
                      variants: product.variants.map(({ size, color, stock }) => ({ size, color, stock })),
                    }}
                  />
                </div>
              </details>
            </article>
          );
        })}
        {products.length === 0 && <p className="bg-white p-6 text-sm text-neutral-600">No products yet. Add your first product above.</p>}
      </section>
    </main>
  );
}
