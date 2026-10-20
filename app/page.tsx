
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StorefrontShop from "./StorefrontShop";

const heroImage = "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2200&q=90";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products, session] = await Promise.all([
    prisma.category.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: true,
        variants: { select: { id: true, size: true, color: true, stock: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    auth(),
  ]);

  return (
    <main className="storefront">
      <div className="store-announcement">FREE SHIPPING ON ORDERS OVER ₹2,500</div>
      <header className="store-header">
        <Link className="store-wordmark" href="/" aria-label="Avenro home">AVENRO<span>.</span></Link>
        <nav className="store-nav" aria-label="Main navigation">
          <Link href="/#shop">Shop</Link>
          <Link href="/#story">Our approach</Link>
        </nav>
        <Link className="store-account" href={session?.user?.role === "ADMIN" ? "/admin" : "/login"}>
          {session?.user?.role === "ADMIN" ? "Manage store" : "Sign in"}
          <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="store-hero" aria-label="Avenro everyday clothing collection">
        <Image
          src={heroImage}
          alt="A model wearing a considered everyday outfit"
          fill
          priority
          sizes="100vw"
          className="store-hero-image"
        />
        <div className="store-hero-shade" />
        <div className="store-hero-copy">
          <p className="store-eyebrow">THE EVERYDAY EDIT · 2026</p>
          <h1>Your fashion,<br />our passion.</h1>
          <p>Easy pieces, thoughtful details, and room to make them your own.</p>
          <Link className="store-hero-link" href="#shop">Explore the collection <span aria-hidden="true">↓</span></Link>
        </div>
        <p className="store-hero-note">DESIGNED TO BE WORN ON REPEAT</p>
      </section>

      <section className="store-collection" id="shop">
        <div className="store-section-heading">
          <div>
            <p className="store-eyebrow">THE AVENRO LINEUP</p>
            <h2>Good things, in rotation.</h2>
          </div>
          <p className="store-product-count">{products.length} pieces</p>
        </div>

        <StorefrontShop products={products} categories={categories} initialCategory={category ?? ""} key={category ?? "all"} />
      </section>

      <section className="store-story" id="story">
        <p className="store-eyebrow">LESS, BUT BETTER</p>
        <h2>Clothes for real life.<br />Not just the highlight reel.</h2>
        <p>Comfortable fits, useful details, and pieces that work hard in your wardrobe.</p>
      </section>

      <footer className="store-footer">
        <div className="store-footer-brand">
          <Link className="store-wordmark" href="/">AVENRO<span>.</span></Link>
          <p>Everyday wear, considered.</p>
        </div>
        <div className="store-footer-credit">
          <span>Developed by <strong>Zaid Shaikh</strong></span>
          <div className="store-footer-contact" aria-label="Contact Zaid Shaikh">
            <a href="https://www.linkedin.com/in/zaid-shaikh-103171377/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
            <a href="https://github.com/ShaikhZaid1" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            <a href="mailto:zaidshaikh8928915@gmail.com">Gmail <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <Link className="store-footer-account" href="/login">Account</Link>
      </footer>
    </main>
  );
}
