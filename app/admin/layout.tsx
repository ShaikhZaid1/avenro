import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-black text-white px-4 py-3 flex items-center gap-6">
        <span className="font-bold tracking-widest">AVENRO ADMIN</span>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/products">Products</Link>
        <form
          className="ml-auto"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm underline">Log out</button>
        </form>
      </nav>
      <div className="max-w-5xl mx-auto p-4">{children}</div>
    </div>
  );
}