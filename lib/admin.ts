import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** Call at the top of every admin page AND every admin server action. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");
  return session.user;
}
