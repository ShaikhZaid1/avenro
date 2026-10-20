"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/app/admin/products/actions";
import ImageUploader from "./ImageUploader";

type Variant = { size: string; color: string; stock: number };
export type ProductInitial = {
  id?: string; name: string; category: string; description: string;
  price: number; // rupees
  isActive: boolean; images: string[]; variants: Variant[];
};

const EMPTY: ProductInitial = {
  name: "", category: "", description: "", price: 0, isActive: true, images: [],
  variants: ["S", "M", "L", "XL"].map((size) => ({ size, color: "", stock: 0 })),
};

export default function ProductForm({ categories, product = EMPTY }: { categories: string[]; product?: ProductInitial }) {
  const [state, action, pending] = useActionState(saveProduct, {} as { error?: string });
  const [images, setImages] = useState(product.images);
  const [variants, setVariants] = useState(product.variants);
  const setV = (i: number, patch: Partial<Variant>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const input = "w-full border rounded p-2";

  return (
    <form action={action} className="bg-white border rounded-lg p-4 space-y-4 max-w-2xl">
      <input type="hidden" name="id" value={product.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <label className="block text-sm">Name<input name="name" defaultValue={product.name} className={input} required /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">Category
          <input name="category" list="cats" defaultValue={product.category} className={input} required />
          <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="block text-sm">Price (₹)<input name="price" type="number" min="1" step="1" defaultValue={product.price || ""} className={input} required /></label>
      </div>
      <label className="block text-sm">Description<textarea name="description" rows={3} defaultValue={product.description} className={input} /></label>

      <div><div className="text-sm mb-1">Photos (first one is the main photo)</div><ImageUploader value={images} onChange={setImages} /></div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">Sizes, colours and stock. Set stock to 0 for sold out.</span>
          <input placeholder="Colour for all rows" className="border rounded p-1 text-sm" onChange={(e) => setVariants((vs) => vs.map((v) => ({ ...v, color: e.target.value })))} />
        </div>
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_1fr_auto] gap-2">
              <input aria-label="Size" value={v.size} onChange={(e) => setV(i, { size: e.target.value })} className={input} placeholder="Size" />
              <input aria-label="Colour" value={v.color} onChange={(e) => setV(i, { color: e.target.value })} className={input} placeholder="Colour" />
              <input aria-label="Stock" type="number" min="0" value={v.stock} onChange={(e) => setV(i, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} className={input} />
              <button type="button" className="text-red-600 px-2" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm underline" onClick={() => setVariants((vs) => [...vs, { size: "", color: vs[0]?.color ?? "", stock: 0 }])}>+ Add size row</button>
      </div>

      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={product.isActive} /> Show on website</label>
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button disabled={pending} className="bg-black text-white rounded px-5 py-2 disabled:opacity-50">{pending ? "Saving…" : "Save product"}</button>
    </form>
  );
}
