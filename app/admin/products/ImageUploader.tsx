"use client";

import { useState } from "react";

export default function ImageUploader({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) throw new Error("Only images under 5 MB are allowed.");
        const sign = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
        if (!sign.ok) throw new Error("You are not allowed to upload.");
        const s = await sign.json();
        const fd = new FormData();
        fd.append("file", f);
        fd.append("api_key", s.apiKey);
        fd.append("timestamp", String(s.timestamp));
        fd.append("folder", s.folder);
        fd.append("signature", s.signature);
        const r = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error?.message ?? "Upload failed.");
        urls.push(j.secure_url);
      }
      onChange([...value, ...urls]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {value.map((url, i) => (
          <div key={url} className="w-24 text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-24 h-28 object-cover rounded border" />
            {i === 0 ? <div className="text-center text-green-700">Main</div> : (
              <button type="button" className="underline" onClick={() => onChange([url, ...value.filter((u) => u !== url)])}>Make main</button>
            )}
            <button type="button" className="underline text-red-600 ml-1" onClick={() => onChange(value.filter((u) => u !== url))}>Remove</button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => upload(e.target.files)} />
      {busy && <p className="text-sm text-neutral-500">Uploading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
