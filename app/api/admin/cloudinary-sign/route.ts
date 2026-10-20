import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    return Response.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "avenro";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  return Response.json({ signature, timestamp, folder, cloudName, apiKey });
}