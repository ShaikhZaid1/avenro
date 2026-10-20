import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  async function login(fd: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: fd.get("email"),
        password: fd.get("password"),
        redirectTo: "/",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e; // lets the success redirect through
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-100 p-4">
      <form action={login} className="w-full max-w-sm bg-white p-6 rounded-lg shadow space-y-4">
        <h1 className="text-2xl font-bold tracking-widest">AVENRO</h1>
        <p className="text-sm text-neutral-500">Log in to continue</p>
        {error && <p className="text-sm text-red-600">Wrong email or password.</p>}
        <input name="email" type="email" required placeholder="Email" className="w-full border rounded p-2" />
        <input name="password" type="password" required placeholder="Password" className="w-full border rounded p-2" />
        <button className="w-full bg-black text-white rounded p-2">Log in</button>
      </form>
    </main>
  );
}
