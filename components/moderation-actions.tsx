"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModerationActions({
  approveUrl,
  rejectUrl,
}: {
  approveUrl: string;
  rejectUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const act = async (url: string, label: "approve" | "reject") => {
    setBusy(label);
    setErr(null);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={() => act(approveUrl, "approve")}
        disabled={busy !== null}
        className="bg-sage hover:bg-sage/90 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {busy === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => act(rejectUrl, "reject")}
        disabled={busy !== null}
        className="border-rule hover:border-ink/30 rounded-md border bg-white px-4 py-2 text-sm transition-colors disabled:opacity-50"
      >
        {busy === "reject" ? "Rejecting…" : "Reject"}
      </button>
      {err && <span className="text-sm text-red-700">{err}</span>}
    </div>
  );
}
