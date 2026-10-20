
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8 bg-neutral-100">
      <h1 className="text-3xl font-bold">AVENRO Admin</h1>
      <p className="mt-4">
        Welcome, {session.user.email}
      </p>
      <p className="mt-2 text-neutral-600">
        You are logged in successfully.
      </p>
    </main>
  );
}
