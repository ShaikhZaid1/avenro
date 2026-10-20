"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { inr } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: { name: string; slug: string };
  variants: { id: string; size: string; color: string; stock: number }[];
};

type Category = { id: string; name: string; slug: string };
type CartLine = { variantId: string; quantity: number };
type CartProduct = { product: Product; variant: Product["variants"][number]; quantity: number };

const cartStorageKey = "avenro-demo-cart";

const categoryImages: Record<string, string> = {
  jeans: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=85",
  shirts: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=85",
  pants: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85",
  trousers: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=85",
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
  bottoms: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=85",
};

const sampleDescriptions: Record<string, string> = {
  "boxy-oxford-shirt": "A crisp oxford with an easy drape for everyday wear.",
  "everyday-tee": "A soft cotton staple with a relaxed, dependable fit.",
  "pleated-chinos": "Roomy pleats and a clean leg make these an easy daily trouser.",
  "straight-leg-denim": "Classic indigo denim in a comfortable straight-leg cut.",
  "relaxed-cotton-shirt": "Lightweight cotton and a relaxed shape for easy layering.",
  "everyday-trousers": "Versatile charcoal trousers with a comfortable straight fit.",
  "heavyweight-pocket-tee": "A substantial cotton tee finished with a practical chest pocket.",
  "weekend-cargo-pants": "Relaxed utility pants with useful pockets and an easy fit.",
};

export default function StorefrontShop({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialCategory: string;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"gpay" | "phonepe">("gpay");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let restoredCart: CartLine[] = [];
    try {
      const saved = localStorage.getItem(cartStorageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          restoredCart = parsed.filter((line): line is CartLine =>
            typeof line?.variantId === "string" && Number.isInteger(line?.quantity) && line.quantity > 0,
          );
        }
      }
    } catch {}
    startTransition(() => {
      setCart(restoredCart);
      setCartReady(true);
    });
  }, []);

  useEffect(() => {
    if (cartReady) localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, cartReady]);

  const filteredProducts = initialCategory
    ? products.filter((product) => product.category.slug === initialCategory)
    : products;

  const cartProducts: CartProduct[] = cart.flatMap((line) => {
    const product = products.find((item) => item.variants.some((variant) => variant.id === line.variantId));
    const variant = product?.variants.find((item) => item.id === line.variantId);
    return product && variant ? [{ product, variant, quantity: line.quantity }] : [];
  });

  const cartCount = cartProducts.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartProducts.reduce((total, line) => total + line.product.price * line.quantity, 0);

  function addToCart(variantId: string) {
    const variant = products.flatMap((product) => product.variants).find((item) => item.id === variantId);
    if (!variant || variant.stock < 1) return;

    const existing = cart.find((line) => line.variantId === variantId);
    if (existing && existing.quantity >= variant.stock) {
      setNotice("Cart quantity is at the available stock limit.");
      setCartOpen(true);
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.variantId === variantId);
      return existing
        ? current.map((line) => line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { variantId, quantity: 1 }];
    });
    setCheckoutOpen(false);
    setNotice("Added to your bag.");
    setCartOpen(true);
  }

  function changeQuantity(variantId: string, amount: number) {
    const line = cart.find((item) => item.variantId === variantId);
    const variant = products.flatMap((product) => product.variants).find((item) => item.id === variantId);
    if (!line || !variant) return;
    const nextQuantity = Math.min(variant.stock, Math.max(1, line.quantity + amount));
    setCart((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity: nextQuantity } : item));
  }

  function removeFromCart(variantId: string) {
    setCart((current) => current.filter((line) => line.variantId !== variantId));
  }

  return (
    <>
      <nav className="store-filters" aria-label="Filter by category">
        <Link className={!initialCategory ? "store-filter is-active" : "store-filter"} href="/#shop">All pieces</Link>
        {categories.map((category) => (
          <Link
            className={initialCategory === category.slug ? "store-filter is-active" : "store-filter"}
            href={`/?category=${encodeURIComponent(category.slug)}#shop`}
            key={category.id}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {filteredProducts.length > 0 ? (
        <div className="store-grid">
          {filteredProducts.map((product, index) => {
            const image = product.images[0] || categoryImages[product.category.slug] || categoryImages.shirts;
            const description = product.description === "Sample product. Edit it from the admin panel."
              ? sampleDescriptions[product.slug] || product.description
              : product.description;
            const availableVariant = product.variants.find((variant) => variant.stock > 0);
            const selectedId = selectedVariants[product.id] ?? availableVariant?.id ?? product.variants[0]?.id ?? "";
            const selectedVariant = product.variants.find((variant) => variant.id === selectedId);
            const totalStock = product.variants.reduce((total, variant) => total + variant.stock, 0);

            return (
              <article className="store-product" key={product.id}>
                <div className="store-product-image-wrap">
                  <Image
                    src={image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="store-product-image"
                  />
                  <span className="store-product-index">{String(index + 1).padStart(2, "0")}</span>
                  {totalStock === 0 && <span className="store-stock-badge">Sold out</span>}
                </div>
                <div className="store-product-meta">
                  <div>
                    <p className="store-product-category">{product.category.name}</p>
                    <h3>{product.name}</h3>
                  </div>
                  <p className="store-product-price">{inr(product.price)}</p>
                </div>
                <p className="store-product-description">{description}</p>
                <div className="store-product-bottom">
                  <p className="store-sizes">{product.variants.length ? `Sizes ${[...new Set(product.variants.map((variant) => variant.size))].join(" · ")}` : "Sizes coming soon"}</p>
                  <p className="store-stock">{totalStock > 0 ? "In stock" : "Unavailable"}</p>
                </div>
                <div className="store-buy-controls">
                  <label className="store-variant-select">
                    <span>Size / colour</span>
                    <select
                      aria-label={`Size and colour for ${product.name}`}
                      value={selectedId}
                      onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))}
                    >
                      {product.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.size} · {variant.color}{variant.stock < 1 ? " · Sold out" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="store-add-button"
                    type="button"
                    disabled={!selectedVariant || selectedVariant.stock < 1}
                    onClick={() => selectedVariant && addToCart(selectedVariant.id)}
                  >
                    {totalStock > 0 ? "Add to bag" : "Sold out"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="store-empty">
          <p>No pieces in this category yet.</p>
          <Link href="/#shop">See all pieces</Link>
        </div>
      )}

      <button className="store-cart-trigger" type="button" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${cartCount} items`}>
        <span aria-hidden="true">Bag</span><span className="store-cart-count">{cartCount}</span>
      </button>

      {cartOpen && (
        <div className="store-cart-layer">
          <button className="store-cart-backdrop" type="button" onClick={() => setCartOpen(false)} aria-label="Close shopping bag" />
          <aside className="store-cart-panel" role="dialog" aria-modal="true" aria-labelledby="store-cart-title">
            <div className="store-cart-heading">
              <div>
                <p className="store-eyebrow">AVENRO BAG</p>
                <h2 id="store-cart-title">{checkoutOpen ? "Checkout" : `Your bag (${cartCount})`}</h2>
              </div>
              <button className="store-cart-close" type="button" onClick={() => setCartOpen(false)} aria-label="Close bag">×</button>
            </div>

            {checkoutOpen ? (
              <div className="store-checkout-content">
                <button className="store-back-to-bag" type="button" onClick={() => { setCheckoutOpen(false); setNotice(""); }}>← Back to bag</button>
                <h3>Choose a demo payment option</h3>
                <p className="store-demo-note">Demo checkout only. No payment app will open and no money will be charged.</p>
                <div className="store-payment-options" role="radiogroup" aria-label="Demo payment method">
                  <button type="button" role="radio" aria-checked={paymentMethod === "gpay"} className={paymentMethod === "gpay" ? "store-payment-option is-selected" : "store-payment-option"} onClick={() => { setPaymentMethod("gpay"); setNotice(""); }}>
                    <span className="store-payment-mark store-gpay-mark">G</span><span>Google Pay</span><span className="store-radio-dot" />
                  </button>
                  <button type="button" role="radio" aria-checked={paymentMethod === "phonepe"} className={paymentMethod === "phonepe" ? "store-payment-option is-selected" : "store-payment-option"} onClick={() => { setPaymentMethod("phonepe"); setNotice(""); }}>
                    <span className="store-payment-mark store-phonepe-mark">पे</span><span>PhonePe</span><span className="store-radio-dot" />
                  </button>
                </div>
                <div className="store-demo-total"><span>Demo total</span><strong>{inr(subtotal)}</strong></div>
                {notice && <p className="store-demo-result" role="status">{notice}</p>}
                <button className="store-demo-pay" type="button" onClick={() => setNotice(`${paymentMethod === "gpay" ? "Google Pay" : "PhonePe"} demo selected. No payment was processed.`)}>
                  Continue with {paymentMethod === "gpay" ? "Google Pay" : "PhonePe"}
                </button>
              </div>
            ) : cartProducts.length > 0 ? (
              <>
                <div className="store-cart-lines">
                  {cartProducts.map(({ product, variant, quantity }) => (
                    <article className="store-cart-line" key={variant.id}>
                      <div className="store-cart-thumb">
                        <Image src={product.images[0] || categoryImages[product.category.slug] || categoryImages.shirts} alt="" fill sizes="72px" />
                      </div>
                      <div className="store-cart-line-info">
                        <h3>{product.name}</h3>
                        <p>{variant.size} · {variant.color}</p>
                        <strong>{inr(product.price)}</strong>
                        <div className="store-quantity-control" aria-label={`Quantity for ${product.name}`}>
                          <button type="button" onClick={() => changeQuantity(variant.id, -1)} aria-label="Decrease quantity">−</button>
                          <span>{quantity}</span>
                          <button type="button" onClick={() => changeQuantity(variant.id, 1)} disabled={quantity >= variant.stock} aria-label="Increase quantity">+</button>
                        </div>
                      </div>
                      <button className="store-remove-line" type="button" onClick={() => removeFromCart(variant.id)} aria-label={`Remove ${product.name}`}>Remove</button>
                    </article>
                  ))}
                </div>
                <div className="store-cart-summary">
                  <div><span>Subtotal</span><strong>{inr(subtotal)}</strong></div>
                  <p>Shipping and final payment are not applied in this demo.</p>
                  {notice && <p className="store-cart-notice" role="status">{notice}</p>}
                  <button className="store-checkout-button" type="button" onClick={() => { setCheckoutOpen(true); setNotice(""); }}>Continue to checkout</button>
                </div>
              </>
            ) : (
              <div className="store-cart-empty">
                <p>Your bag is empty.</p>
                <button type="button" onClick={() => setCartOpen(false)}>Continue shopping</button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}